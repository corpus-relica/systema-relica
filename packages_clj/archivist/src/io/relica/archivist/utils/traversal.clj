(ns io.relica.archivist.utils.traversal
  (:require [clojure.core.async :refer [<! go]]
            [clojure.tools.logging :as log]
            [clojure.set :as set]
            [io.relica.common.services.cache-service :as cache]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.archivist.db.queries :as queries]))

;; -------------------------------------------------
;; Core utility functions for semantic graph traversal
;; -------------------------------------------------

(defn deduplicate-facts
  "Deduplicate facts by fact_uid"
  [facts]
  (vals (reduce (fn [acc item]
                 (assoc acc (:fact_uid item) item))
               {}
               facts)))

(defn expand-relation-subtypes
  "Get a relation type and all its subtypes"
  [rel-type-uid]
  (go
    (try
      (let [subtypes (cache/all-descendants-of cache/cache-service rel-type-uid)]
        (conj subtypes rel-type-uid))
      (catch Exception e
        (log/error "Error expanding relation subtypes:" (ex-message e))
        [rel-type-uid]))))

(defn traverse-with-subtypes
  "Follow a relation and all its subtypes between entities.
   
   Parameters:
   - graph-service: The graph service for executing queries
   - cache-service: The cache service for relation subtypes
   - entity-uid: The starting entity UID
   - rel-type-uid: The relation type UID (will be expanded to include subtypes)
   - direction: :outgoing, :incoming, or :both
   
   Returns: Collection of facts that match the traversal parameters"
  [entity-uid rel-type-uid direction]
  (go
    (try
      (let [all-rel-types (<! (expand-relation-subtypes rel-type-uid))
            query (case direction
                    :outgoing queries/all-related-facts-c
                    :incoming queries/all-related-facts-d
                    ;; For both directions, we need to run both queries and combine results
                    :both nil) 
            
            ;; Handle 'both' direction case specially
            results (if (= direction :both)
                      (let [outgoing-results (graph/exec-query graph/graph-service
                                                             queries/all-related-facts-c 
                                                             {:start_uid entity-uid
                                                              :rel_type_uids all-rel-types})
                            incoming-results (graph/exec-query graph/graph-service
                                                             queries/all-related-facts-d 
                                                             {:start_uid entity-uid
                                                              :rel_type_uids all-rel-types})]
                        (concat outgoing-results incoming-results))
                      ;; Normal case - single direction
                      (graph/exec-query graph/graph-service query
                                      {:start_uid entity-uid
                                       :rel_type_uids all-rel-types}))
            
            transformed (graph/transform-results results)]
        (deduplicate-facts transformed))
      (catch Exception e
        (log/error "Error in traverse-with-subtypes:" (ex-message e))
        []))))

