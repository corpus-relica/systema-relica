(ns io.relica.archivist.query.gel-to-cypher
  "Converts parsed GEL data structures to Cypher queries for Neo4j
   
   This namespace provides functions to generate Cypher queries from the parsed 
   GEL data structures. The generated queries can be executed against a Neo4j database.
   
   The main steps are:
   1. Convert each fact to a Cypher pattern
   2. Handle variable naming and parameterization
   3. Support descendant lookups
   4. Generate the complete query string
   
   Example:
   Input: {:lh {:var 1}
           :rel {:uid 5935 :name \"is classified as\"}
           :rh {:uid 40043 :name \"pump\"}}
   
   Output: \"MATCH (var_1:Entity)-->(f0:Fact)-->(var_2:Entity)
            WHERE f0.rel_type_uid = 5935 AND var_2.uid = 40043\""
  (:require [clojure.string :as str]
            [io.relica.archivist.query.gel-parser :as parser]))

;; Helper functions for generating Cypher patterns

(defn- var-name 
  "Generate Neo4j variable name for an entity"
  [entity]
  (cond
    ;; Handle placeholder (variable) entities
    (= :placeholder (:type entity))
    (str "var_" (:uid entity))
    
    ;; Handle regular entities (concrete)
    (= :regular (:type entity))
    (str "e" (:uid entity))
    
    ;; Handle wildcard (what placeholder)
    (= :what-placeholder (:type entity))
    "any_entity"
    
    ;; Default case
    :else
    "unknown_entity"))

(defn- fact-var-name
  "Generate name for a fact variable"
  [idx]
  (str "f" idx))

;; Core functions for generating Cypher from facts

(defn fact-to-cypher-match
  "Convert a single fact to a Cypher MATCH pattern
   Returns a map with :match (string) and :where (vector of conditions)"
  [fact idx]
  (let [lh-var (var-name (:left fact))
        rel-var (fact-var-name idx)
        rh-var (var-name (:right fact))
        match-pattern (str "(" lh-var ":Entity)--(" rel-var ":Fact)--(" rh-var ":Entity)")
        where-clauses (filterv some?
                              [(when-let [uid (get-in fact [:relation :uid])]
                                 (str rel-var ".rel_type_uid = " uid))
                               (when (and (= :regular (get-in fact [:right :type]))
                                         (get-in fact [:right :uid]))
                                 (str rh-var ".uid = " (get-in fact [:right :uid])))
                               (when (and (= :regular (get-in fact [:left :type]))
                                         (get-in fact [:left :uid]))
                                 (str lh-var ".uid = " (get-in fact [:left :uid])))])]
    {:match match-pattern
     :where where-clauses}))

(defn facts-to-cypher
  "Convert multiple facts to a Cypher query
   Returns a complete Cypher query string"
  [facts]
  (let [patterns (map-indexed (fn [idx fact] (fact-to-cypher-match fact idx)) facts)
        _ (println "PATTERNS:" patterns)
        match-clauses (map #(str "MATCH " (:match %)) patterns)
        _ (println "MATCH CLAUSES:" match-clauses)
        where-clauses (mapcat :where patterns)
        _ (println "WHERE CLAUSES:" where-clauses)

        where-string (when (seq where-clauses)
                       (str "WHERE " (str/join " AND " where-clauses)))
        _ (println "WHERE STING:" where-string)
        return-vars (distinct (mapcat (fn [fact]
                                       (filter #(str/starts-with? % "var_") 
                                               [(var-name (:left fact))
                                                (var-name (:right fact))]))
                                     facts))
        _ (println "RETURN VARS:" return-vars)
        return-string (str "RETURN " (str/join ", " (or (seq return-vars) ["*"])))
        _ (println "RETURN STRING:" return-string)
        query-parts (filterv some? [(str/join "\n" match-clauses)
                                    where-string
                                    return-string])]
    (str/join "\n" query-parts)))

;; Entry point functions

(defn parse-and-generate
  "Parse GEL query string and generate Cypher query
   Returns a Cypher query string"
  [gel-query]
  (let [parsed (parser/parse-and-expand gel-query)
        facts (filter #(= :statement (:type %)) parsed)]
    (facts-to-cypher facts)))

;; Example of descendant lookup
(defn with-descendant-lookup
  "Enhance a Cypher query to support searching by subtypes"
  [cypher-query rel-type-uid]
  (str "WITH collect(" rel-type-uid ") + apoc.coll.flatten(
         collect([(r)<-[:IS_A*]-(sub) WHERE r." rel-type-uid " IS NOT NULL | sub." rel-type-uid "])
       ) AS all_types\n" 
       (str/replace cypher-query 
                    (str "rel_type_uid = " rel-type-uid) 
                    "rel_type_uid IN all_types")))

;; Complete example of GEL -> Cypher conversion
(comment
  (parse-and-generate "?1 > 5935.is classified as > 40043.pump")
  ;; =>
  ;; "MATCH (var_1:Entity)--(f0:Fact)--(e40043:Entity)
  ;;  WHERE f0.rel_type_uid = 5935 AND e40043.uid = 40043
  ;;  RETURN var_1"
  
  (parse-and-generate "?1.? > 1190.has as part > 201.Impeller")
  ;; =>
  ;; "MATCH (var_1:Entity)--(f0:Fact)--(e201:Entity)
  ;;  WHERE f0.rel_type_uid = 1190 AND e201.uid = 201
  ;;  RETURN var_1"
  
  (parse-and-generate "?1 > 1190.has as part > 2.?
                       ?2.? > 5935.is classified as > 40043.bearing"))
  ;; =>
  ;; "MATCH (var_1:Entity)--(f0:Fact)--(var_2:Entity)
  ;;  MATCH (var_2:Entity)--(f1:Fact)--(e40043:Entity)
  ;;  WHERE f0.rel_type_uid = 1190 AND f1.rel_type_uid = 5935 AND e40043.uid = 40043
  ;;  RETURN var_1, var_2"
