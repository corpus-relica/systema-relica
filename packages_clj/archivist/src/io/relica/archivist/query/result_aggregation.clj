(ns io.relica.archivist.query.result-aggregation
  "Aggregate and process query results
   
   This namespace provides functions to aggregate results from multiple GEL queries,
   resolve variables, and format the final results.
   
   The main steps are:
   1. Join results on shared variables
   2. Ensure consistent variable bindings
   3. Format results for presentation
   
   The aggregation uses a Datalog-like approach to join results on shared variables."
  (:require [clojure.set :as set]
            [io.relica.archivist.query.gel-parser :as parser]
            [io.relica.archivist.query.gel-to-cypher :as g2c]
            [io.relica.archivist.query.query-execution :as qexec]))

;; Core aggregation functions

(defn join-variable-bindings
  "Join multiple sets of variable bindings
   Returns a sequence of consistent variable bindings"
  [& binding-sets]
  (reduce (fn [acc bindings]
            (if (empty? acc)
              bindings
              (let [shared-vars (set/intersection 
                                  (set (mapcat keys acc))
                                  (set (mapcat keys bindings)))]
                (if (empty? shared-vars)
                  ;; No shared variables - cartesian product
                  (for [a acc, b bindings]
                    (merge a b))
                  ;; Join on shared variables
                  (for [a acc, b bindings
                        :when (every? #(= (get a %) (get b %)) 
                                     (set/intersection (set (keys a)) (set (keys b))))]
                    (merge a b))))))
          []
          binding-sets))

(defn filter-consistent-bindings
  "Filter for consistent variable bindings
   Returns only results with consistent bindings"
  [bindings]
  (filter (fn [binding]
            ;; Check if all variable bindings are consistent
            ;; (e.g., if var 1 appears multiple times, it should have the same value)
            (let [vars (keys binding)
                  grouped (group-by identity vars)]
              (every? #(apply = (map (partial get binding) %)) 
                     (vals grouped))))
          bindings))

;; Result formatting functions

(defn format-entity-data
  "Format entity data for presentation"
  [entity]
  (cond
    (nil? entity) nil
    (map? entity) (str (:uid entity) (when (:name entity) (str " (" (:name entity) ")")))
    :else (str entity)))

(defn format-variable-binding
  "Format a single variable binding for presentation"
  [binding]
  (into {} (map (fn [[k v]] [k (format-entity-data v)]) binding)))

(defn format-results
  "Format query results for presentation
   Returns a sequence of formatted binding maps"
  [results]
  (map format-variable-binding results))

;; Complete result pipeline

(defn process-multi-pattern-query
  "Process a multi-pattern GEL query
   Returns aggregated and formatted results"
  [conn gel-query]
  (let [parsed (parser/parse-and-expand gel-query)
        statements (filter #(= :statement (:type %)) parsed)
        ;; Execute each statement separately
        results (map #(qexec/process-gel-query conn (parser/statement->fact %)) statements)
        ;; Join results on shared variables
        joined (apply join-variable-bindings results)
        ;; Filter for consistent bindings
        consistent (filter-consistent-bindings joined)
        ;; Format the results for presentation
        formatted (format-results consistent)]
    formatted))

;; Higher-level aggregation

(defn create-result-table
  "Create a table-like structure from query results
   Returns a map with :columns and :rows"
  [results]
  (if (empty? results)
    {:columns [] :rows []}
    (let [all-vars (sort (set/union (set (mapcat keys results))))
          columns (map #(str "?" %) all-vars)
          rows (map (fn [result]
                      (map #(get result % "") all-vars))
                    results)]
      {:columns columns
       :rows rows})))

;; Examples
(comment
  ;; Simple example with one pattern
  (process-multi-pattern-query conn 
    "?1 > 5935.is classified as > 40043.pump")
  ;; => [{1 "101 (Pump A)"}
  ;;     {1 "102 (Pump B)"}]
  
  ;; Example with multiple patterns
  (process-multi-pattern-query conn 
    "?1 > 1190.has as part > 2.?
     ?2.? > 5935.is classified as > 40043.bearing")
  ;; => [{1 "101 (Pump A)" 2 "201 (Bearing X)"}
  ;;     {1 "101 (Pump A)" 2 "202 (Bearing Y)"}]
  
  ;; Creating a result table
  (create-result-table 
    [{1 "101 (Pump A)" 2 "201 (Bearing X)"}
     {1 "101 (Pump A)" 2 "202 (Bearing Y)"}])
  ;; => {:columns ["?1" "?2"]
  ;;     :rows [["101 (Pump A)" "201 (Bearing X)"]
  ;;            ["101 (Pump A)" "202 (Bearing Y)"]]}
  )