(ns io.relica.clarity.utils
  (:require [clojure.tools.logging :as log]))

(defn remove-empty-arrays
  "Recursively remove empty arrays from a map or collection.
   - For maps: removes keys with empty array values
   - For vectors: filters out empty arrays
   - Processes nested structures recursively"
  [data]
  (cond
    ;; Handle maps - recursively process values and remove keys with empty array values
    (map? data)
    (let [processed-map (reduce-kv
                          (fn [m k v]
                            (let [processed-value (remove-empty-arrays v)]
                              (if (and (vector? processed-value) (empty? processed-value))
                                ;; Skip empty arrays
                                m
                                ;; Keep non-empty values
                                (assoc m k processed-value))))
                          {}
                          data)]
      processed-map)
    
    ;; Handle vectors - recursively process each item and filter out empty arrays
    (vector? data)
    (let [processed-items (map remove-empty-arrays data)
          filtered-items (filter #(not (and (vector? %) (empty? %))) processed-items)]
      (vec filtered-items))
    
    ;; Handle sequences - convert to vector and process
    (seq? data)
    (remove-empty-arrays (vec data))
    
    ;; Return other data types unchanged
    :else
    data))

(defn clean-model
  "Clean a model by removing empty arrays and performing other optimizations.
   Returns the cleaned model."
  [model]
  (try
    (-> model
        remove-empty-arrays)
    (catch Exception e
      (log/warn "Error cleaning model:" (ex-message e))
      ;; Return original model if cleaning fails
      model)))
