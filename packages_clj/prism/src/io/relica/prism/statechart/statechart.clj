(ns io.relica.prism.statechart.statechart
  (:require [statecharts.core :as fsm]
            [taoensso.timbre :as log]
            [io.relica.prism.setup :as setup]))


;; State definitions and service atom
;; (def setup-service (atom nil))



(defn report-error-action [context event] (log/error "[Action] Error occurred:" (:error-message context) "Event:" event))
(defn log-entry [state-id] (fn [& _] (log/info "[Entry]" state-id)))
(defn log-exit [state-id] (fn [& _] (log/info "[Exit]" state-id)))


(defn update-state [key val state event]
  (assoc state key val))


;; Function to broadcast state updates via WebSocket
(defn broadcast-state-update
  "Broadcasts the current state via WebSocket, similar to the original setup/update-status! function."
  [state event]
  (log/info "[Action] Broadcasting state update:" (:status-message state))
  (when-let [broadcast-fn (resolve 'io.relica.prism.io.ws-server/broadcast-setup-update)]
    (let [formatted-state (setup/format-state-for-client state)]
      (broadcast-fn formatted-state)))
  )

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
              ;; #'check-db-action
              ]
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
              ;; #'create-user-action
              ]
      :exit (log-exit :creating_admin_user)
      :on {:USER_CREATION_SUCCESS (-> {:target :seeding_db
                                       :actions [;; (fsm/assign (partial update-state :master-user (fn [ctx _ _] (get-in ctx [:user-credentials :username]))))
                                                 #'broadcast-state-update]})
           :ERROR {:target :error
                   :actions #'broadcast-state-update}}}

     :seeding_db {:entry [(log-entry :seeding_db)
                          (fsm/assign (partial update-state :status-message "Starting database seed..."))
                          #'broadcast-state-update
                          ;; #'seed-db-action
                          ]
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

;; (defn init!
;;   "Initializes the state machine with the initial state."
;;   []

;;   (reset! setup-service (fsm/service prism-setup-statechart))

;;   (fsm/start @setup-service))

;; interface mostly for the statechart controller
(defn create-state-machine []
  (let [state-machine (fsm/service prism-setup-statechart)]
    state-machine))

(defn start-state-machine! [machine]
  (fsm/start machine))

(defn send-event! [machine event]
  (fsm/send machine event))

(defn get-state [machine]
  (fsm/state machine))

(defn get-value [machine]
  (fsm/value machine))
;;


;; (defn create-admin-user!
;;   "Creates an admin user with the provided credentials."
;;   [username password]
;;   (let [res (setup/create-admin-user! username password)]
;;     (if res
;;       (do
;;         (fsm/send @setup-service :SUBMIT_CREDENTIALS {:username username
;;                                                        :password password})
;;         true)
;;       (do
;;         (fsm/send @setup-service :ERROR)
;;         false))))

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

  (println (fsm/value setup-service))

  (println (fsm/state setup-service))


  (fsm/send setup-service :START_SETUP)

  (fsm/send setup-service :DB_CHECK_COMPLETE_EMPTY)

  (fsm/send setup-service :SUBMIT_CREDENTIALS)

  (fsm/send setup-service :USER_CREATION_SUCCESS)

  (fsm/send setup-service :SEEDING_COMPLETE)

  (fsm/send setup-service :FACTS_CACHE_COMPLETE)

  (fsm/send setup-service :LINEAGE_CACHE_COMPLETE)

  (fsm/send setup-service :SUBTYPES_CACHE_COMPLETE)

  (fsm/send setup-service :CACHE_BUILD_COMPLETE)

  (init!)

  (defn full-cycle []
    (init!)

    (fsm/send setup-service :DB_CHECK_COMPLETE_EMPTY)

    (fsm/send setup-service :SUBMIT_CREDENTIALS)

    (fsm/send setup-service :USER_CREATION_SUCCESS)

    (fsm/send setup-service :SEEDING_COMPLETE)

    (fsm/send setup-service :FACTS_CACHE_COMPLETE)

    (fsm/send setup-service :LINEAGE_CACHE_COMPLETE)

    (fsm/send setup-service :SUBTYPES_CACHE_COMPLETE))

  (full-cycle))
