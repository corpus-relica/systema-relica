(ns io.relica.clarity.utils
  (:require [clojure.tools.logging :as log]))

;; List of top-level model fields that should be preserved even when empty
(def preserved-model-fields
  #{:possible-kinds-of-roles
    :definitive-kinds-of-qualitative-aspects
    :definitive-kinds-of-quantitative-aspects
    :definitive-kinds-of-intrinsic-aspects})

(defn remove-empty-arrays
  "Recursively remove empty arrays from a map or collection.
   - For maps: removes keys with empty array values, except for preserved top-level model fields
   - For vectors: filters out empty arrays
   - Processes nested structures recursively"
  ([data]
   (remove-empty-arrays data false))
  
  ([data is-top-level?]
   (cond
     ;; Handle maps - recursively process values and remove keys with empty array values
     (map? data)
     (let [processed-map (reduce-kv
                           (fn [m k v]
                             (let [processed-value (remove-empty-arrays v false)
                                   is-preserved-field (and is-top-level? (contains? preserved-model-fields k))]
                               (if (and (vector? processed-value) 
                                        (empty? processed-value)
                                        (not is-preserved-field))
                                 ;; Skip empty arrays unless they're preserved fields
                                 m
                                 ;; Keep non-empty values and preserved fields
                                 (assoc m k processed-value))))
                           {}
                           data)]
       processed-map)
     
     ;; Handle vectors - recursively process each item and filter out empty arrays
     (vector? data)
     (let [processed-items (map #(remove-empty-arrays % false) data)
           filtered-items (filter #(not (and (vector? %) (empty? %))) processed-items)]
       (vec filtered-items))
     
     ;; Handle sequences - convert to vector and process
     (seq? data)
     (remove-empty-arrays (vec data) is-top-level?)
     
     ;; Return other data types unchanged
     :else
     data)))

(defn clean-model
  "Clean a model by removing empty arrays and performing other optimizations,
   while preserving top-level model fields. Returns the cleaned model."
  [model]
  (try
    (-> model
        (remove-empty-arrays true))
    (catch Exception e
      (log/warn "Error cleaning model:" (ex-message e))
      ;; Return original model if cleaning fails
      model)))
