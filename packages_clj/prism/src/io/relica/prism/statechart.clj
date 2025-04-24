(ns io.relica.prism.statechart
  (:require [statecharts.core :as fsm]
            [taoensso.timbre :as log]
            [clojure.pprint :as pprint]))


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


(defn format-state-for-client
  "Creates a comprehensive state object that contains all information a client needs."
  [state]
  (let [context state
        value (:_state state)
        current-state (if (vector? value)
                        ;; Handle hierarchical states, e.g., [:building_caches :facts_cache]
                        (let [parent (first value)
                              child (second value)]
                          {:id parent
                           :substate child
                           :full_path value})
                        ;; Handle flat states
                        {:id value
                         :substate nil
                         :full_path [value]})]

    ;; Create a complete state object with all necessary information
    {:timestamp (System/currentTimeMillis)
     :state current-state
     :progress (case (keyword (if (vector? value) (first value) value))
                 :idle 0
                 :checking_db 10
                 :awaiting_user_credentials 20
                 :creating_admin_user 30
                 :seeding_db 40
                 :building_caches (+ 70
                                     (case (keyword (second value))
                                       :building_facts_cache 0
                                       :building_lineage_cache 10
                                       :building_subtypes_cache 20
                                       :building_caches_complete 30
                                       0))
                 :setup_complete 100
                 :error (or (:progress context) 0))
     :status (:status-message context)
     :master_user (:master-user context)
     :error (:error-message context)
     :data (dissoc context :status-message :error-message :master-user)
     }))


