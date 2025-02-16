(ns io.relica.archivist.gellish-base-service
  (:require [mount.core :refer [defstate]]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [io.relica.archivist.db.neo4j :as neo4j]
            [io.relica.archivist.db.queries :as queries]
            [io.relica.archivist.cache-service :as cache]
            )
  (:import (java.net URI))
  (:gen-class))

(defprotocol GellishBaseServiceOperations
  (get-entities [this uids])
  (someshit [this]))

(defrecord GellishBaseServiceComponent [neo4j-conn cache-service]
  GellishBaseServiceOperations

  (get-entities [this uids]
    (tap> "UIDS")
    (tap> uids)
    (let [raw-result (neo4j/execute-query
                      neo4j-conn
                      queries/entities  ; Use the predefined query
                      {:uids uids})
          result (map(fn [record]
                       (let [uid (:uid (:n record))
                             descendants (cache/all-descendants-of cache-service uid)]
                         {:uid uid :descendants descendants}))
                      raw-result)]
      (tap> {:event :get-entities-result
             :result result})
      result))

  (someshit [this]
    (println "SOMESHIT"))

  )

(defn create-gellish-base-service-component [neo4j-conn cache-service]
  (->GellishBaseServiceComponent neo4j-conn cache-service))

(defonce gb-comp (atom nil))

(defn start [neo4j-conn cache-service]
  (println "Starting Gellish Base Service...")
  (let [service (create-gellish-base-service-component neo4j-conn cache-service)]
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
