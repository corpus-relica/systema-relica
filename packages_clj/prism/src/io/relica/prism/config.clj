(ns io.relica.prism.config
  (:require [environ.core :refer [env]]
            [taoensso.timbre :as log]))

(defn- get-env [key default-value] 
  (let [value (env key)]
    (if (nil? value)
      (log/warnf "Environment variable %s not set, using default: %s" key default-value)
      (log/infof "Using environment variable %s" key))
    (or value default-value)))

(defn- get-required-env [key]
  (let [value (env key)]
    (if (nil? value)
      (let [error-msg (format "Required environment variable %s is not set." key)]
        (log/error error-msg)
        (throw (IllegalStateException. error-msg)))
      (log/infof "Using environment variable %s" key))
    value))

(def config
  {:neo4j-uri        (get-required-env :prism-neo4j-uri) ; e.g., "neo4j+s://xxxx.databases.neo4j.io"
   :neo4j-user       (get-required-env :prism-neo4j-user) ; e.g., "neo4j"
   :neo4j-password   (get-required-env :prism-neo4j-password)
   
   ;; Path within the container where seed XLS files are located
   :seed-xls-dir     (get-env :prism-seed-xls-dir "/usr/src/app/seed_xls")

   ;; Path within the container where Neo4j can import CSVs from 
   ;; Note: This MUST match Neo4j's configured `server.directories.import` path
   :neo4j-import-dir (get-env :prism-neo4j-import-dir "/import") 

   ;; Path within the container where Prism can write intermediate CSVs
   ;; Often the same as :neo4j-import-dir, but could differ in some setups
   :csv-output-dir   (get-env :prism-csv-output-dir "/import")

   ;; UID resolution settings (matching TS implementation defaults)
   :min-free-uid      (Integer/parseInt (get-env :prism-min-free-uid "1000000000"))
   :min-free-fact-uid (Integer/parseInt (get-env :prism-min-free-fact-uid "2000000000"))
   :max-temp-uid      (Integer/parseInt (get-env :prism-max-temp-uid "1000"))

   ;; Logging level
   :log-level        (keyword (get-env :prism-log-level "info"))
   })

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
