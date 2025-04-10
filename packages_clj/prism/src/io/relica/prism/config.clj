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
  {:neo4j-uri        "bolt://neo4j:7687" ;(get-required-env "PRISM_NEO4J_URI") ; e.g., "neo4j+s://xxxx.databases.neo4j.io"
   :neo4j-user       "neo4j" ;(get-required-env "PRISM_NEO4J_USER") ; e.g., "neo4j"
   :neo4j-password   "password" ;(get-required-env "PRISM_NEO4J_PASSWORD")

   ;; PostgreSQL configuration for user management
   :db-spec          {:dbtype "postgresql"
                     :dbname (get-env "POSTGRES_DB" "postgres")
                     :host (get-env "POSTGRES_HOST" "postgres")
                     :user (get-env "POSTGRES_USER" "postgres")
                     :password (get-env "POSTGRES_PASSWORD" "password")
                     :port (Integer/parseInt (get-env "POSTGRES_PORT" "5432"))}
   :jwt-secret       (get-env "JWT_SECRET" "your-dev-secret-change-me")

   ;; Path within the container where seed XLS files are located
   :seed-xls-dir     (get-env "PRISM_SEED_XLS_DIR" "/seed_xls")

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

   ;; Server settings
   :ws-server        {:port (Integer/parseInt (get-env "PRISM_PORT" "3333"))}
   :api-server-port  (Integer/parseInt (get-env "PRISM_API_PORT" "3333"))
   :api-server-host  (get-env "PRISM_API_HOST" "0.0.0.0")

   ;; Logging level
   :log-level        (keyword (get-env "PRISM_LOG_LEVEL" "info"))})

  ;; (def config
  ;;   {
  ;;    :neo4j-uri        "bolt://host.docker.internal:7687" ;(get-required-env "PRISM_NEO4J_URI") ; e.g., "neo4j+s://xxxx.databases.neo4j.io"
  ;;    :neo4j-user       "neo4j" ;(get-required-env "PRISM_NEO4J_USER") ; e.g., "neo4j"
  ;;    :neo4j-password   "password" ;(get-required-env "PRISM_NEO4J_PASSWORD")

  ;;    ;; PostgreSQL configuration for user management
  ;;    :db-spec          {:dbtype "postgresql"
  ;;                      :dbname "postgres"
  ;;                      :host  "postgres"
  ;;                      :user  "postgres"
  ;;                      :password  "password"
  ;;                      :port  "5432"}
  ;;    :jwt-secret        "your-dev-secret-change-me"

  ;;    ;; Path within the container where seed XLS files are located
  ;;    :seed-xls-dir      "../../seed_xls"

  ;;    ;; Path within the container where Neo4j can import CSVs from
  ;;    ;; Note: This MUST match Neo4j's configured `server.directories.import` path
  ;;    :neo4j-import-dir  "../../seed_csv"

  ;;    ;; Path within the container where Prism can write intermediate CSVs
  ;;    ;; Often the same as :neo4j-import-dir, but could differ in some setups
  ;;    :csv-output-dir   "../../seed_csv"

  ;;    ;; UID resolution settings (matching TS implementation defaults)
  ;;    :min-free-uid      (Integer/parseInt "1000000000")
  ;;    :min-free-fact-uid (Integer/parseInt "2000000000")
  ;;    :max-temp-uid      (Integer/parseInt "1000")

  ;;    ;; Server settings
  ;;    :ws-server        {:port (Integer/parseInt  "3333")}
  ;;    :api-server-port  (Integer/parseInt  "3333")
  ;;    :api-server-host  "0.0.0.0"

  ;;    ;; Logging level
  ;;    :log-level        (keyword  "info")})


;; Convenience accessors
(defn neo4j-uri [] (:neo4j-uri config))
(defn neo4j-user [] (:neo4j-user config))
(defn neo4j-password [] (:neo4j-password config))
(defn db-spec [] (:db-spec config))
(defn jwt-secret [] (:jwt-secret config))
(defn seed-xls-dir [] (:seed-xls-dir config))
(defn neo4j-import-dir [] (:neo4j-import-dir config))
(defn csv-output-dir [] (:csv-output-dir config))
(defn api-server-port [] (:api-server-port config))
(defn api-server-host [] (:api-server-host config))
(defn ws-server-port [] (get-in config [:ws-server :port]))
(defn uid-ranges [] (select-keys config [:min-free-uid :min-free-fact-uid :max-temp-uid]))
(defn log-level [] (:log-level config))

;; Set log level based on config
(log/set-level! (log-level))

(log/info "Prism configuration loaded.")
