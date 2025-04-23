(ns io.relica.prism.statechart
  (:require [statecharts.core :as fsm]
            [taoensso.timbre :as log]))

;; Placeholder actions - these will eventually trigger real work
(defn check-db-action [& _] (log/info "[Action] Checking database..."))
(defn create-user-action [& _] (log/info "[Action] Creating admin user..."))
(defn seed-db-action [& _] (log/info "[Action] Starting DB seed..."))
(defn build-caches-action [& _] (log/info "[Action] Starting cache build..."))
(defn report-error-action [_ context event] (log/error "[Action] Error occurred:" (:error-message context) "Event:" event))
(defn log-entry [state-id] (fn [& _] (log/info "[Entry]" state-id)))
(defn log-exit [state-id] (fn [& _] (log/info "[Exit]" state-id)))

(defn update-state [key val state event]
  (assoc state key val))

;; Statechart Definition
(def prism-setup-statechart
  (fsm/machine
   {:id :prism-setup
    :initial :idle
    :context {:master-user nil
              :error-message nil
              :status-message "Idle"
              :db-check-result nil ; :empty | :not-empty | :error
              :user-credentials nil ; {:username "..." :password "..."}
              :seed-files []
              :processed-csv-files []
              :cache-results {}} ; {:facts :success, :lineage :failed, ...}

    :states
    {:idle
     {:entry [(log-entry :idle)
              (fsm/assign (partial update-state :status-message "Idle"))
              ]
      :on {:START_SETUP :checking_db}}

     :checking_db
     {:entry [(log-entry :checking_db)
              (fsm/assign (partial update-state :status-message "Checking database state...")) ; Update status message)
              #'check-db-action]
      :exit (log-exit :checking_db)
      :on {:DB_CHECK_COMPLETE_EMPTY (-> {:target :awaiting_user_credentials
                                         :actions [
                                                   (fsm/assign (partial update-state :db-check-result :empty))
                                                   ]})
           :DB_CHECK_COMPLETE_NOT_EMPTY (-> {:target :setup_complete
                                             :actions [
                                                       (fsm/assign (partial update-state :db-check-result :not-empty))
                                                       (fsm/assign (partial update-state :status-message "Database already contains data."))
                                                       ]})
           :ERROR (-> {:target :error
                       :actions [
                                 (fsm/assign (partial update-state :db-check-result :error))
                                 ]})}}

     :awaiting_user_credentials
     {:entry [(log-entry :awaiting_user_credentials)
              (fsm/assign (partial update-state :status-message "Awaiting admin user credentials..."))
              ]
      :exit (log-exit :awaiting_user_credentials)
      :on {:SUBMIT_CREDENTIALS (-> {:target :creating_admin_user
                                     ;; Guard could be added here later to validate
                                    :actions [
                                              ;; (fsm/assign (partial update-state :user-credentials (fn [_ _ event] (:data event))))
                                              ]})}}

     :creating_admin_user
     {:entry [(log-entry :creating_admin_user)
              (fsm/assign (partial update-state :status-message "Creating admin user..."))
              #'create-user-action]
      :exit (log-exit :creating_admin_user)
      :on {:USER_CREATION_SUCCESS (-> {:target :seeding_db
                                       :actions [
                                                 ;; (fsm/assign (partial update-state :master-user (fn [ctx _ _] (get-in ctx [:user-credentials :username]))))
                                                 ]})
           :ERROR :error}}

     :seeding_db
     {:entry [(log-entry :seeding_db)
              (fsm/assign (partial update-state :status-message "Starting database seed..."))
              #'seed-db-action]
      :exit (log-exit :seeding_db)
      ;; This might become a compound state later to track XLS->CSV and CSV->DB steps
      :on {:SEEDING_COMPLETE :building_caches
           :SEEDING_SKIPPED (-> {:target :building_caches ; Or maybe error? Design decision.
                                 :actions [
                                           (fsm/assign (partial update-state :status-message "Seeding skipped (no files?)"))
                                           ]})
           :ERROR :error}}

     :building_caches
     {:entry [(log-entry :building_caches)
              (fsm/assign (partial update-state :status-message "Building database caches..."))
              #'build-caches-action]
      :exit (log-exit :building_caches)
      ;; This might become a parallel state later if caches can build independently
      :on {:CACHE_BUILD_COMPLETE :setup_complete
           :ERROR :error}}

     :setup_complete
     {:entry [(log-entry :setup_complete)
              (fsm/assign (partial update-state :status-message "Setup complete."))
              ]}

     :error
     {:entry [(log-entry :error)
              ;; Update status based on context, assign action does this
              #'report-error-action]
      ;; Might have transitions out of error state, e.g., RETRY?
      }}}))

;; Example of how to create and interact with the state machine (for REPL usage)
(comment

  (def s1 (fsm/initialize prism-setup-statechart))

  ;; (fsm/current-state setup-service)
  s1

  (def xxx (fsm/transition prism-setup-statechart s1 {:type :START_SETUP}))

  xxx

  ;; (fsm/current-context setup-service)

  ;; Simulate starting the process
  (def setup-service (fsm/service prism-setup-statechart))

  (fsm/start setup-service)

  (println (fsm/value setup-service))

  (fsm/send setup-service :START_SETUP)

  (fsm/send setup-service :DB_CHECK_COMPLETE_EMPTY)

  (fsm/send setup-service :SUBMIT_CREDENTIALS)

  (fsm/send setup-service :USER_CREATION_SUCCESS)

  (fsm/send setup-service :SEEDING_COMPLETE)

  (fsm/send setup-service :CACHE_BUILD_COMPLETE)

  )
