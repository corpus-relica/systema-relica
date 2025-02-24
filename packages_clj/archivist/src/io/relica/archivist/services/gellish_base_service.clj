(ns io.relica.archivist.services.gellish-base-service
  (:require [mount.core :refer [defstate]]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [io.relica.archivist.db.neo4j :as neo4j]
            [io.relica.archivist.db.queries :as queries]
            [io.relica.archivist.services.cache-service :as cache]
            [clojure.tools.logging :as log])
  (:import (java.net URI))
  (:gen-class))

(defprotocol GellishBaseServiceOperations
  (get-entities [this uids])
  (get-fact [this fact-uid])
  (get-facts [this fact-uids])
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
          result (map (fn [record]
                        (let [uid (:uid (:n record))
                              descendants (cache/all-descendants-of cache-service uid)]
                          {:uid uid :descendants descendants}))
                      raw-result)]
      (tap> {:event :get-entities-result
             :result result})
      result))

  (get-fact [this fact-uid]
    (try
      (let [result (neo4j/execute-query
                    neo4j-conn
                    queries/fact
                    {:uid fact-uid})]
        (when (seq result)
          (-> (first result)
              (get-in [:n :properties]))))
      (catch Exception e
        (log/error "Error getting fact:" e)
        nil)))

  (get-facts [this fact-uids]
    (try
      (let [result (neo4j/execute-query
                    neo4j-conn
                    queries/facts
                    {:uids fact-uids})]
        (when (seq result)
          (mapv #(get-in % [:n :properties]) result)))
      (catch Exception e
        (log/error "Error getting facts:" e)
        nil)))

  (someshit [this]
    (println "SOMESHIT")))

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

  (io.relica.archivist.services.gellish-base-service/get-entities @gb-comp [1225 1146])

  ;; Test get-fact
  (get-fact @gb-comp 123)

  ;; Test get-facts
  (get-facts @gb-comp [123 456])

  ;; (someshit service)

  ;; (stop)
  )