(defn traverse-recursive
  "Traverse relations recursively with cycle detection.
   
   Parameters:
   - graph-service: The graph service for executing queries
   - cache-service: The cache service for relation subtypes
   - start-uid: The starting entity UID
   - rel-type-uid: The relation type UID (will be expanded to include subtypes)
   - direction: :outgoing, :incoming, or :both
   - max-depth: Maximum traversal depth (default 10)
   
   Returns: Collection of all facts found during traversal"
  [start-uid rel-type-uid direction max-depth]
  (go
    (try
      (let [actual-depth (or max-depth 10)
            all-facts (atom [])
            visited (atom #{})
            
            ;; Helper function to get related entities
            get-related (fn [uid]
                         (traverse-with-subtypes uid rel-type-uid direction))
            
            ;; Recursive traversal function
            traverse (fn traverse-fn [current-uid current-depth]
                      (go
                        (if (or (>= current-depth actual-depth)
                                (contains? @visited current-uid))
                          nil
                          (let [updated-visited (swap! visited conj current-uid)
                                relations (<! (get-related current-uid))
                                _ (swap! all-facts concat relations)
                                next-uids (map (fn [fact]
                                               (if (= direction :outgoing)
                                                 (:rh_object_uid fact)
                                                 (:lh_object_uid fact)))
                                             relations)]
                            ;; Continue recursion
                            (doseq [uid next-uids]
                              (<! (traverse-fn uid (inc current-depth))))
                            nil))))]
        
        ;; Start traversal
        (<! (traverse start-uid 0))
        
        ;; Return deduplicated results
        (deduplicate-facts @all-facts))
      (catch Exception e
        (log/error "Error in traverse-recursive:" (ex-message e))
        []))))

(defn await-all
  "Helper function to await a sequence of core.async channels"
  [channels]
  (go
    (let [results (atom [])]
      (doseq [c channels]
        (swap! results conj (<! c)))
      @results)))

;; -------------------------------------------------
;; Higher-level semantic operations
;; -------------------------------------------------

(defn get-specialization-cone
  "Get all facts representing the specialization hierarchy (cone) 
   for a given type entity."
  [subtypes-fn uid]
  (go
    (try
      (let [;; Get all descendants
            subtypes (cache/all-descendants-of cache/cache-service uid)
            
            ;; Get facts about the root entity itself
            root-facts (subtypes-fn uid)
            
            ;; Get facts about all descendants
            descendant-facts (map #(subtypes-fn %) subtypes)
            
            ;; Combine root facts with descendant facts
            all-facts (cons root-facts descendant-facts)]
        (flatten all-facts))
      (catch Exception e
        (log/error "Error in get-specialization-cone:" (ex-message e))
        []))))

(defn create-relation-cone
  "Create a semantic cone along a specific relation type.
   
   Parameters:
   - graph-service: The graph service for executing queries
   - cache-service: The cache service for relation subtypes
   - root-uid: The root entity UID to start the cone from
   - rel-type-uid: The relation type that defines this cone
   - direction: :outgoing or :incoming direction to follow
   - max-depth: Maximum depth to traverse
   
   This creates cones like 'parts-of-parts', 'subtypes-of-subtypes', etc.
   depending on the relation type provided."
  [root-uid rel-type-uid direction max-depth]
  (traverse-recursive root-uid
                      rel-type-uid
                      direction
                      max-depth))

(defn combine-cones
  "Combine multiple semantic cones with set operations.
   
   Parameters:
   - operation: :union, :intersection, or :difference
   - cones: A collection of fact collections to combine
   
   Returns a single collection of facts after applying the operation."
  [operation & cones]
  (let [fact-sets (map #(set (map :fact_uid %)) cones)]
    (case operation
      :union       (apply set/union fact-sets)
      :intersection (apply set/intersection fact-sets)
      :difference   (apply set/difference fact-sets))))

;; Example of how to compose semantic operations for common use cases
(defn get-component-occurrences
  "Get all occurrences involving an entity or any of its components.
   
   This demonstrates composing multiple semantic operations into a
   higher-level domain-specific function.
   
   Parameters:
   - graph-service: The graph service
   - cache-service: The cache service
   - entity-uid: The root entity to examine
   - parts-rel-uid: The relation type UID for parts/components (e.g. 5519)
   - occurrence-rel-uid: The relation type UID for occurrences (e.g. 7105)
   
   Returns: Collection of occurrence facts related to the entity or its components"
  [entity-uid parts-rel-uid occurrence-rel-uid]
  (go
    (try
      ;; 1. Get all parts recursively (parts-of-parts cone)
      (let [parts-cone (<! (create-relation-cone 
                            entity-uid
                            parts-rel-uid 
                            :outgoing 
                            5))
            
            ;; 2. Extract all component UIDs from the parts cone
            component-uids (conj 
                            (map :rh_object_uid parts-cone) 
                            entity-uid)
            
            ;; 3. For each component, get its occurrences
            occurrence-results (atom [])
            _ (doseq [uid component-uids]
                (let [occurrences (<! (traverse-with-subtypes 
                                       uid
                                       occurrence-rel-uid 
                                       :both))]
                  (swap! occurrence-results concat occurrences)))]
        
        ;; 4. Return deduplicated results
        (deduplicate-facts @occurrence-results))
      (catch Exception e
        (log/error "Error in get-component-occurrences:" (ex-message e))
        []))))
