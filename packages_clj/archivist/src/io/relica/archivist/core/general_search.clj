(ns io.relica.archivist.core.general-search
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.common.services.cache-service :as cache]
            [io.relica.archivist.db.queries :as queries]))


(defn get-text-search [search-term collection-uid page page-size filter exact-match]
  (go
    (try
      (let [descendants (when filter
                          (cache/all-descendants-of cache/cache-service (:uid filter)))
            rel-type-uids [1146 1726 1981 1225]
            skip (* (dec page) page-size)
            results (graph/exec-query graph/graph-service
                                    queries/text-search
                                    {:searchTerm search-term
                                     :relTypeUIDs rel-type-uids
                                     :filterUIDs (or descendants [])
                                     :collectionUID (or collection-uid "")
                                     :exactMatch exact-match
                                     :skip skip
                                     :pageSize page-size})
            count-results (graph/exec-query graph/graph-service
                                          queries/count-text-search
                                          {:searchTerm search-term
                                           :relTypeUIDs rel-type-uids
                                           :filterUIDs (or descendants [])
                                           :collectionUID (or collection-uid "")
                                           :exactMatch exact-match})
            total (get-in (first count-results) [:total])]
        {:totalCount total
         :page page
         :pageSize page-size
         :facts (graph/transform-results results)})
      (catch Exception e
        (log/error e "Error in text search")
        {:error "Failed to execute text search"}))))

(defn get-uid-search [search-term collection-uid page page-size filter]
  (go
    (try
      (let [descendants (when filter
                          (cache/all-descendants-of cache/cache-service (:uid filter)))
            rel-type-uids [1146 1726 1981 1225]
            skip (* (dec page) page-size)
            results (graph/exec-query graph/graph-service
                                    queries/uid-search
                                    {:searchTerm search-term
                                     :relTypeUIDs rel-type-uids
                                     :filterUIDs (or descendants [])
                                     :collectionUID (or collection-uid "")
                                     :skip skip
                                     :pageSize page-size})
            count-results (graph/exec-query graph/graph-service
                                          queries/count-uid-search
                                          {:searchTerm search-term
                                           :relTypeUIDs rel-type-uids
                                           :filterUIDs (or descendants [])
                                           :collectionUID (or collection-uid "")})
            total (get-in (first count-results) [:total])]
        {:totalCount total
         :page page
         :pageSize page-size
         :facts (graph/transform-results results)})
      (catch Exception e
        (log/error e "Error in UID search")
        {:error "Failed to execute UID search"}))))


(comment

  )
