(ns io.relica.prism.setup
  (:require [taoensso.timbre :as log]
            [io.relica.prism.db :as db]
            [io.relica.prism.xls :as xls]
            [io.relica.prism.config :as config]
            [clojure.java.io :as io]
            [clojure.string :as str]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [buddy.hashers :as hashers]))

;; Setup state tracking
(defonce setup-state (atom {:stage :not-started
                           :master-user nil
                           :status "Setup has not been initiated."
                           :progress 0
                           :error nil}))

;; Setup stages
(def setup-stages [:db-check :user-setup :db-seed :cache-build :complete])

(defn get-setup-state 
  "Returns the current setup state for external APIs."
  []
  @setup-state)

(defn advance-stage!
  "Advances the setup to the next stage."
  []
  (let [current-stage (:stage @setup-state)
        current-index (when (keyword? current-stage)
                       (.indexOf setup-stages current-stage))
        next-index (inc current-index)
        next-stage (if (and (number? next-index) (< next-index (count setup-stages)))
                     (nth setup-stages next-index)
                     :complete)]
    (swap! setup-state assoc
           :stage next-stage
           :progress (if (= next-stage :complete) 100
                       (* (/ (inc next-index) (count setup-stages)) 100)))))

(defn update-status!
  "Updates the setup status message."
  [status-message]
  (swap! setup-state assoc :status status-message)
  (log/info status-message)
  ;; We'll add a call to broadcast the update via WebSocket
  ;; This will be implemented later and injected to avoid circular dependencies
  (when-let [broadcast-fn (resolve 'io.relica.prism.websocket/broadcast-setup-update)]
    (broadcast-fn)))

(defn set-error!
  "Sets an error in the setup state."
  [error-message]
  (log/error error-message)
  (swap! setup-state assoc :error error-message))

(defn start-setup-sequence!
  "Initiates the interactive setup sequence."
  []
  (log/info "Starting setup sequence...")
  (swap! setup-state assoc 
         :stage :db-check 
         :error nil
         :status "Checking database state..."
         :progress 10)
  
  (try
    (if (db/database-empty?)
      (do
        (update-status! "Database is empty. Ready for initial setup.")
        (advance-stage!)) ; Move to :user-setup
      (do
        (update-status! "Database already contains data. Setup not required.")
        (swap! setup-state assoc :stage :complete :progress 100)))
    (catch Exception e
      (set-error! (str "Error checking database state: " (.getMessage e))))))

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
  (log/info "Creating admin user:" username)
  (update-status! (str "Creating admin user: " username))
  
  (try
    ;; Create PostgreSQL admin user
    (let [email (str username "@relica.io") ; Generate an email based on username
          password-hash (buddy.hashers/derive password {:algorithm :bcrypt})
          jdbc-conn (jdbc/get-connection (config/db-spec))
          
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
          (swap! setup-state assoc :master-user username)
          (advance-stage!) ; Move to :db-seed
          true)
        (do
          (set-error! (str "Failed to create admin user"
                          (when (and user-result (not env-result))
                            " - environment creation failed")
                          (when (and user-result env-result (not user-env-result))
                            " - user-environment link failed")))
          false)))
    (catch Exception e
      (set-error! (str "Error creating admin user: " (.getMessage e)))
      false)))

(defn seed-database!
  "Seeds the database with initial data from XLS files."
  []
  (log/info "Starting database seeding process...")
  (update-status! "Processing seed files...")
  
  (try
    (let [csv-file-paths (xls/process-seed-directory)]
      (if (seq csv-file-paths)
        (do
          (update-status! (str "Processed " (count csv-file-paths) " seed files. Importing data..."))
          
          (let [total-files (count csv-file-paths)
                progress-increment (/ 40 total-files)] ; 40% of progress bar for this stage
            
            (doseq [[idx csv-path] (map-indexed vector csv-file-paths)
                    :let [file-name (.getName (io/file csv-path))]]
              
              (update-status! (str "Importing " file-name " (" (inc idx) "/" total-files ")..."))
              
              ;; Update progress after each file
              (swap! setup-state update :progress + progress-increment)
              
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
          (advance-stage!) ; Move to :cache-build
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
  "Builds necessary caches for the application."
  []
  (log/info "Building database caches...")
  (update-status! "Building database caches...")
  
  (try
    ;; Execute cache building queries
    (let [subtype-cache-result (db/execute-query! 
                              "MATCH (sub:Entity)-[:role]->(:Fact {rel_type_uid: 1146})-[:role]->(super:Entity)
                               WITH sub, super
                               MERGE (sub)-[:SUBTYPE_OF]->(super)
                               RETURN count(*) as cache_count"
                              {})
          
          ;; Add more cache building queries here as needed
          ]
      
      (if (:success subtype-cache-result)
        (do
          (update-status! "Database caches built successfully")
          (advance-stage!) ; Move to :complete
          true)
        (do
          (set-error! "Failed to build database caches")
          false)))
    (catch Exception e
      (set-error! (str "Error building database caches: " (.getMessage e)))
      false)))

(defn complete-setup!
  "Marks the setup as complete."
  []
  (log/info "Setup completed successfully.")
  (update-status! "Setup completed successfully.")
  (swap! setup-state assoc :stage :complete :progress 100))

(defn handle-setup-stage!
  "Handles the current setup stage based on the state."
  []
  (let [current-stage (:stage @setup-state)]
    (case current-stage
      :not-started (start-setup-sequence!)
      :db-check (start-setup-sequence!) ; Re-run the check if needed
      :user-setup nil ; Wait for user input via API
      :db-seed (seed-database!)
      :cache-build (build-caches!)
      :complete (complete-setup!)
      ;; Default case
      (log/warn "Unknown setup stage:" current-stage))))

;; Initialize the setup
(defn init!
  "Initializes the setup module."
  []
  (log/info "Setup module initialized"))
