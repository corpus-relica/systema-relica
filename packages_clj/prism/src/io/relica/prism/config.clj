(ns io.relica.prism.config
  (:require [taoensso.timbre :as log]))

(defn- get-env [env-var-name default-value]
  (let [value (System/getenv env-var-name)]
    (if (nil? value)
      (log/warnf "Environment variable %s not set, using default: %s" env-var-name default-value)
      (log/infof "Using environment variable %s" env-var-name))
    (or value default-value)))

(defn- get-required-env [env-var-name]
  (let [value (System/getenv env-var-name)]
    (if (nil? value)
      (let [error-msg (format "Required environment variable %s is not set." env-var-name)]
        (log/error error-msg)
        (throw (IllegalStateException. error-msg)))
      (log/infof "Using environment variable %s" env-var-name))
    value))

(def config
  {:neo4j-uri        "bolt://localhost:7687" ;(get-required-env "PRISM_NEO4J_URI") ; e.g., "neo4j+s://xxxx.databases.neo4j.io"
   :neo4j-user       "neo4j" ;(get-required-env "PRISM_NEO4J_USER") ; e.g., "neo4j"
   :neo4j-password   "password" ;(get-required-env "PRISM_NEO4J_PASSWORD")

   ;; Path within the container where seed XLS files are located
   :seed-xls-dir     (get-env "PRISM_SEED_XLS_DIR" "/usr/src/app/seed_xls")

   ;; Path within the container where Neo4j can import CSVs from 
   ;; Note: This MUST match Neo4j's configured `server.directories.import` path
   :neo4j-import-dir (get-env "PRISM_NEO4J_IMPORT_DIR" "/import")

   ;; Path within the container where Prism can write intermediate CSVs
   ;; Often the same as :neo4j-import-dir, but could differ in some setups
   :csv-output-dir   (get-env "PRISM_CSV_OUTPUT_DIR" "/import")

   ;; UID resolution settings (matching TS implementation defaults)
   :min-free-uid      (Integer/parseInt (get-env "PRISM_MIN_FREE_UID" "1000000000"))
   :min-free-fact-uid (Integer/parseInt (get-env "PRISM_MIN_FREE_FACT_UID" "2000000000"))
   :max-temp-uid      (Integer/parseInt (get-env "PRISM_MAX_TEMP_UID" "1000"))

   ;; Logging level
   :log-level        (keyword (get-env "PRISM_LOG_LEVEL" "info"))})

;; Convenience accessors
(defn neo4j-uri [] (:neo4j-uri config))
(defn neo4j-user [] (:neo4j-user config))
(defn neo4j-password [] (:neo4j-password config))
(defn seed-xls-dir [] (:seed-xls-dir config))
(defn neo4j-import-dir [] (:neo4j-import-dir config))
(defn csv-output-dir [] (:csv-output-dir config))
(defn uid-ranges [] (select-keys config [:min-free-uid :min-free-fact-uid :max-temp-uid]))
(defn log-level [] (:log-level config))

;; Set log level based on config
(log/set-level! (log-level))

(log/info "Prism configuration loaded.")
