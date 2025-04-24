(ns io.relica.prism.setup
  (:require [taoensso.timbre :as log]
            [io.relica.prism.db :as db]
            [io.relica.prism.xls-transform :as xls-transform]
            [io.relica.prism.xls :as xls]
            [io.relica.prism.config :as config]
            [clojure.java.io :as io]
            [clojure.string :as str]
            [clojure.core.async :refer [go <! >!]]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [buddy.hashers :as hashers]
            [io.relica.prism.cache :as cache]))

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
     :data (dissoc context :status-message :error-message :master-user)}))

(defn update-status!
  "Updates the setup status message."
  [status-message]
  ;; (swap! setup-state assoc :status status-message)
  ;; (log/info status-message)
  ;; ;; We'll add a call to broadcast the update via WebSocket
  ;; ;; This will be implemented later and injected to avoid circular dependencies
  ;; (when-let [broadcast-fn (resolve 'io.relica.prism.websocket/broadcast-setup-update)]
  ;;   (broadcast-fn))
  )

(defn set-error!
  "Sets an error in the setup state."
  [error-message]
;;   (log/error error-message)
;;   (swap! setup-state assoc :error error-message))
  )

;; (defn start-setup-sequence!
;;   "Initiates the interactive setup sequence."
;;   []
;;   (log/info "Starting setup sequence...")
;;   (swap! setup-state assoc
;;          :stage :db-check
;;          :error nil
;;          :status "Checking database state..."
;;          :progress 10)

;;   (try
;;     (if (db/database-empty?)
;;       (do
;;         (update-status! "Database is empty. Ready for initial setup.")
;;         (advance-stage!)) ; Move to :user-setup
;;       (do
;;         (update-status! "Database already contains data. Setup not required.")
;;         (swap! setup-state assoc :stage :complete :progress 100)))
;;     (catch Exception e
;;       (set-error! (str "Error checking database state: " (.getMessage e))))))

(defn validate-credentials
  "Validates the admin user credentials."
  [username password confirm-password]
  (cond
    (str/blank? username)
    {:valid false :message "Username cannot be blank"}

    (< (count username) 4)
    {:valid false :message "Username must be at least 4 characters"}

    (str/blank? password)
    {:valid false :message "Password cannot be blank"}

    (< (count password) 8)
    {:valid false :message "Password must be at least 8 characters"}

    (not= password confirm-password)
    {:valid false :message "Passwords do not match"}

    :else
    {:valid true}))

(defn create-admin-user!
  "Creates the admin user with the given credentials."
  [username password]
  (log/info "Creating admin user:" username password)
  ;; (update-status! (str "Creating admin user: " username))

  (try
    ;; Create PostgreSQL admin user
    (let [email username ; Generate an email based on username
          password-hash (buddy.hashers/derive password {:algorithm :bcrypt})
          jdbc-conn (jdbc/get-connection (config/db-spec))

          _ (log/info "Connecting to PostgreSQL database...")
          _ (log/info jdbc-conn)

          ;; Create user
          user-result (jdbc/execute-one! jdbc-conn
                                         ["INSERT INTO users
                       (email, username, password_hash, is_active, is_admin, first_name, last_name)
                       VALUES (?, ?, ?, true, true, 'Admin', 'User')
                       RETURNING id, email, username, is_active, is_admin"
                                          email username password-hash]
                                         {:builder-fn next.jdbc.result-set/as-unqualified-maps})

          ;; Create a default environment
          env-result (when user-result
                       (jdbc/execute-one! jdbc-conn
                                          ["INSERT INTO environments (name) 
                          VALUES ('Default Environment')
                          RETURNING id"]
                                          {:builder-fn next.jdbc.result-set/as-unqualified-maps}))

          ;; Link user to environment
          user-env-result (when (and user-result env-result)
                            (jdbc/execute-one! jdbc-conn
                                               ["INSERT INTO user_environments
                                (user_id, environment_id, is_owner, can_write)
                                VALUES (?, ?, true, true)
                                RETURNING id"
                                                (:id user-result) (:id env-result)]
                                               {:builder-fn next.jdbc.result-set/as-unqualified-maps}))]

      (log/info "Created admin user in PostgreSQL:" (dissoc user-result :password_hash))
      (when env-result (log/info "Created default environment with ID:" (:id env-result)))
      (when user-env-result (log/info "Linked user to environment"))

      (if (and user-result env-result user-env-result)
        (do
          (update-status! (str "Admin user " username " created successfully with default environment"))
          true)
        (do
          (set-error! (str "Failed to create admin user"
                           (when (and user-result (not env-result))
                             " - environment creation failed")
                           (when (and user-result env-result (not user-env-result))
                             " - user-environment link failed")))
          false)))
    (catch Exception e
      (log/error e "Error creating admin user")
      (set-error! (str "^^^^^^^^^^^^^^ Error creating admin user: " (.getMessage e)))
      false)))

(defn clear-users-and-envs!
  "Clears all users and environments from the database."
  []
  (log/info "Clearing all users and environments from the database...")
  (try
    (let [jdbc-conn (jdbc/get-connection (config/db-spec))]
      ;; Clear user-environment links
      (jdbc/execute! jdbc-conn ["DELETE FROM user_environments"])

      ;; Clear environments
      (jdbc/execute! jdbc-conn ["DELETE FROM environments"])

      ;; Clear users
      (jdbc/execute! jdbc-conn ["DELETE FROM users"])

      (log/info "All users and environments cleared successfully."))
    (catch Exception e
      (log/error e "Error clearing users and environments")
      (set-error! (str "Error clearing users and environments: " (.getMessage e))))))

(defn seed-database!
  "Seeds the database with initial data from XLS files."
  []
  (log/info "Starting database seeding process...")
  (update-status! "Processing seed files...")

  (try
    (let [csv-file-paths (xls-transform/transform-seed-xls!)
          ;; csv-file-paths (xls/process-seed-directory)
          ]
      (println "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
      (println csv-file-paths)
      (if (seq csv-file-paths)
        (do
          (update-status! (str "Processed " (count csv-file-paths) " seed files. Importing data..."))

          (let [total-files (count csv-file-paths)
                progress-increment (/ 40 total-files)] ; 40% of progress bar for this stage
;; {:status :success, :csv-path /import/0.csv, :rows 5263}
            (doseq [[idx {:keys [csv-path]}] (map-indexed vector csv-file-paths) ; Destructure map here
                    :let [file-name (.getName (io/file csv-path))]]

              (update-status! (str "Importing " file-name " (" (inc idx) "/" total-files ")..."))

              ;; Update progress after each file
              ;; (swap! setup-state update :progress + progress-increment)

              ;; Create nodes
              (update-status! (str "Creating entities from " file-name "..."))
              (let [node-result (db/load-nodes-from-csv! file-name)]
                (when-not (:success node-result)
                  (throw (ex-info (str "Failed to load nodes from " file-name)
                                  {:file file-name :error (:error node-result)}))))

              ;; Create relationships
              (update-status! (str "Creating relationships from " file-name "..."))
              (let [rel-result (db/load-relationships-from-csv! file-name)]
                (when-not (:success rel-result)
                  (throw (ex-info (str "Failed to load relationships from " file-name)
                                  {:file file-name :error (:error rel-result)}))))))

          (update-status! "Database seeding completed successfully")
          ;; (advance-stage!) ; Move to :cache-build
          true)
        (do
          (update-status! "No seed files found. Database seeding skipped.")
          (log/warn "XLS processing did not generate any CSV files. Setup cannot proceed to cache building.")
          (log/warn "Setup will remain in the db-seed stage until seed files are processed correctly.")
          ;; Do NOT advance stage when no seed files are found - this is an error condition
          false)))
    (catch Exception e
      (set-error! (str "Error during database seeding: " (.getMessage e)))
      false)))

(defn build-caches!
  "Builds necessary caches asynchronously and advances stage upon completion."
  []
  (log/info "Initiating database cache building...")
  (update-status! "Building database caches (this may take some time)...")

  ;; Atom to track overall success - assumes channels return true on success
  (let [all-success (atom true)]
    ;; Start async cache building processes
    (let [facts-chan (cache/build-entity-facts-cache!)
          lineage-chan (cache/build-entity-lineage-cache!) ; Corrected fn name if needed
          subtypes-chan (cache/build-subtypes-cache!)
          ;; entity-fact-chan (cache/build-entity-fact-cache!)
          ] ; Assuming this exists

      ;; Go block to wait for completion and update state
      (go
        (try
          (log/info "Waiting for entity facts cache build...")
          (when-not (<! facts-chan) (reset! all-success false))

          (log/info "Waiting for entity lineage cache build...")
          (when-not (<! lineage-chan) (reset! all-success false))

          (log/info "Waiting for subtypes cache build...")
          (when-not (<! subtypes-chan) (reset! all-success false))

          ;; (log/info "Waiting for entity fact cache build...") ; Uncomment if this function exists
          ;; (when-not (<! entity-fact-chan) (reset! all-success false))

          ;; Check final result after all channels complete
          (if @all-success
            (do
              (update-status! "Database caches built successfully.")
              (log/info "All caches built successfully.")
              ;; (advance-stage!)
              ) ; Move to :complete ONLY AFTER successful completion
            (do
              (set-error! "Failed to build one or more database caches.")
              (log/error "Failed to build one or more database caches.")))

          (catch Exception e
            (let [error-msg (str "Error coordinating cache building: " (.getMessage e))] 
              (log/error e error-msg)
              (set-error! error-msg)))))))

  ;; Return true immediately to indicate the process has started
  ;; The stage advancement happens asynchronously in the go block above.
  true)


(comment

  (create-admin-user! "admin@admin.net" "password123")

  (clear-users-and-envs!)

  (seed-database!)


  )
