(ns io.relica.prism.cache
  (:require [taoensso.timbre :as log]
            [io.relica.common.services.cache-service :refer [cache-service-comp start] :as common-cache]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.prism.cache.stubs :as stubs]
            [io.relica.prism.io.client-instances :refer [request-lineage archivist-client]]
            [clojure.core.async :refer [go <! >!]]))

(def ^:const BATCH_SIZE 100) ; Smaller batch size for demonstration

(if (nil? @cache-service-comp)
     (io.relica.common.services.cache-service/start "suck a dick") nil)

;; --- Entity Facts Cache ---

(defn- process-facts-batch-for-facts-cache!
  "Processes a batch of facts to update the entity facts cache."
  [facts]
  (doseq [{:keys [lh_object_uid rh_object_uid fact_uid]} facts]
    (println "Processing fact:" fact_uid
           "lh_object_uid:" lh_object_uid
           "rh_object_uid:" rh_object_uid)
    (when (and lh_object_uid rh_object_uid fact_uid)
      ;; Use common cache service
      (common-cache/add-to-entity-facts-cache @cache-service-comp lh_object_uid fact_uid)
      (common-cache/add-to-entity-facts-cache @cache-service-comp rh_object_uid fact_uid))))

(defn build-entity-facts-cache!
  "Builds a cache mapping entity UIDs to the set of fact UIDs they participate in.
   Iterates through all :Fact nodes."
  []
  (log/info "Building entity facts cache...")
  ;; Use common cache service
  ;; (common-cache/clear-entity-facts-cache-complete @common-cache/cache-service-comp)
  (go
    (loop [offset 0]
      (let [facts-batch-res (<! (archivist/get-batch-facts archivist-client {:range BATCH_SIZE :skip offset}))
            facts-batch (:facts facts-batch-res)]
        (if (empty? facts-batch)
          (do
            (log/info "Finished building entity facts cache.")
            true) ; Signal completion
          (do
            (println (str "Processing facts batch (offset " count ", size " (count facts-batch) ")"))
            ;; (println "Facts batch:" facts-batch)
            (process-facts-batch-for-facts-cache! facts-batch)
            (recur (+ offset BATCH_SIZE))))))))

;; --- Entity Lineage Cache ---

(defn- process-facts-batch-for-lineage-cache!
  "Processes a batch of facts to update the entity lineage cache."
  [facts]
  (go
  (doseq [{:keys [lh_object_uid fact_uid]} facts]
    (let [lineage-res (<! (request-lineage lh_object_uid))
          success (:success lineage-res)
          lineage (:data lineage-res)] ; Assuming request-lineage is async
      (println "Processing fact:" fact_uid
             "lh_object_uid:" lh_object_uid)
      (when (and lh_object_uid (not-empty lineage) success)
        ;; Use common cache service
        (common-cache/add-to-entity-lineage-cache @cache-service-comp lh_object_uid lineage))))))

(defn process-nodes-lc
  []
  (go
    (loop [skip 0]
        (let [_ (println "Processing batch " (/ skip (+ BATCH_SIZE 1)) "...")
              facts-batch-res (<! (archivist/get-batch-facts archivist-client {:range BATCH_SIZE
                                                                               :skip skip
                                                                               :rel-type-uids [1146 1726]}))
              facts-batch (:facts facts-batch-res)]
          (if (empty? facts-batch)
            "eat shit"
            (do
              (println (str "Processing facts batch (offset " count ", size " (count facts-batch) ")"))
              ;; (println "Facts batch:" facts-batch)
              (process-facts-batch-for-lineage-cache! facts-batch)
              (recur (+ skip BATCH_SIZE)))
          )
        )
      )
    )
  )

(defn build-entity-lineage-cache!
  "Builds a cache mapping entity UIDs to their supertype lineage (ordered list of UIDs).
   Returns a channel that yields true on completion."
  []
  (log/info "Building entity lineage cache...")
  (go
    (let [count (<! (archivist/get-facts-count archivist-client))]
      (println "BUILDING ENTITY LINEAGE CACHE")
      (println "Total Facts:" count)

      ;; (common-cache/clear-entity-lineage-cache-complete @common-cache/cache-service-comp)

      (process-nodes-lc)

      (println "COMPLETED BUILDING ENTITY LINEAGE CACHE")
    )
  ))

;; --- Subtypes Cache ---

