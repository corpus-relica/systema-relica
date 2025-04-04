(ns io.relica.archivist.db.postgres
  (:require [mount.core :refer [defstate]]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [io.relica.archivist.config :refer [db-config]]))

(defprotocol PostgresOperations
  (execute-query [this query params])
  (execute-one [this query params])
  (with-transaction [this tx-fn])
  (get-datasource [this]))

(defrecord PostgresComponent [datasource]
  PostgresOperations
  (execute-query [_ query params]
    ;; Returns multiple results
    )

  (execute-one [_ query params]
    ;; Returns single result
    )

  (with-transaction [_ tx-fn]
    ;; Execute function within transaction
    )

  (get-datasource [_]
    datasource))

(defn create-postgres-component [db-spec]
  (->PostgresComponent (jdbc/get-datasource db-spec)))

(defonce postgres-comp (atom nil))

(defn start [db-spec]
  (println "connecting to PostgreSQL...")
  (let [datasource (create-postgres-component db-spec)]
    (reset! postgres-comp datasource)
    datasource))

(defn stop []
  (println "disconnecting from PostgreSQL...")
  ;; Connection pool cleanup if needed
  ;; (.close (get-datasource @postgres-comp))
  )

(comment
  (def db-spec
    {:dbtype (get-in db-config [:postgres :dbtype])
     :dbname (get-in db-config [:postgres :dbname])
     :host (get-in db-config [:postgres :host])
     :port (get-in db-config [:postgres :port])
     :user (get-in db-config [:postgres :user])
     :password (get-in db-config [:postgres :password])})

  (start db-spec)

  (get-datasource @postgres-comp)

  (stop)

)