;; Function to broadcast state updates via WebSocket
(defn broadcast-state-update
  "Broadcasts the current state via WebSocket, similar to the original setup/update-status! function."
  [state event]
  (log/info "[Action] Broadcasting state update:" (:status-message state))
  (when-let [broadcast-fn (resolve 'io.relica.prism.websocket/broadcast-setup-update)]
    (let [formatted-state (format-state-for-client state)]
      (broadcast-fn formatted-state))))

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
              #'broadcast-state-update]
      :on {:START_SETUP {:target :checking_db
                         :actions #'broadcast-state-update}}}

     :checking_db
     {:entry [(log-entry :checking_db)
              (fsm/assign (partial update-state :status-message "Checking database state...")) ; Update status message)
              #'broadcast-state-update
              #'check-db-action]
      :exit (log-exit :checking_db)
      :on {:DB_CHECK_COMPLETE_EMPTY (-> {:target :awaiting_user_credentials
                                         :actions [(fsm/assign (partial update-state :db-check-result :empty))
                                                   #'broadcast-state-update]})
           :DB_CHECK_COMPLETE_NOT_EMPTY (-> {:target :setup_complete
                                             :actions [(fsm/assign (partial update-state :db-check-result :not-empty))
                                                       (fsm/assign (partial update-state :status-message "Database already contains data."))
                                                       #'broadcast-state-update]})
           :ERROR (-> {:target :error
                       :actions [(fsm/assign (partial update-state :db-check-result :error))
                                 #'broadcast-state-update]})}}

     :awaiting_user_credentials
     {:entry [(log-entry :awaiting_user_credentials)
              (fsm/assign (partial update-state :status-message "Awaiting admin user credentials..."))
              #'broadcast-state-update]
      :exit (log-exit :awaiting_user_credentials)
      :on {:SUBMIT_CREDENTIALS (-> {:target :creating_admin_user
                                     ;; Guard could be added here later to validate
                                    :actions [;; (fsm/assign (partial update-state :user-credentials (fn [_ _ event] (:data event))))
                                              #'broadcast-state-update]})}}

     :creating_admin_user
     {:entry [(log-entry :creating_admin_user)
              (fsm/assign (partial update-state :status-message "Creating admin user..."))
              #'broadcast-state-update
              #'create-user-action]
      :exit (log-exit :creating_admin_user)
      :on {:USER_CREATION_SUCCESS (-> {:target :seeding_db
                                       :actions [;; (fsm/assign (partial update-state :master-user (fn [ctx _ _] (get-in ctx [:user-credentials :username]))))
                                                 #'broadcast-state-update]})
           :ERROR {:target :error
                   :actions #'broadcast-state-update}}}

     :seeding_db {:entry [(log-entry :seeding_db)
                          (fsm/assign (partial update-state :status-message "Starting database seed..."))
                          #'broadcast-state-update
                          #'seed-db-action]
                  :exit (log-exit :seeding_db)
                  ;; This might become a compound state later to track XLS->CSV and CSV->DB steps
                  :on {:SEEDING_COMPLETE {:target :building_caches
                                          :actions [(fsm/assign (partial update-state :status-message "DB seeding complete."))
                                                    #'broadcast-state-update]}
                       :SEEDING_SKIPPED (-> {:target :building_caches ; Or maybe error? Design decision.
                                             :actions [(fsm/assign (partial update-state :status-message "Seeding skipped (no files?)"))
                                                       #'broadcast-state-update]})
                       :ERROR {:target :error
                               :actions #'broadcast-state-update}}}

     :building_caches {:initial :building_facts_cache
                       :states {:building_facts_cache {:entry [(fsm/assign (partial update-state :status-message "building entity-facts cache..."))
                                                      #'broadcast-state-update]
                                              :on {:FACTS_CACHE_COMPLETE {:target :building_lineage_cache
                                                                          :actions [(fsm/assign (partial update-state :status-message "...finished building entity-facts cache."))
                                                                                    #'broadcast-state-update]}}}
                                :building_lineage_cache {:entry [(fsm/assign (partial update-state :status-message "building entity-lineage cache..."))
                                                        #'broadcast-state-update]
                                                :on {:LINEAGE_CACHE_COMPLETE {:target :building_subtypes_cache
                                                                              :actions [(fsm/assign (partial update-state :status-message "...finished building entity-lineage-cache."))
                                                                                        #'broadcast-state-update]}}}
                                :building_subtypes_cache {:entry [(fsm/assign (partial update-state :status-message "building entity-subtypes cache..."))
                                                         #'broadcast-state-update]
                                                 :on {:SUBTYPES_CACHE_COMPLETE {:target :building_caches_complete
                                                                                :actions [(fsm/assign (partial update-state :status-message "...finished building entity-subtypes-cache."))
                                                                                          #'broadcast-state-update]}}}
                                :building_caches_complete {:on {:CACHE_BUILD_COMPLETE {:target [:> :setup_complete]
                                                                       :actions [(fsm/assign (partial update-state :status-message "...finished building caches."))
                                                                                 #'broadcast-state-update]}}}}}

     :setup_complete
     {:entry [(log-entry :setup_complete)
              (fsm/assign (partial update-state :status-message "Setup complete."))
              #'broadcast-state-update]}

     :error
     {:entry [(log-entry :error)
              ;; Update status based on context, assign action does this
              #'broadcast-state-update
              #'report-error-action]
      ;; Might have transitions out of error state, e.g., RETRY?
      }}}))

(def setup-service (atom nil))

(defn init!
  "Initializes the state machine with the initial state."
  []

  (reset! setup-service (fsm/service prism-setup-statechart))

  (fsm/start @setup-service)

  )

(defn start-setup-sequence! []
  (fsm/send @setup-service :START_SETUP))

(defn create-admin-user!
  "Creates an admin user with the provided credentials."
  [username password]
  (fsm/send @setup-service :SUBMIT_CREDENTIALS {:username username
                                               :password password}))

(defn get-setup-state
  "Returns the current state of the setup process."
  []
  (let [state (fsm/state @setup-service)]
    (format-state-for-client state)))

;; Example of how to create and interact with the state machine (for REPL usage)
(comment

  ;; (def s1 (fsm/initialize prism-setup-statechart))
  ;; ;; (fsm/current-state setup-service)
  ;; s1
  ;; (def xxx (fsm/transition prism-setup-statechart s1 {:type :START_SETUP}))
  ;; xxx
  ;; (fsm/current-context setup-service)

  ;; Simulate starting the process
  (def setup-service (fsm/service prism-setup-statechart))

  (fsm/start setup-service)

  (println (fsm/value @setup-service))

  (println (fsm/state setup-service))


  (fsm/send @setup-service :START_SETUP)

  (fsm/send @setup-service :DB_CHECK_COMPLETE_EMPTY)

  (fsm/send @setup-service :SUBMIT_CREDENTIALS)

  (fsm/send @setup-service :USER_CREATION_SUCCESS)

  (fsm/send @setup-service :SEEDING_COMPLETE)

  (fsm/send @setup-service :FACTS_CACHE_COMPLETE)

  (fsm/send @setup-service :LINEAGE_CACHE_COMPLETE)

  (fsm/send @setup-service :SUBTYPES_CACHE_COMPLETE)

  (fsm/send @setup-service :CACHE_BUILD_COMPLETE)

  (init!)

  (defn full-cycle []
    (init!)

    (fsm/send @setup-service :DB_CHECK_COMPLETE_EMPTY)

    (fsm/send @setup-service :SUBMIT_CREDENTIALS)

    (fsm/send @setup-service :USER_CREATION_SUCCESS)

    (fsm/send @setup-service :SEEDING_COMPLETE)

    (fsm/send @setup-service :FACTS_CACHE_COMPLETE)

    (fsm/send @setup-service :LINEAGE_CACHE_COMPLETE)

    (fsm/send @setup-service :SUBTYPES_CACHE_COMPLETE))

  (full-cycle)

  )
