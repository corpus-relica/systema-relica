(ns io.relica.archivist.core.entity-retrieval
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.db.queries :as queries]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.common.services.cache-service :as cache]
            [io.relica.archivist.core.fact :as fact]))

(def collection-root-uid 970178)  ; 970187 : collection of facts


(defn get-collections []
  (go
    (try
      (let [collection-uids (conj (cache/all-descendants-of cache/cache-service collection-root-uid)
                                  collection-root-uid)
            results (atom [])]
        (doseq [uid collection-uids]
          (let [individuals (<! (fact/get-classified uid true))]
            (when (seq individuals)
              (doseq [f individuals]
                (swap! results conj {:name (:lh_object_name f)
                                     :uid (:lh_object_uid f)})))))
        @results)
      (catch Exception e
        (tap>  "Error getting collections")
        (tap> e)
        []))))

(defn get-entity-type [uid]
  (go
    (try
      (let [result (graph/exec-query graph/graph-service
                                     queries/get-entity-type
                                     {:uid uid})]
        (when-let [fact (first result)]
          (let [rel-type-uid (get-in fact [:r :rel_type_uid])
                rel-type-uid (cond
                               (float? rel-type-uid) (int rel-type-uid)
                               (string? rel-type-uid) (Integer/parseInt rel-type-uid)
                               :else rel-type-uid)]
            (cond
              (= rel-type-uid 1146) "kind"
              (= rel-type-uid 1726) "qualification"  ; subtype of kind
              (= rel-type-uid 1225) "individual"
              :else (do
                      (log/error "Unknown rel_type_uid for uid" uid ":" rel-type-uid)
                      nil)))))
      (catch Exception e
        (log/error "Error getting entity type:" e)
        nil))))

