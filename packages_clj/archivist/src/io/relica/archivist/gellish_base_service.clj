(ns io.relica.archivist.gellish-base-service
  (:require [mount.core :refer [defstate]]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [io.relica.archivist.db.neo4j :as neo4j]
            [io.relica.archivist.db.queries :as queries])
  (:import (java.net URI))
  (:gen-class))

(defprotocol GellishBaseServiceOperations
  (get-entities [this uids])
  (someshit [this]))

(defrecord GellishBaseServiceComponent [neo4j-conn]
  GellishBaseServiceOperations

  (get-entities [this uids]
    (tap> "UIDS")
    (tap> uids)
    (let [result (neo4j/execute-query
                  neo4j-conn
                  queries/match-entities  ; Use the predefined query
                  {:uids uids})]
      (tap> {:event :get-entities-result
             :result result})
      result))

  (someshit [this]
    (println "SOMESHIT"))

  )

(defn create-gellish-base-service-component [neo4j-conn]
  (->GellishBaseServiceComponent neo4j-conn))

(defonce gb-comp (atom nil))

(defn start [neo4j-conn]
  (println "Starting Gellish Base Service...")
  (let [service (create-gellish-base-service-component neo4j-conn)]
    (reset! gb-comp service)
    service))

(defn stop []
  (println "Stopping Gellish Base Service..."))

(comment
  ;; (def neo4j-instance io.relica.archivist.components/neo4j-conn)

  ;; neo4j-instance

  ;; (neo4j/execute-query neo4j-instance "foobar" {:foo "bar"})

  ;; (def service (start neo4j-instance))

  @gb-comp

  (io.relica.archivist.gellish-base-service/get-entities @gb-comp [1225 1146])

  ;; (someshit service)

  ;; (stop)

  )
