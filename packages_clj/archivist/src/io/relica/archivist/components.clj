(ns io.relica.archivist.components
  (:require [mount.core :refer [defstate]]
            [io.relica.archivist.config :refer [db-config]]
            [io.relica.archivist.db.neo4j :as neo4j]
            [io.relica.archivist.db.postgres :as postgres]
            [io.relica.archivist.db.redis :as redis]
            [io.relica.archivist.io.ws-server :as ws-server]
            [io.relica.archivist.gellish-base-service :as gellish-base-service]
            [io.relica.archivist.linearization-service :as linearization-service]
            [io.relica.archivist.cache-service :as cache-service]
            )
  (:import (java.net URI)))


(defstate lin-service
  :start (do
           (println "Starting Linearization service...")
           (linearization-service/start))
  :stop (do
          (println "Stopping Linearization service...")
          (linearization-service/stop)))

(defstate cache-service
  :start (do
           (println "Starting Cache service...")
           (cache-service/start lin-service))
  :stop (do
          (println "Stopping Cache service...")
          (cache-service/stop)))

(defstate neo4j-conn
  :start (let [{:keys [url user password]} (:neo4j db-config)
               uri (URI. url)]
           (println "Starting Neo4j connection...")
           (neo4j/start uri user password))
  :stop (do
          (println "Stopping Neo4j connection...")
          (neo4j/stop)))

(defstate postgres-db
  :start (let [db-spec (:postgres db-config)]
           (println "Starting PostgreSQL connection...")
           (postgres/start db-spec))
  :stop (do
          (println "Stopping PostgreSQL connection...")
          (postgres/stop)))

;; (defstate redis-pool
;;   :start (let [{:keys [host port]} (:redis db-config)]
;;            (println "Starting Redis connection pool...")
;;            (redis/start))
;;   :stop (do
;;           (println "Stopping Redis connection pool...")
;;           (redis/stop)))

(defstate gellish-base-service
  :start (do
           (println "Starting Gellish Base service...")
           (gellish-base-service/start neo4j-conn cache-service))
  :stop (do
           (println "Stopping Gellish Base service...")
          (gellish-base-service/stop)))

(defstate ws-server
  :start (let [;;{:keys [host port]} (:ws-server db-config)
               server-port 3000];;(or port 3000)]
           (tap> "Starting WebSocket server...")
           (println "Starting WebSocket server on port" server-port "...")
           ;; (mount.core/args {:xxx gellish-base-service
           ;;                   :port server-port})
           (ws-server/start gellish-base-service server-port))
  :stop (do
          (println "Stopping WebSocket server...")
          (ws-server/stop ws-server)))

