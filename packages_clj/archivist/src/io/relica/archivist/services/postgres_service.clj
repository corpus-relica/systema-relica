(ns io.relica.archivist.services.postgres-service
  (:require [mount.core :refer [defstate]]
            [io.relica.archivist.config :refer [db-config]]
            [io.relica.archivist.db.postgres :as postgres]
            ))

(defstate postgres-service
  :start (let [db-spec (:postgres db-config)]
           (println "Starting PostgreSQL connection...")
           (postgres/start db-spec))
  :stop (do
          (println "Stopping PostgreSQL connection...")
          (postgres/stop)))
