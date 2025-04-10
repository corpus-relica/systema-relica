(ns io.relica.prism.cache
  (:require [taoensso.timbre :as log]
            [io.relica.prism.cache.stubs :as stubs] ; Using stubs for now
            ; [io.relica.prism.db :as db] ; Stubbed
            ; [io.relica.prism.redis :as cache] ; Stubbed
            ; [io.relica.prism.lineage :as lineage] ; Stubbed
            ))

(def ^:const BATCH_SIZE 10) ; Smaller batch size for demonstration

;; --- Entity Facts Cache ---

(defn- process-facts-batch-for-facts-cache!
  "Processes a batch of facts to update the entity facts cache."
  [facts]
  (doseq [{:keys [lh_object_uid rh_object_uid fact_uid]} facts]
    (when (and lh_object_uid rh_object_uid fact_uid)
      ;; In Redis, this would likely be sadd or similar
      (stubs/add-to-entity-facts-cache! lh_object_uid fact_uid)
      (stubs/add-to-entity-facts-cache! rh_object_uid fact_uid))))

(defn build-entity-facts-cache!
  "Builds a cache mapping entity UIDs to the set of fact UIDs they participate in.
   Iterates through all :Fact nodes."
  []
  (log/info "Building entity facts cache...")
  (stubs/clear-entity-facts-cache!)
  (loop [offset 0]
    (let [facts-batch (stubs/fetch-all-fact-details-batched BATCH_SIZE offset)]
      (if (empty? facts-batch)
        (do
          (log/info "Finished building entity facts cache.")
          true) ; Signal completion
        (do
          (log/debugf "Processing facts batch (offset %d, size %d)" offset (count facts-batch))
          (process-facts-batch-for-facts-cache! facts-batch)
          (recur (+ offset BATCH_SIZE)))))))

;; --- Entity Lineage Cache ---

(defn- process-entities-batch-for-lineage!
  "Processes a batch of entity UIDs to update the entity lineage cache."
  [entity-uids]
  ;; Note: The TS version fetches facts, then gets lh_object_uid.
  ;; This version assumes we can get relevant entity UIDs directly or via facts.
  ;; Here, we'll simulate getting entity UIDs directly for simplicity.
  (doseq [entity-uid entity-uids]
    (let [lineage (stubs/calculate-lineage entity-uid)] ; Needs actual lineage calculation
       (stubs/add-to-entity-lineage-cache! entity-uid lineage))))


(defn build-entity-lineage-cache!
  "Builds a cache mapping entity UIDs to their supertype lineage (ordered list of UIDs)."
  []
  (log/info "Building entity lineage cache...")
  (stubs/clear-entity-lineage-cache!)
  ;; This assumes we fetch *entity* UIDs to calculate lineage for.
  ;; Adjust if lineage calculation starts differently (e.g., from facts).
  (loop [offset 0]
     (let [entity-uids-batch (stubs/fetch-all-entity-uids-batched BATCH_SIZE offset)]
       (if (empty? entity-uids-batch)
         (do
           (log/info "Finished building entity lineage cache.")
           true) ; Signal completion
         (do
           (log/debugf "Processing entity lineage batch (offset %d, size %d)" offset (count entity-uids-batch))
           (process-entities-batch-for-lineage! entity-uids-batch)
           (recur (+ offset BATCH_SIZE)))))))


;; --- Subtypes Cache ---

(defn- process-entities-batch-for-subtypes!
  "Processes a batch of entity UIDs to update the subtypes cache."
  [entity-uids]
   (doseq [entity-uid entity-uids]
     (let [subtypes (stubs/calculate-all-subtypes entity-uid)] ; Needs actual subtype calculation (recursive graph query)
       (stubs/add-to-subtypes-cache! entity-uid subtypes))))

(defn build-subtypes-cache!
  "Builds a cache mapping entity UIDs to the set of all their recursive subtype UIDs."
  []
  (log/info "Building subtypes cache...")
  (stubs/clear-subtypes-cache!)
  ;; This assumes we iterate through entities to find their subtypes.
  (loop [offset 0]
    (let [entity-uids-batch (stubs/fetch-all-entity-uids-batched BATCH_SIZE offset)]
      (if (empty? entity-uids-batch)
        (do
          (log/info "Finished building subtypes cache.")
          true) ; Signal completion
        (do
          (log/debugf "Processing subtypes batch (offset %d, size %d)" offset (count entity-uids-batch))
          (process-entities-batch-for-subtypes! entity-uids-batch)
          (recur (+ offset BATCH_SIZE)))))))
