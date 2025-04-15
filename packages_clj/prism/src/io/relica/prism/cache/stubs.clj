;; Stubs for external dependencies (replace with actual implementations later)
(ns io.relica.prism.cache.stubs)

(defn fetch-all-fact-details-batched [batch-size offset]
  ;; Simulates fetching facts in batches
  ;; Returns a seq of maps like {:lh_object_uid 1, :rh_object_uid 2, :fact_uid 100}
  ;; Return empty seq when done
  (println (str "Stub: Fetching fact batch, offset: " offset ", size: " batch-size))
  (if (< offset 20) ; Simulate having 2 batches of 10
    (mapv (fn [i] {:lh_object_uid (+ i offset)
                   :rh_object_uid (+ i offset 100)
                   :fact_uid (+ i offset 1000)})
          (range batch-size))
    []))

(defn fetch-all-entity-uids-batched [batch-size offset]
  ;; Simulates fetching entity uids in batches
  (println (str "Stub: Fetching entity uid batch, offset: " offset ", size: " batch-size))
  (if (< offset 50) ; Simulate 5 batches
     (range offset (+ offset batch-size))
     []))


(defn calculate-lineage [entity-uid]
  ;; Simulates calculating the lineage for an entity
  (println (str "Stub: Calculating lineage for entity " entity-uid))
  (reverse (take-while pos? (iterate #(quot % 3) entity-uid)))) ; Dummy lineage calc

(defn calculate-all-subtypes [entity-uid]
  ;; Simulates calculating all subtypes recursively for an entity
  (println (str "Stub: Calculating subtypes for entity " entity-uid))
  (cond
    (= entity-uid 1) #{2 3 4 5}
    (= entity-uid 2) #{4 5}
    (= entity-uid 3) #{}
    (= entity-uid 4) #{}
    (= entity-uid 5) #{}
    :else #{})) ; Dummy subtypes

(defn clear-entity-facts-cache! []
  (println "Stub: Clearing entity facts cache"))

(defn add-to-entity-facts-cache! [entity-uid fact-uid]
  (println (str "Stub: Adding fact " fact-uid " to entity " entity-uid " facts cache")))

(defn clear-entity-lineage-cache! []
  (println "Stub: Clearing entity lineage cache"))

(defn add-to-entity-lineage-cache! [entity-uid lineage]
  (println (str "Stub: Adding lineage " lineage " to entity " entity-uid " lineage cache")))

(defn clear-subtypes-cache! []
  (println "Stub: Clearing subtypes cache"))

(defn add-to-subtypes-cache! [entity-uid subtypes]
  (println (str "Stub: Adding subtypes " subtypes " to entity " entity-uid " subtypes cache")))
