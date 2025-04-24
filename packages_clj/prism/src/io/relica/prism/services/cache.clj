(ns io.relica.prism.services.cache
  (:require [taoensso.timbre :as log]
            [io.relica.common.services.cache-service :refer [cache-service-comp start] :as common-cache]
            [io.relica.common.io.archivist-client :as archivist]
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
  "Builds entity facts cache asynchronously. Returns channel yielding true/false."
  []
  (log/info "Building entity facts cache...")
  (go
    (try
      (loop [offset 0]
        (let [facts-batch-res (<! (archivist/get-batch-facts archivist-client {:range BATCH_SIZE :skip offset}))
              facts-batch (:facts facts-batch-res)]
          (if (empty? facts-batch)
            (do
              (log/info "Finished building entity facts cache.")
              true) ; Loop finished successfully
            (do
              (log/trace (str "Processing facts batch (offset " offset ", size " (count facts-batch) ")"))
              (process-facts-batch-for-facts-cache! facts-batch)
              (recur (+ offset BATCH_SIZE))))))
      (catch Exception e
        (log/error e "Error building entity facts cache")
        false))) ; Indicate failure
  )

;; --- Entity Lineage Cache ---

(defn- process-facts-batch-for-lineage-cache!
  "Processes a batch of facts for lineage cache. Returns chan yielding true/false."
  [facts]
  (go
    (try
      (doseq [{:keys [lh_object_uid fact_uid]} facts]
        (let [lineage-res (<! (request-lineage lh_object_uid))
              success (:success lineage-res)
              lineage (:data lineage-res)]
          (log/trace "Processing lineage fact:" fact_uid "lh_object_uid:" lh_object_uid)
          (when (and lh_object_uid (not-empty lineage) success)
            (common-cache/add-to-entity-lineage-cache @cache-service-comp lh_object_uid lineage))))
      true ; doseq completed successfully
      (catch Exception e
        (log/error e "Error processing batch for lineage cache")
        false))))

(defn process-nodes-lc
  "Processes nodes for lineage cache. Returns channel yielding true/false."
  []
  (go
    (try
      (loop [skip 0]
          (let [_ (log/trace "Processing lineage batch starting at" skip "...")
                facts-batch-res (<! (archivist/get-batch-facts archivist-client {:range BATCH_SIZE
                                                                                 :skip skip
                                                                                 :rel-type-uids [1146 1726]}))
                facts-batch (:facts facts-batch-res)]
            (if (empty? facts-batch)
              (do
                (log/info "Finished processing nodes for lineage cache.")
                true) ; Loop finished successfully
              (do
                (log/trace (str "Processing lineage facts batch (offset " skip ", size " (count facts-batch) ")"))
                ;; Wait for the batch processing go block to complete
                (let [batch-result (<! (process-facts-batch-for-lineage-cache! facts-batch))]
                  (when-not batch-result ; Check if the batch processing itself failed
                    (throw (ex-info "Failed processing lineage batch" {:offset skip}))))
                (recur (+ skip BATCH_SIZE))))))
      (catch Exception e
        (log/error e "Error processing nodes for lineage cache")
        false))) ; Indicate failure
    )


(defn build-entity-lineage-cache!
  "Builds entity lineage cache asynchronously. Returns channel yielding true/false."
  []
  (log/info "Building entity lineage cache...")
  (go
    (try
      (let [count (<! (archivist/get-facts-count archivist-client))]
        (log/info "Total Facts for Lineage Cache:" count)
        ;; Wait for the processing loop to finish and return true/false
        (<! (process-nodes-lc)))
      (catch Exception e
        (log/error e "Error initiating entity lineage cache build")
        false)))
  )

;; --- Subtypes Cache ---

(defn- process-facts-batch-for-subtypes-cache!
  "Processes a batch of facts for subtypes cache. Returns chan yielding true/false."
  [facts]
  (go
    (try
      (doseq [{:keys [lh_object_uid fact_uid]} facts]
        (let [lineage-res (<! (request-lineage lh_object_uid))
              success (:success lineage-res)
              lineage (:data lineage-res)]
          (log/trace "Processing subtype fact:" fact_uid "lh_object_uid:" lh_object_uid "lineage:" lineage)
          (when (and lh_object_uid (not-empty lineage) success)
            (doseq [ancestor-uid lineage]
              (log/trace "Adding to subtypes cache:" lh_object_uid "->" ancestor-uid)
              (common-cache/add-descendant-to @cache-service-comp ancestor-uid lh_object_uid)))))
      true ; doseq completed successfully
      (catch Exception e
        (log/error e "Error processing batch for subtypes cache")
        false))))

(defn process-nodes-sc
  "Processes nodes for subtypes cache. Returns channel yielding true/false."
  []
  (go
    (try
      (loop [skip 0]
          (let [_ (log/trace "Processing subtypes batch starting at" skip "...")
                facts-batch-res (<! (archivist/get-batch-facts archivist-client {:range BATCH_SIZE
                                                                                 :skip skip
                                                                                 :rel-type-uids [1146 1726]}))
                facts-batch (:facts facts-batch-res)]
            (if (empty? facts-batch)
              (do
                (log/info "Finished processing nodes for subtypes cache.")
                true) ; Loop finished successfully
              (do
                (log/trace (str "Processing subtypes facts batch (offset " skip ", size " (count facts-batch) ")"))
                ;; Wait for the batch processing go block to complete
                (let [batch-result (<! (process-facts-batch-for-subtypes-cache! facts-batch))]
                   (when-not batch-result ; Check if the batch processing itself failed
                     (throw (ex-info "Failed processing subtypes batch" {:offset skip}))))
                (recur (+ skip BATCH_SIZE))))))
      (catch Exception e
        (log/error e "Error processing nodes for subtypes cache")
        false))) ; Indicate failure
    )


(defn build-subtypes-cache!
  "Builds entity subtypes cache asynchronously. Returns channel yielding true/false."
  []
  (log/info "Building entity subtypes cache...")
  (go
    (try
      (let [count (<! (archivist/get-facts-count archivist-client))]
        (log/info "Total Facts for Subtypes Cache:" count)
        ;; Wait for the processing loop to finish and return true/false
        (<! (process-nodes-sc)))
      (catch Exception e
        (log/error e "Error initiating entity subtypes cache build")
        false)))
  )

;; --- Facts Cache ---
