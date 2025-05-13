(ns io.relica.archivist.basis.core
  (:require [clojure.core.async :refer [<! go]]
            [clojure.tools.logging :as log]
            [io.relica.common.services.cache-service :as cache :refer [cache-service-comp]]
            [io.relica.archivist.services.graph-service :as graph :refer [graph-service]]
            [io.relica.archivist.db.neo-queries :as queries]
            [clojure.pprint :as pp]
            [neo4j-clj.core :as neo4j]))

;; Core queries
(neo4j/defquery related-facts
  "MATCH (start:Entity)--(r)-->(end:Entity)
  WHERE start.uid = $start_uid
  RETURN r")

(neo4j/defquery related-facts-in
  "MATCH (start:Entity)--(r)-->(end:Entity)
  WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
  RETURN r")

(neo4j/defquery related-facts-reverse
  "MATCH (start:Entity)<--(r)--(end:Entity)
  WHERE start.uid = $start_uid
  RETURN r")

(neo4j/defquery related-facts-reverse-in
  "MATCH (start:Entity)<--(r)--(end:Entity)
  WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
  RETURN r")

;; (neo4j/defquery path-facts
;;   "MATCH path = (start:Entity)-[]-(f1:Fact)-[]-(end:Entity)
;;    WHERE start.uid = $start_uid
;;    AND end.uid = $end_uid
;;    AND f1.rel_type_uid IN $rel_type_uids
;;    RETURN path
;;    UNION
;;    MATCH path = (start:Entity)-[]-(f2:Fact)-[]-(:Entity)
;;    ((:Entity)-[]-(:Fact)-[]-(:Entity)){0,100}
;;    (:Entity)-[]-(:Fact)-[]-(end:Entity)
;;    WHERE start.uid = $start_uid
;;    AND end.uid = $end_uid
;;    AND f2.rel_type_uid IN $rel_type_uids
;;    AND ALL(r IN [f IN relationships(path) WHERE type(f) = 'Fact']
;;           WHERE r.rel_type_uid IN $rel_type_uids)
;;    RETURN path")


;; Helper functions
(defn expand-types
  "Expand a type or collection of types to include subtypes"
  [edge-types]
  (go
    (try
      (reduce #(let [res (cache/all-descendants-of @cache-service-comp %2)]
                 (into %1 res))
              #{}
              (if (sequential? edge-types) edge-types [edge-types]))
      (catch Exception e
        #{edge-types}))))

(defn dedupe-facts
  "Deduplicate facts by fact_uid"
  [facts]
  (vals (reduce (fn [acc fact]
                  (assoc acc (:fact_uid fact) fact))
                {}
                facts)))

;; Primary traversal primitives
(defn get-relations
  "Get direct relations matching params.
   Returns sequence of facts.

   Parameters:
   - uid: Entity to traverse from
   - params: Map containing:
     - direction(optional): :outgoing, :incoming, or :both (default :both)
     - edge-type(optional): Single UID or collection of UIDs (default nil i.e. any type)
     - include-subtypes?(optional): Whether to include subtypes (default true)"
  [uid & [config]]
  (go
    (try
      (let [{:keys [direction edge-type include-subtypes?]
             :or {direction :both
                  include-subtypes? true}} config
            rel-types (when edge-type
                        (<! (if include-subtypes?
                              (expand-types edge-type)
                              #{edge-type})))
            results (case direction
                      :outgoing (graph/exec-query @graph-service
                                                  (if rel-types related-facts-in related-facts)
                                                  {:start_uid uid
                                                   :rel_type_uids (or rel-types [])})
                      :incoming (graph/exec-query @graph-service
                                                  (if rel-types related-facts-reverse-in related-facts)
                                                  {:start_uid uid
                                                   :rel_type_uids (or rel-types [])})
                      :both (concat
                             (graph/exec-query @graph-service
                                               (if rel-types related-facts-in related-facts)
                                               {:start_uid uid
                                                :rel_type_uids (or rel-types [])})
                             (graph/exec-query @graph-service
                                               (if rel-types related-facts-reverse-in related-facts-reverse)
                                               {:start_uid uid
                                                :rel_type_uids (or rel-types [])})))
            transformed (graph/transform-results results)]
        transformed)
      (catch Exception e
        (log/error "Error in get-relations:" (ex-message e))
        []))))

(defn get-relations-r
  "Recursive relation traversal with cycle detection.
   Returns sequence of facts.

   Parameters:
   - uid: Starting entity
   - params: Map containing:
     - direction: :outgoing, :incoming, or :both (default :both)
     - edge-type: Single UID or collection of UIDs
     - include-subtypes?: Whether to include subtypes (default true)
     - max-depth: Maximum traversal depth (default 10)"
  [uid {:keys [direction edge-type include-subtypes? max-depth]
        :or {direction :both
             include-subtypes? true
             max-depth 1}}] ;; default to something sensible
  (go
    (try
      (let [visited (atom #{})
            all-facts (atom [])

            ;; Helper function to get related entities
            get-related (fn [current-uid]
                          (get-relations current-uid
                                         {:direction direction
                                          :edge-type edge-type
                                          :include-subtypes? include-subtypes?}))

            ;; Recursive traversal function
            traverse (fn traverse-fn [current-uid current-depth]
                       (go
                         (if (or (>= current-depth max-depth)
                                 (contains? @visited current-uid))
                           nil
                           (let [_ (swap! visited conj current-uid)
                                 relations (<! (get-related current-uid))
                                 _ (swap! all-facts concat relations)
                                 next-uids (map (fn [fact]
                                                  (case direction
                                                    :outgoing (:rh_object_uid fact)
                                                    :incoming (:lh_object_uid fact)
                                                    :both (if (= current-uid (:lh_object_uid fact))
                                                            (:rh_object_uid fact)
                                                            (:lh_object_uid fact))))
                                                relations)]
                             ;; Continue recursion
                             (doseq [uid next-uids]
                               (<! (traverse-fn uid (inc current-depth))))
                             nil))))]

        ;; Start traversal
        (<! (traverse uid 0))

        ;; Return deduplicated results
        (dedupe-facts @all-facts))
      (catch Exception e
        (log/error "Error in get-relations-r:" (ex-message e))
        []))))

(defn get-relations-filtered
  "Get direct relations matching params and filter function.
   Returns sequence of filtered facts.

   Parameters:
   - uid: Entity to traverse from
   - params: Map containing standard get-relations params plus:
     - filter-fn: Function that takes a fact and returns boolean"
  [uid {:keys [direction edge-type include-subtypes? filter-fn]
        :or {direction :both
             include-subtypes? true}}]
  (go
    (try
      (let [relations (<! (get-relations uid {:direction direction
                                              :edge-type edge-type
                                              :include-subtypes? include-subtypes?}))
            filtered (filter filter-fn relations)]
        filtered)
      (catch Exception e
        (log/error "Error in get-relations-filtered:" (ex-message e))
        []))))

(defn get-relations-filtered-r
  "Recursive filtered relation traversal with cycle detection.
   Returns sequence of filtered facts.

   Parameters:
   - uid: Starting entity
   - params: Map containing standard get-relations-r params plus:
     - filter-fns: Single function or vector of functions to apply cyclically
                  Each fn takes a fact and returns boolean"
  [uid {:keys [direction edge-type include-subtypes? max-depth filter-fns]
        :or {direction :both
             include-subtypes? true
             max-depth 10}}]
  (go
    (try
      (let [visited (atom #{})
            all-facts (atom [])
            fns-seq (if (sequential? filter-fns)
                      (cycle filter-fns)
                      (repeat filter-fns))
            filter-count (atom 0)

            ;; Helper function to get and filter related entities
            get-related (fn [current-uid]
                          (go
                            (let [relations (<! (get-relations current-uid
                                                               {:direction direction
                                                                :edge-type edge-type
                                                                :include-subtypes? include-subtypes?}))
                                  filtered (keep (fn [fact]
                                                   (when ((nth fns-seq @filter-count) fact)
                                                     (swap! filter-count inc)
                                                     fact))
                                                 relations)]
                              filtered)))

            ;; Recursive traversal function
            traverse (fn traverse-fn [current-uid current-depth]
                       (go
                         (if (or (>= current-depth max-depth)
                                 (contains? @visited current-uid))
                           nil
                           (let [_ (swap! visited conj current-uid)
                                 relations (<! (get-related current-uid))
                                 _ (swap! all-facts concat relations)
                                 next-uids (map (fn [fact]
                                                  (case direction
                                                    :outgoing (:rh_object_uid fact)
                                                    :incoming (:lh_object_uid fact)
                                                    :both (if (= current-uid (:lh_object_uid fact))
                                                            (:rh_object_uid fact)
                                                            (:lh_object_uid fact))))
                                                relations)]
                             ;; Continue recursion
                             (doseq [uid next-uids]
                               (<! (traverse-fn uid (inc current-depth))))
                             nil))))]

        ;; Start traversal
        (<! (traverse uid 0))

        ;; Return deduplicated results
        (dedupe-facts @all-facts))
      (catch Exception e
        (log/error "Error in get-relations-filtered-r:" (ex-message e))
        []))))

(comment

  (graph/start)

  (cache/start "xxx")

  (go
    (let [foo (<! (expand-types 730044))]
      (pp/pprint foo)))

  (go
    (let [foo (<! (get-relations 730034))]
      (println (count foo))))

  (go
    (let [foo (<! (get-relations 730044 {:direction :outgoing
                                         :edge-type 1146}))]
      (println (count foo))))

  (go
    (let [foo (<! (get-relations-filtered 730034
                                          {:edge-type 1146
                                           :filter-fn #(= (:latest_update %) "2001-03-10")}))]
      (pp/pprint foo)))

  (go
    (let [foo (<! (get-relations-r 730044 {:max-depth 2
                                           :edge-type 1146}))]
      (println (count foo))))

  ;; Recursive filtered traversal
  ;; Multiple filter functions applied cyclically
  (get-relations-filtered-r 730044
                            {:edge-type 1146
                             :max-depth 2
                             :filter-fns [#(= (:latest_update %) "2001-03-10")]})

  (go
    (let [foo (<! (get-relations-filtered-r 730044
                            {:edge-type 1146
                             :max-depth 2
                             :filter-fns [#(= (:lh_object_uid %) 1483)]}))]
      (pp/pprint foo)))

  (println))

;; (defn get-relation-paths
;;   "Get paths of relations between two entities.
;;    Returns sequence of paths, where each path is a sequence of facts.

;;    Parameters:
;;    - start-uid: Starting entity
;;    - end-uid: Target entity
;;    - params: Map containing:
;;      - edge-type: Single UID or collection of UIDs
;;      - include-subtypes?: Whether to include subtypes (default true)
;;      - max-hops: Maximum number of intermediate hops (default 100)"
;;   [start-uid end-uid {:keys [edge-type include-subtypes? max-hops]
;;                       :or {include-subtypes? true
;;                            max-hops 100}}]
;;   (go
;;     (try
;;       (let [rel-types (<! (if include-subtypes?
;;                             (expand-types edge-type)
;;                             #{edge-type}))
;;             results (graph/exec-query @graph-service
;;                                     path-facts
;;                                     {:start_uid start-uid
;;                                      :end_uid end-uid
;;                                      :rel_type_uids (vec rel-types)  ; Neo4j needs a vector
;;                                      :max_hops max-hops})
;;             _ (println "rewewrewrew" results)
;;             transformed (graph/transform-results results)]
;;         ;; Return paths as sequences of facts
;;         (partition-by :path_id transformed)) (catch Exception e (log/error "Error in get-relation-paths:" (ex-message e))
;;         []))))

;; (comment

;;   (go
;;     (let [res (<! (get-relation-paths 1146 730034 {:edge-type 1146}))]
;;       (println "-----------------------------------------------")
;;       (println res)))

;;   (print))

;; Set operations on facts
(defn binary-fact-set-op
  "Apply set operation to two collections of facts.

   Parameters:
   - op: :union, :intersection, or :difference
   - facts1: First collection of facts
   - facts2: Second collection of facts
   - key1: Key to match on for first collection (default :fact_uid)
   - key2: Key to match on for second collection (default :fact_uid)

   Returns: Set after applying operation"
  [op facts1 facts2 & {:keys [key1 key2]
                       :or {key1 :fact_uid}
                       key2 :fact_uid}]
  (let [set1 (set (map key1 facts1))
        set2 (set (map key2 facts2))]
    (apply (case op
             :union clojure.set/union
             :intersection clojure.set/intersection
             :difference clojure.set/difference)
           [set1 set2])))

(defn fact-set-op
  "Apply sequence of set operations to multiple collections of facts.

   Parameters:
   - ops: Single operation keyword or vector of operations
   - fact-colls: Collections of facts to operate on
   - keys: Single key, vector of keys, or vector of [key1 key2] pairs

   Examples:
   (fact-set-op :union [facts1 facts2 facts3] :fact_uid)
   (fact-set-op [:union :intersection] [facts1 facts2 facts3] [:fact_uid :uid])
   (fact-set-op :union [facts1 facts2 facts3] [[:fact_uid :uid] [:uid :fact_uid]])

   Returns: Set after applying operations in sequence"
  [ops fact-colls keys]
  (let [;; Normalize inputs to sequences
        ops-seq (if (sequential? ops) ops (repeat ops))
        keys-seq (cond
                   (sequential? keys) (if (sequential? (first keys))
                                        keys  ; Already pairs
                                        (partition 2 1 (cycle keys)))  ; Make pairs
                   :else (repeat [keys keys]))  ; Single key to pairs

        ;; Apply operations sequentially
        [first-coll & rest-colls] fact-colls]
    (reduce (fn [acc [coll [op [key1 key2]]]]
              (binary-fact-set-op op acc coll :key1 key1 :key2 key2))
            first-coll
            (map vector rest-colls (map vector ops-seq keys-seq)))))

;; ;; Simple case - same as before
;; (fact-set-op :union [facts1 facts2 facts3] :fact_uid)

;; ;; Different operations at each step
;; (fact-set-op [:union :intersection]
;;              [facts1 facts2 facts3]
;;              :fact_uid)

;; ;; Different keys at each step
;; (fact-set-op :union
;;              [facts1 facts2 facts3]
;;              [:fact_uid :uid :name])

;; ;; Key pairs for each operation
;; (fact-set-op :union
;;              [facts1 facts2 facts3]
;;              [[:fact_uid :uid]
;;               [:name :fact_uid]])

;; ;; Operations and key pairs cycle if needed
;; (fact-set-op [:union :intersection]
;;              [facts1 facts2 facts3 facts4]
;;              [[:fact_uid :uid]])

