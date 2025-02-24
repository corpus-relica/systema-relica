(ns io.relica.archivist.components
  (:require [mount.core :refer [defstate]]
            [io.relica.archivist.config :refer [db-config]]
            [io.relica.archivist.db.neo4j :as neo4j]
            [io.relica.archivist.db.postgres :as postgres]
            [io.relica.archivist.db.redis :as redis]
            [io.relica.archivist.io.ws-server :as ws-server]
            ;;
            [io.relica.archivist.services.gellish-base-service :as gellish-base-service]
            [io.relica.archivist.services.kind-service :as kind-service]
            [io.relica.archivist.services.linearization-service :as linearization-service]
            [io.relica.archivist.services.cache-service :as cache-service]
            [io.relica.archivist.services.fact-service :as fact-service]
            [io.relica.archivist.services.concept-service :as concept-service]
            [io.relica.archivist.services.graph-service :as graph-service]
            [io.relica.archivist.services.entity-retrieval-service :as entity-retrieval-service]
            [io.relica.archivist.services.general-search-service :as general-search-service]
            ;;
            )
  (:import (java.net URI)))



;; GRAPH SERVICE

(defstate graph-service
  :start (do
           (println "Starting Graph service...")
           (graph-service/start))
  :stop (do
          (println "Stopping Graph service...")
          (graph-service/stop)))

;; LINEARIZATION SERVICE

(defstate lin-service
  :start (do
           (println "Starting Linearization service...")
           (linearization-service/start))
  :stop (do
          (println "Stopping Linearization service...")
          (linearization-service/stop)))

;; CACHE SERVICE

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

;; POSTGRES CONNECTION

(defstate postgres-db
  :start (let [db-spec (:postgres db-config)]
           (println "Starting PostgreSQL connection...")
           (postgres/start db-spec))
  :stop (do
          (println "Stopping PostgreSQL connection...")
          (postgres/stop)))

;; GELLISH BASE SERVICE

(defstate gellish-base-service
  :start (do
           (println "Starting Gellish Base service...")
           (gellish-base-service/start neo4j-conn cache-service))
  :stop (do
           (println "Stopping Gellish Base service...")
          (gellish-base-service/stop)))

;; KIND SERVICE

(defstate kind-service
  :start (do
           (println "Starting Kinds service...")
           (kind-service/start neo4j-conn cache-service))
  :stop (do
           (println "Stopping Kinds service...")
          (kind-service/stop)))

;; CONCEPT SERVICE

(defstate concept-service
  :start (do
           (println "Starting Concept service...")
           (concept-service/start {:graph graph-service
                                   :gellish-base gellish-base-service
                                   :cache cache-service}))
  :stop (do
          (println "Stopping Concept service...")
          (concept-service/stop)))

;; FACT SERVICE

(defstate fact-service
  :start (do
           (println "Starting Fact service...")
           (fact-service/start {:graph graph-service
                                :gellish-base gellish-base-service
                                :cache cache-service
                                :concept kind-service}))
  :stop (do
          (println "Stopping Fact service...")
          (fact-service/stop)))

;; ENTITY RETRIEVAL SERVICE

(defstate entity-retrieval-service
  :start (do
           (println "Starting Entity Retrieval service...")
           (entity-retrieval-service/start {:graph graph-service
                                            :fact fact-service
                                            :cache cache-service}))
  :stop (do
          (println "Stopping Entity Retrieval service...")
          (entity-retrieval-service/stop)))

;; GENERAL SEARCH SERVICE

(defstate general-search-service
  :start (do
           (println "Starting General Search service...")
           (general-search-service/start {:graph graph-service
                                          :cache cache-service}))
  :stop (do
          (println "Stopping General Search service...")
          (general-search-service/stop)))

;; WEBSOCKET SERVER

(defstate ws-server
  :start (let [;;{:keys [host port]} (:ws-server db-config)
               server-port 3000];;(or port 3000)]
           (tap> "Starting WebSocket server...")
           (println "Starting WebSocket server on port" server-port "...")
           ;; (mount.core/args {:xxx gellish-base-service
           ;;                   :port server-port})
           (ws-server/start {:gellish-base gellish-base-service
                             :kind kind-service
                             :entity-retrieval entity-retrieval-service
                             :general-search general-search-service
                             :port server-port}))
  :stop (do
          (println "Stopping WebSocket server...")
          (ws-server/stop ws-server)))
