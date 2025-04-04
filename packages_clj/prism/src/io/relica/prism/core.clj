(ns io.relica.prism.core
  (:require [taoensso.timbre :as log]
            [io.relica.prism.db :as db]
            [io.relica.prism.xls :as xls]
            [io.relica.prism.config :as config]
            [clojure.java.io :as io]))

(log/set-level! (config/log-level))

(defn initialize-database-if-needed
  "Checks if the database is empty and performs initial seeding if necessary."
  []
  (log/info "Checking database initialization status...")
  (try
    (let [db-empty? (db/database-empty?)]
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

(defn start-prism-services
  "Main entry point for Prism logic (e.g., called on app startup)."
  []
  (log/info "Prism package starting...")
  (initialize-database-if-needed)
  ; Add other initialization if needed (e.g., setting up API endpoints for manual import/export later)
  (log/info "Prism package started."))

;; Example of how it might be called (e.g., from main app)
;; (start-prism-services)
