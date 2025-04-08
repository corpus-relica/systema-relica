(ns io.relica.archivist.services.concept-service
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.db.queries :as queries]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.archivist.services.cache-service :as cache]
            [io.relica.archivist.services.gellish-base-service :as gellish]))


(defprotocol ConceptOperations
  (delete-entity [this uid]))

(defrecord ConceptService [graph-service cache-service gellish-base-service]
  ConceptOperations
  (delete-entity [_ uid]
    (go
      (try
        ;; Get all facts involving the entity
        (let [fact-uids (cache/all-facts-involving-entity cache-service uid)
              facts (map #(gellish/get-fact gellish-base-service %) fact-uids)]
          (log/debug "FACT UIDS" fact-uids)
          
          ;; Delete each fact and update cache
          (doseq [fact facts]
            (log/debug "FACT" fact)
              (cache/remove-from-facts-involving-entity cache-service
                                                           (:lh_object_uid fact)
                                                           (:fact_uid fact))
              (cache/remove-from-facts-involving-entity cache-service
                                                             (:rh_object_uid fact)
                                                             (:fact_uid fact))
            (graph/exec-write-query graph-service
                                  queries/delete-fact
                                  {:uid (:fact_uid fact)}))
          
          ;; Remove entity from cache
          (cache/remove-entity cache-service uid)
          
          ;; Delete the entity node
          (graph/exec-write-query graph-service
                                queries/delete-entity
                                {:uid uid})
          
          ;; Return success result
          {:result "success" 
           :uid uid 
           :deleted-facts facts})
        (catch Exception e
          (log/error "Error deleting entity:" e)
          (throw e))))))

(defn create-concept-service [{:keys [graph cache gellish-base]}]
  (->ConceptService graph cache gellish-base))

(defonce concept-service (atom nil))

(defn start [services]
  (println "Starting Concept Service...")
  (let [service (create-concept-service services)]
    (reset! concept-service service)
    service))

(defn stop  []
  (println "Stopping Concept Service..."))

(comment
  ;; Test operations
  (let [test-service (create-concept-service graph-service cache-service gellish-base-service)]
    (delete-entity test-service 123))

  )
