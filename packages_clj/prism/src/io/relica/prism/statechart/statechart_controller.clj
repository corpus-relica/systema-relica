(ns io.relica.prism.statechart.statechart-controller
  (:require [io.relica.prism.setup :as setup]
            [io.relica.prism.services.cache :as cache]
            [io.relica.prism.services.db :as db]
            [io.relica.prism.statechart.statechart :as statechart]
            [clojure.core.async :refer [go <!]]
            [taoensso.timbre :as log]))


(def machine (atom nil))

(declare send-event)
(defn check-db-activity [context]
  (log/info "[Activity] Checking database...")
  (try
    (if (db/database-empty?)
      (send-event :DB_CHECK_COMPLETE_EMPTY)
      (send-event :DB_CHECK_COMPLETE_NOT_EMPTY))
    (catch Exception e
      (log/error e "Error checking database state")
      (send-event {:type :ERROR
                   :error-message (str "Database check failed: " (.getMessage e))}))))

(defn create-user-activity [context event]
  ;; TODO - maybe move this from the ws-handlers to here?
  ;;
  ;; (log/info "[Activity] Creating admin user...")
  ;; (let [{:keys [username password]} (:data event)]
  ;;   (try
  ;;     (if (setup/create-admin-user! username password)
  ;;       (fsm/send @setup-service :USER_CREATION_SUCCESS)
  ;;       (fsm/send @setup-service :ERROR {:error-message "Failed to create admin user"}))
  ;;     (catch Exception e
  ;;       (log/error e "Error creating admin user")
  ;;       (fsm/send @setup-service :ERROR {:error-message (str "Failed to create admin user: " (.getMessage e))})))))
  )

(defn seed-db-activity [context]
  (log/info "[Activity] Starting DB seed...")
  (try
    (if (setup/seed-database!)
      (send-event :SEEDING_COMPLETE)
      (send-event :SEEDING_SKIPPED))
    (catch Exception e
      (log/error e "Error during database seeding")
      (send-event {:type :ERROR
                   :error-message (str "Database seeding failed: " (.getMessage e))}))))

(defn build-facts-cache-activity [context]
  (log/info "[Activity] building entity facts cache...")
  (try
    ;; Start async cache building process
    (let [facts-chan (cache/build-entity-facts-cache!)]
      ;; Monitor cache building progress in a separate thread
      (go
        (try
          (log/info "Waiting for entity facts cache build...")
          (if (<! facts-chan)
            (send-event :FACTS_CACHE_COMPLETE)
            (do
              (log/error "Error building entity facts cache")
              (send-event {:type :ERROR
                           :error-message "Facts cache build failed"})))
          (catch Exception e
            (log/error e "Error during facts cache building")
            (send-event {:type :ERROR
                         :error-message (str "Facts cache build failed: " (.getMessage e))})))))
    (catch Exception e
      (log/error e "Error initiating facts cache build")
      (send-event {:type :ERROR
                   :error-message (str "Failed to start facts cache build: " (.getMessage e))}))))

(defn build-lineage-cache-activity [context]
  (log/info "[Activity] building entity lineage cache...")
  (try
    ;; Start async cache building process
    (let [lineage-chan (cache/build-entity-lineage-cache!)]
      ;; Monitor cache building progress in a separate thread
      (go
        (try
          (log/info "Waiting for entity lineage cache build...")
          (if (<! lineage-chan)
            (send-event :LINEAGE_CACHE_COMPLETE)
            (do
              (log/error "Error building entity lineage cache")
              (send-event {:type :ERROR
                           :error-message "Lineage cache build failed"})))
          (catch Exception e
            (log/error e "Error during lineage cache building")
            (send-event {:type :ERROR
                         :error-message (str "Lineage cache build failed: " (.getMessage e))})))))
    (catch Exception e
      (log/error e "Error initiating lineage cache build")
      (send-event {:type :ERROR
                   :error-message (str "Failed to start lineage cache build: " (.getMessage e))}))))

(defn build-subtypes-cache-activity [context]
  (log/info "[Activity] building entity subtypes cache...")
  (try
    ;; Start async cache building process
    (let [subtypes-chan (cache/build-subtypes-cache!)]
      ;; Monitor cache building progress in a separate thread
      (go
        (try
          (log/info "Waiting for entity subtypes cache build...")
          (if (<! subtypes-chan)
            (send-event :SUBTYPES_CACHE_COMPLETE)
            (do
              (log/error "Error building entity subtypes cache")
              (send-event {:type :ERROR
                           :error-message "Subtypes cache build failed"})))
          (catch Exception e
            (log/error e "Error during subtypes cache building")
            (send-event {:type :ERROR
                         :error-message (str "Subtypes cache build failed: " (.getMessage e))})))))
    (catch Exception e
      (log/error e "Error initiating subtypes cache build")
      (send-event {:type :ERROR
                   :error-message (str "Failed to start subtypes cache build: " (.getMessage e))})))
  )


(defn process-state [state]
  (println "Processing state:" state)
  (case (:_state state)
        :checking_db (check-db-activity state)
        :awaiting_user_credentials (println "$$$$$$$$$ Awaiting user credentials...")
        :creating_admin_user (println "$$$$$$$$$$$ Creating admin user...")
        :seeding_db (seed-db-activity state)
        [:building_caches :building_facts_cache] (build-facts-cache-activity state)
        [:building_caches :building_lineage_cache] (build-lineage-cache-activity state)
        [:building_caches :building_subtypes_cache] (build-subtypes-cache-activity state)
        [:building_caches :building_caches_complete] (do
                                                       (println "$$$$$$$$$$$$ Building caches complete...")
                                                       (send-event :CACHE_BUILD_COMPLETE))
        (println "!!!! State not handled !!!:" (:_state state))))

(defn send-event [event]
  (println "Sending event to state machine:" event)
  (when @machine
    (do
      (statechart/send-event! @machine event)
      (println "Event sent to state machine:" event)
      (process-state (statechart/get-state @machine)))))

(defn get-setup-state
  "Returns the current state of the setup process."
  []
  (let [state (statechart/get-state @machine)]
    (setup/format-state-for-client state)))

(defn init!
  "Initialize the statechart controller."
  []
  (log/info "Initializing statechart controller")
  (reset! machine (statechart/create-state-machine))
  (statechart/start-state-machine! @machine))

(comment

  (init!)

  (send-event :START_SETUP)

  (send-event {:type :SUBMIT_CREDENTIALS :username "admin" :password "password"})

  (send-event :USER_CREATION_SUCCESS)

  )