(defn- process-facts-batch-for-subtypes-cache!
  "Processes a batch of facts to update the entity lineage cache."
  [facts]
  (go
  (doseq [{:keys [lh_object_uid fact_uid]} facts]
    (let [lineage-res (<! (request-lineage lh_object_uid))
          success (:success lineage-res)
          lineage (:data lineage-res)] ; Assuming request-lineage is async
      (println "Processing fact:" fact_uid
             "lh_object_uid:" lh_object_uid
             "lineage:" lineage)
      (when (and lh_object_uid (not-empty lineage) success)
        ;; Use common cache service
        (doseq [ancestor-uid lineage] ; Assuming lineage is a collection of UIDs
          (println "Adding to subtypes cache:" lh_object_uid "->" ancestor-uid)
          ;; Use common cache service, treating subtypes as descendants
          (common-cache/add-descendant-to @cache-service-comp  ancestor-uid lh_object_uid)))))))
        ;; (common-cache/add-descendant-to @cache-service-comp lh_object_uid lineage))))))


(defn process-nodes-sc
  []
  (go
    (loop [skip 0]
        (let [_ (println "Processing batch " (/ skip (+ BATCH_SIZE 1)) "...")
              facts-batch-res (<! (archivist/get-batch-facts archivist-client {:range BATCH_SIZE
                                                                               :skip skip
                                                                               :rel-type-uids [1146 1726]}))
              facts-batch (:facts facts-batch-res)]
          (if (empty? facts-batch)
            "eat shit"
            (do
              (println (str "Processing facts batch (offset " count ", size " (count facts-batch) ")"))
              ;; (println "Facts batch:" facts-batch)
              (process-facts-batch-for-subtypes-cache! facts-batch)
              (recur (+ skip BATCH_SIZE)))
          )
        )
      )
    )
  )

(defn build-subtypes-cache!
  "Builds a cache mapping entity UIDs to the set of all their recursive subtype UIDs."
  []
  (log/info "Building entity subtypes cache...")
  (go
    (let [count (<! (archivist/get-facts-count archivist-client))]
      (println "BUILDING ENTITY SUBTYPES CACHE")
      (println "Total Facts:" count)

      ;; (common-cache/clear-entity-lineage-cache-complete @common-cache/cache-service-comp)

      (process-nodes-sc)

      (println "COMPLETED BUILDING ENTITY LINEAGE CACHE")
    )
  ))

;; --- Facts Cache ---

(defn- process-facts-batch-for-entity-facts-cache!
  "Processes a batch of facts to update the entity facts cache."
  [facts]
  (doseq [{:keys [lh_object_uid rh_object_uid fact_uid]} facts]
    (println "Processing fact:" fact_uid
           "lh_object_uid:" lh_object_uid
           "rh_object_uid:" rh_object_uid)
    (when (and lh_object_uid rh_object_uid fact_uid)
      ;; Use common cache service
      (common-cache/add-to-entity-facts-cache @cache-service-comp lh_object_uid fact_uid)
      (common-cache/add-to-entity-facts-cache @cache-service-comp rh_object_uid fact_uid))))

(defn process-nodes-fc
  []
  (go
    (loop [skip 0]
        (let [_ (println "Processing batch " (/ skip (+ BATCH_SIZE 1)) "...")
              facts-batch-res (<! (archivist/get-batch-facts archivist-client {:range BATCH_SIZE
                                                                               :skip skip}))
              facts-batch (:facts facts-batch-res)]
          (if (empty? facts-batch)
            "eat shit"
            (do
              (println (str "Processing facts batch (offset " count ", size " (count facts-batch) ")"))
              ;; (println "Facts batch:" facts-batch)
              (process-facts-batch-for-entity-facts-cache! facts-batch)
              (recur (+ skip BATCH_SIZE)))
          )
        )
      )
    )
  )

(defn build-entity-fact-cache!
  "Builds a cache mapping entity UIDs to the set of all fact-uids it participates in directly.
   Returns a channel that yields true on completion."
  []
  (log/info "Building entity subtypes cache...")
  (go
    (let [count (<! (archivist/get-facts-count archivist-client))]
      (println "BUILDING ENTITY FACTS CACHE")
      (println "Total Facts:" count)

      ;; (common-cache/clear-entity-lineage-cache-complete @common-cache/cache-service-comp)

      (process-nodes-fc)

      (println "COMPLETED BUILDING ENTITY LINEAGE CACHE")
    )
  ))
