(ns io.relica.archivist.services.entity-retrieval-service
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.archivist.services.cache-service :as cache]
            [io.relica.archivist.services.fact-service :as fact]
            [io.relica.archivist.db.queries :as queries]))

(def collection-root-uid 970178)  ; 970187 : collection of facts

(defprotocol EntityRetrievalOperations
  (get-collections [this])
  (get-entity-type [this uid]))

(defrecord EntityRetrievalService [graph-service cache-service fact-service]
  EntityRetrievalOperations

  (get-collections [_]
    (go
      (try
        (when (nil? cache-service)
          (throw (ex-info "Cache service not initialized" {:service :cache})))
        (when (nil? fact-service)
          (throw (ex-info "Fact service not initialized" {:service :fact})))

        (let [_ (tap> "Fetching collection descendants from cache service")
              collection-uids (conj (cache/all-descendants-of cache-service collection-root-uid)
                                    collection-root-uid)
              _ (tap> {:msg "Getting collections for UIDs:" :res collection-uids})
              results (atom [])]
          (doseq [uid collection-uids]
            (let [individuals (<! (fact/get-classified fact-service uid true))]
              (tap> (str "Got " (count individuals) " individuals for collection " uid))
              (when (seq individuals)
                (doseq [f individuals]
                  (swap! results conj {:name (:lh_object_name f)
                                       :uid (:lh_object_uid f)})))))
          (tap> (str "Returning " (count @results) " collections"))
          @results)
        (catch Exception e
          (tap>  "Error getting collections")
          (tap> e)
          []))))

  (get-entity-type [_ uid]
    (go
      (try
        (let [result (graph/exec-query graph-service
                                       queries/get-entity-type
                                       {:uid uid})]
          (when-let [fact (first result)]
            (let [rel-type-uid (get-in fact [:r :properties :rel_type_uid])]
              (cond
                (= rel-type-uid 1146) "kind"
                (= rel-type-uid 1726) "qualification"  ; subtype of kind
                (= rel-type-uid 1225) "individual"
                :else (do
                        (log/error "Unknown rel_type_uid for uid" uid ":" rel-type-uid)
                        nil)))))
        (catch Exception e
          (log/error "Error getting entity type:" e)
          nil)))))

(defn create-entity-retrieval-service [{:keys [graph
                                               cache
                                               fact]}]
  (->EntityRetrievalService graph cache fact))

(defonce entity-retrieval-service (atom nil))

(defn start [services]
  (println "Starting Entity Retrieval Service...")
  (let [service (create-entity-retrieval-service services)]
    (reset! entity-retrieval-service service)
    service))

(defn stop []
  (println "Stopping Entity Retrieval Service..."))

(comment
  ;; Test operations
  (let [test-service @entity-retrieval-service]
    (go
      (let [collections (<! (get-collections test-service))]
        (println "Collections:" collections)))

    (go
      (let [entity-type (<! (get-entity-type test-service 123))]
        (println "Entity type:" entity-type)))))
