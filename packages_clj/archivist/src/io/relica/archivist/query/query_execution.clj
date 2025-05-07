(ns io.relica.archivist.query.query-execution
  "Execute Cypher queries against Neo4j and extract results
   
   This namespace provides functions to execute Cypher queries generated from GEL
   and extract the results in a structured format.
   
   The main steps are:
   1. Execute the Cypher query against Neo4j
   2. Extract variable bindings from the results
   3. Format the results in a consistent way
   
   This implementation uses neo4j-clj to interact with the database."
  (:require [neo4j-clj.core :as neo4j]
            [io.relica.archivist.query.gel-parser :as parser]
            [io.relica.archivist.query.gel-to-cypher :as g2c]
            [clojure.core.async :refer [go <! >! chan]]))

;; Define connection and session operations via neo4j-clj

(defn connect
  "Create a connection to Neo4j"
  [uri user password]
  (neo4j/connect uri user password))

(defn with-session
  "Execute a function with a Neo4j session"
  [conn f]
  (with-open [session (neo4j/get-session conn)]
    (f session)))

;; Custom query macro for dynamic queries
(defmacro defquery-dynamic [name]
  `(def ~name
     (fn [session# query#]
       (let [result# (.run session# query# {})]
         result#))))
         ;;(neo4j/Neo4jResult->maps result#)))))


;; Define dynamic query function
(defquery-dynamic execute-query)

;; Core execution functions

(defn execute-gel-query
  "Execute a GEL query against Neo4j
   Returns the raw results"
  [conn gel-query]
  (go
    (let [cypher-query (g2c/parse-and-generate gel-query)]
      (with-session conn
        (fn [session]
          (execute-query session cypher-query))))))

;; Data extraction functions

(defn extract-variables
  "Extract variable bindings from Neo4j results
   Returns a sequence of maps, each representing a set of variable bindings"
  [results]
  (map (fn [result]
         ;; Filter for keys that start with "var_" to get just the variables
         (reduce-kv (fn [m k v]
                      (if (and (string? k) (.startsWith k "var_"))
                        (assoc m (keyword (subs k 4)) v)
                        m))
                    {}
                    result))
       results))

;; Variable resolution for multi-pattern queries

(defn join-results
  "Join results on shared variables
   Returns a sequence of consistent variable bindings"
  [results1 results2]
  (let [shared-vars (clojure.set/intersection 
                      (set (keys (first results1)))
                      (set (keys (first results2))))]
    (if (empty? shared-vars)
      ;; No shared variables - cartesian product
      (for [r1 results1
            r2 results2]
        (merge r1 r2))
      ;; Join on shared variables
      (for [r1 results1
            r2 results2
            :when (every? #(= (get r1 %) (get r2 %)) shared-vars)]
        (merge r1 r2)))))

;; Complete query process

(defn process-gel-query
  "Complete process for executing a GEL query and returning structured results
   Returns a channel that will contain the structured results"
  [conn gel-query]
  (go
    (let [results (<! (execute-gel-query conn gel-query))
          variables (extract-variables results)]
      variables)))

;; Example usage
(comment
  ;; Example with one pattern
  (process-gel-query conn "?1 > 5935.is classified as > 40043.pump")
  ;; => [{1 {:uid 101 :name "Pump A"}}
  ;;     {1 {:uid 102 :name "Pump B"}}]
  
  ;; Example with multiple patterns and variable bindings
  (process-gel-query conn 
    "?1 > 1190.has as part > 2.?
     ?2.? > 5935.is classified as > 40043.bearing"))
  ;; => [{1 {:uid 101 :name "Pump A"} 2 {:uid 201 :name "Bearing X"}}
  ;;     {1 {:uid 101 :name "Pump A"} 2 {:uid 202 :name "Bearing Y"}}]
