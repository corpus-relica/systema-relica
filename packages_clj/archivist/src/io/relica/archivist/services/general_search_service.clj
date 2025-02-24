(ns io.relica.archivist.services.general-search-service
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.archivist.services.cache-service :as cache]
            [io.relica.archivist.db.queries :as queries]))

(defprotocol GeneralSearchOperations
  (get-text-search [this search-term collection-uid page page-size filter exact-match])
  (get-uid-search [this search-term collection-uid page page-size filter]))

(defrecord GeneralSearchService [graph-service cache-service]
  GeneralSearchOperations
  
  (get-text-search [_ search-term collection-uid page page-size filter exact-match]
    (go
      (try
        (let [descendants (when filter
                           (<! (cache/all-descendants-of cache-service (:uid filter))))
              rel-type-uids [1146 1726 1981 1225]
              skip (* (dec page) page-size)
              results (graph/exec-query graph-service
                                      queries/text-search
                                      {:searchTerm search-term
                                       :relTypeUIDs rel-type-uids
                                       :filterUIDs (or descendants [])
                                       :collectionUID (or collection-uid "")
                                       :exactMatch exact-match
                                       :skip skip
                                       :pageSize page-size})
              count-results (graph/exec-query graph-service
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

  (get-uid-search [_ search-term collection-uid page page-size filter]
    (go
      (try
        (let [descendants (when filter
                           (<! (cache/all-descendants-of cache-service (:uid filter))))
              rel-type-uids [1146 1726 1981 1225]
              skip (* (dec page) page-size)
              results (graph/exec-query graph-service
                                      queries/uid-search
                                      {:searchTerm search-term
                                       :relTypeUIDs rel-type-uids
                                       :filterUIDs (or descendants [])
                                       :collectionUID (or collection-uid "")
                                       :skip skip
                                       :pageSize page-size})
              count-results (graph/exec-query graph-service
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
          {:error "Failed to execute UID search"})))))

(defn create-general-search-service [{:keys [graph
                                             cache]}]
  (->GeneralSearchService graph cache))

(defonce general-search-service (atom nil))

(defn start [services]
  (println "Starting General Search Service...")
  (let [service (create-general-search-service services)]
    (reset! general-search-service service)
    service))

(defn stop []
  (println "Stopping General Search Service..."))

(comment
  ;; Test operations
  @general-search-service
  ;;(get-text-search [_ search-term collection-uid page page-size filter exact-match]
  (go
    (let [results (<! (get-text-search @general-search-service "r" nil 1 10 nil false))]
    (tap> results)
    (println results)))

  )
