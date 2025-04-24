(ns io.relica.prism.core
  (:require [taoensso.timbre :as log]
            [io.relica.prism.config :as config]
            [io.relica.prism.setup :as setup]
            [io.relica.prism.services.db :as db]
            [io.relica.prism.services.xls :as xls]
            [io.relica.prism.services.xls-transform :as xls-transform]
            [io.relica.prism.io.ws-server :as ws-server]
            [io.relica.prism.io.ws-handlers :as ws-handlers] ;; need to be required to register the handlers
            [io.relica.prism.statechart.statechart-controller :as statechart-controller]
            [clojure.java.io :as io])
  (:gen-class))

(log/set-level! (config/log-level))

(defn initialize-database-if-needed
  "Legacy method: Checks if the database is empty and performs initial seeding if necessary.
   This is the original non-interactive approach."
  []
  (log/info "Checking database initialization status (legacy method)...")
  (try (let [db-empty? (db/database-empty?)]
      (if db-empty?
        (do
          (log/info "Database is empty. Starting seeding process...")
          (let [csv-file-paths (xls/process-seed-directory)]
            (if (seq csv-file-paths)
              (do
                (log/infof "Generated %d CSV files for import." (count csv-file-paths))
                (doseq [csv-path csv-file-paths
                        :let [file-name (.getName (io/file csv-path))]] ; Get just the filename
                  (log/infof "--- Processing CSV: %s ---" file-name)
                  (log/info "Loading nodes...")
                  (let [node-result (db/load-nodes-from-csv! file-name)]
                    (when-not (:success node-result)
                      (throw (ex-info (str "Failed to load nodes from " file-name) {:file file-name :error (:error node-result)}))))

                  (log/info "Loading relationships...")
                  (let [rel-result (db/load-relationships-from-csv! file-name)]
                    (when-not (:success rel-result)
                      (throw (ex-info (str "Failed to load relationships from " file-name) {:file file-name :error (:error rel-result)}))))

                  (log/infof "--- Finished processing CSV: %s ---" file-name))
                ;; 5. Trigger cache building (TBD)
                (log/info "Seeding process completed successfully."))
              (log/warn "Seeding process skipped: No CSV files were generated from the seed directory."))))
        (log/info "Database already initialized. Skipping seeding.")))
    (catch Exception e
      (log/error e "An error occurred during database initialization/seeding.")
      ;; Decide if we should re-throw or handle differently
      (throw e))))

(defn start-interactive-setup
  "Starts the interactive setup process with web UI."
  []
  (log/info "Starting interactive setup process...")
  
  ;; Start the Ws-Server server
  (ws-server/start-server)

  ;; Initialize the setup module
  ;; (setup/init!)
  (statechart-controller/init!)

  (log/info "Interactive setup ready. API server and WebSocket server are running on port" (config/api-server-port))
  (log/info "Visit http://localhost:" (config/api-server-port) " to complete setup"))

(defn stop-services
  "Stops all Prism services."
  []
  (log/info "Stopping Prism services...")
  ;; (api/stop-server)
  (ws-server/stop-server)
  (log/info "All Prism services stopped."))

(defn start-prism-services
  "Main entry point for Prism logic (called on app startup)."
  []
  (log/info "Prism package starting...")
  
  ;; Start the interactive setup process
  (start-interactive-setup)
  
  (log/info "Prism package started."))

(defn -main
  "Entry point when run as a standalone application."
  [& args]
  (log/info "Starting Prism as standalone application...")

  (start-prism-services)

  ;; Keep the application running
  (let [running (promise)]
    ;; Add shutdown hook to gracefully stop services
    (.addShutdownHook (Runtime/getRuntime)
                     (Thread. (fn []
                               (log/info "Shutdown hook triggered")
                               (stop-services)
                               (deliver running :shutdown))))
    
    ;; Wait for termination
    @running
    (log/info "Prism application terminated.")))

(comment


  ;; (xls/process-seed-directory)
  (xls-transform/transform-seed-xls!)

  (db/database-empty?)

  (db/load-nodes-from-csv! "0.csv")

  ;; Example usage:
  ;; (start-prism-services)
  ;; (stop-services)
  ;; (-main)

  (defn reset! []
    (setup/clear-users-and-envs!)
    (db/clear-db!)
    (statechart-controller/init!)
    )

  (reset!)

  )
