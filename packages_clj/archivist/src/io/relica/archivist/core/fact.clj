(ns io.relica.archivist.core.fact
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.core.gellish-base :as gellish]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.common.services.cache-service :as cache]
            [io.relica.archivist.services.uid-service :as uid]
            [io.relica.archivist.utils.traversal :as traversal]
            [io.relica.archivist.db.queries :as queries]))

;; Using the traversal/await-all function instead

(defn serialize-record [record]
  (reduce-kv (fn [m k v]
               (assoc m k
                     (cond
                       (instance? java.time.LocalDate v) (.toString v)
                       :else v)))
             {}
             record))

(defn get-batch [{:keys [skip range rel-type-uids]}]
  (println "------------------- GET BATCH -------------------")
  (try
    (let [resolved-conf {:skip skip
                         :range range
                         :relationTypeUIDs rel-type-uids}
          _ (println "RESOLVED CONF " resolved-conf)
          func (if (nil? rel-type-uids)
                   queries/get-facts-batch
                   queries/get-facts-batch-on-relation-type)
          _ (println "FUNC " func)
          raw-result (graph/exec-query
                         graph/graph-service
                         func
                         resolved-conf)
          _ (println "RAW RESULT " raw-result)
          result (map (fn [record]
                        (serialize-record (:r record)))
                      raw-result)]
      {:facts result})
    (catch Exception e
      (println {:event :get-kinds-list-error
                :error e})
      nil)))

(defn get-count [this]
  (let [result (graph/exec-query graph/graph-service queries/get-facts-count {})
        transformed-result (-> result
                             first
                             :count)]
    (println transformed-result)
    transformed-result))

(defn get-subtypes [uid]
  (let [result (graph/exec-query graph/graph-service queries/subtypes {:uid uid})
        transformed-result (graph/transform-results result)]
    (tap> "TF???????????????????????????????????????")
    (tap> transformed-result)
    transformed-result))

(defn get-subtypes-cone [uid]
  (tap> "------------------- GET SUBTYPES CONE DAMNIT! -------------------")
  (tap> uid)
  (traversal/get-specialization-cone #(get-subtypes %)
                                     uid))

(defn get-classified [uid recursive]
  (go
    (try
      (let [direct-results (graph/exec-query graph/graph-service
                                             queries/classified
                                             {:uid uid})
            direct-classified (if (empty? direct-results)
                                []
                                (graph/transform-results direct-results))]
        (if-not recursive
          direct-classified
          (let [subtypes (cache/all-descendants-of cache/cache-service uid)
                subtypes-facts (map #(get-classified % false) subtypes)
                all-facts (concat direct-classified (flatten subtypes-facts))]
            all-facts)))
      (catch Exception e
        (log/error "Error in get-classified:" e)
        (throw e)))))

(defn get-facts-about-individual [uid]
  (let [query queries/facts-about-individual
        result (graph/exec-query graph/graph-service query {:uid uid})]
    (->> result
         (map #(get-in % [:r :properties]))
         (map #(into {} %)))))

(defn get-related-facts [uid rel-type-uid]
  (go
    (try
      (let [results (graph/exec-query graph/graph-service
                                      queries/related-facts
                                      {:start_uid uid
                                       :rel_type_uid rel-type-uid})
            res (graph/transform-results results)]
        res)
      (catch Exception e
        (log/error "Error in get-related-facts:" (ex-message e))
        []))))

(defn get-all-related-facts [uid]
  (go
    (try
      (let [;; Get all specialization subtypes to exclude
            subtypes-1146 (cache/all-descendants-of cache/cache-service 1146) ;;(set (<! (cache/all-descendants-of cache/cache-service 1146)))
            ;; Get all fact types
            subtypes-2850 (cache/all-descendants-of cache/cache-service 2850) ;;(set (<! (cache/all-descendants-of cache/cache-service 2850)))
            ;; Filter out specialization facts and their subtypes
            rel-type-uids (set (filter #(and (not (contains? subtypes-1146 %))
                                             (not= 1146 %))
                                       subtypes-2850))
            ;; Get all facts involving the entity
            results-2850 (graph/exec-query graph/graph-service
                                           queries/all-related-facts-c
                                           {:start_uid uid
                                            :rel_type_uids rel-type-uids})
            res-2850 (graph/transform-results results-2850)
            results-2850b (graph/exec-query
                           graph/graph-service
                           queries/all-related-facts-d
                           {:start_uid uid
                            :rel_type_uids rel-type-uids})
            res-2850b (graph/transform-results results-2850b)]
        (concat res-2850 res-2850b))
      (catch Exception e
        (log/error "Error in get-all-related-facts:" (ex-message e))
        []))))

  ;; (go
  ;;   (try
  ;;     (let [max-depth 3
  ;;           actual-depth (min depth max-depth)

  ;;           ;; Define recursive function
  ;;           recurse (fn recurse-fn [current-uid curr-depth]
  ;;                     (go
  ;;                       (if (< curr-depth actual-depth)
  ;;                         (let [result (<! (get-all-related-facts current-uid))
  ;;                               next-uids (map :lh_object_uid result)
  ;;                               recursive-results (map #(recurse-fn % (inc curr-depth)) next-uids)
  ;;                               all-results (<! (traversal/await-all recursive-results))]
  ;;                           (concat result (flatten all-results)))
  ;;                         [])))

  ;;           ;; Execute recursive function
  ;;           prelim-result (<! (recurse uid 0))]

  ;;       ;; Deduplicate results
  ;;       (traversal/deduplicate-facts prelim-result))
  ;;     (catch Exception e
  ;;       (log/error "Error in get-all-related-facts-recursive:" (ex-message e))
  ;;       []))))

(defn get-related-on-uid-subtype-cone [lh-object-uid rel-type-uid]
  (go
    (try
      (let [results (<! (traversal/traverse-with-subtypes
                          lh-object-uid
                          rel-type-uid
                          :outgoing))]
        (tap> "------------------- GET RELATED ON UID SUBTYPE CONE -------------------")
        (tap> results)
        (tap> "------------------- GET RELATED ON UID SUBTYPE CONE UNIQUE -------------------")
        (tap> results)
        results)
      (catch Exception e
        (log/error "Error in get-related-on-uid-subtype-cone:" (ex-message e))
        []))))

(defn get-related-to-on-uid-subtype-cone [rh-object-uid rel-type-uid]
  (go
    (try
      (let [results (<! (traversal/traverse-with-subtypes
                          rh-object-uid
                          rel-type-uid
                          :incoming))]
        (tap> "------------------- GET RELATED TO ON UID SUBTYPE CONE -------------------")
        (tap> results)
        (tap> "------------------- GET RELATED TO ON UID SUBTYPE CONE UNIQUE -------------------")
        (tap> results)
        results)
      (catch Exception e
        (log/error "Error in get-related-to-on-uid-subtype-cone:" (ex-message e))
        []))))

(defn get-inherited-relation [uid rel-type-uid]
  (go
    (try
      (let [rel (<! (get-related-facts uid rel-type-uid))]
        (if (seq rel)
          rel
          (let [spec-h (gellish/get-specialization-hierarchy uid)
                spec-facts (reverse (:facts spec-h))]
            (tap> spec-facts)
            ;; Process the specialization hierarchy sequentially, returning first non-empty result
            (loop [items spec-facts]
              (if (empty? items)
                nil  ;; No matching results found in hierarchy
                (let [item (first items)
                      related-facts-chan (get-related-facts (:lh_object_uid item) rel-type-uid)
                      facts (<! related-facts-chan)]
                  (if (seq facts)
                    facts  ;; Return first non-empty result
                    (recur (rest items)))))))))
      (catch Exception e
        (log/error "Error in get-inherited-relation:" (ex-message e))
        []))))

(defn get-core-sample [uid rel-type-uid]
  (go
    (try
      (let [spec-h (gellish/get-specialization-hierarchy uid)
            spec-facts (reverse (:facts spec-h))  ;; Reverse to get subject-centric order

            ;; Function to get related facts based on match-on parameter
            get-facts-fn (fn [hierarchy-uid]
                           (get-related-facts hierarchy-uid rel-type-uid))

            ;; Process each level in the hierarchy and collect results
            results (<! (go
                          (loop [items spec-facts
                                 result-vec []]
                            (if (empty? items)
                              result-vec  ;; Return collected results
                              (let [item (first items)
                                    hierarchy-uid (:lh_object_uid item)
                                    facts-chan (get-facts-fn hierarchy-uid)
                                    facts (<! facts-chan)]
                                ;; Continue with next item, adding facts to result vector
                                (recur (rest items) (conj result-vec facts)))))))]

        results)
      (catch Exception e
        (log/error e "Error in get-core-sample:" (ex-message e))
        []))))

;; (get-core-sample [uid rel-type-uid]
;;   (go
;;     (try
;;       (let [spec-h (gellish/get-specialization-hierarchy gellish-base-service uid)
;;             spec-facts (reverse (:facts spec-h))  ;; Reverse to get subject-centric order

;;             ;; Get all related facts for the entity itself
;;             direct-facts (<! (get-related-facts uid rel-type-uid))

;;             ;; If we have direct facts, return them
;;             result (if (not (empty? direct-facts))
;;                      direct-facts
;;                      ;; Otherwise, check specialization hierarchy
;;                      (loop [items spec-facts
;;                             acc []]
;;                        (if (empty? items)
;;                          acc  ;; Return accumulated results
;;                          (let [item (first items)
;;                                related-facts-chan (get-related-facts (:lh_object_uid item) rel-type-uid)
;;                                facts (<! related-facts-chan)]
;;                            (if (seq facts)
;;                              ;; Found facts, add to accumulator and continue
;;                              (recur (rest items) (concat acc facts))
;;                              ;; No facts found, continue with next item
;;                              (recur (rest items) acc))))))]

;;         ;; Return results
;;         result)
;;       (catch Exception e
;;         (log/error "Error in get-core-sample:" (ex-message e))
;;         []))))

(declare get-related-to)
(defn get-core-sample-rh [uid rel-type-uid]
  (go
    (try
      (let [spec-h (gellish/get-specialization-hierarchy uid)
            spec-facts (reverse (:facts spec-h))  ;; Reverse to get subject-centric order

            ;; Get all related-to facts for the entity itself
            direct-facts (<! (get-related-to uid rel-type-uid))

            ;; If we have direct facts, return them
            result (if (seq direct-facts)
                     direct-facts
                     ;; Otherwise, check specialization hierarchy
                     (loop [items spec-facts
                            acc []]
                       (if (empty? items)
                         acc  ;; Return accumulated results
                         (let [item (first items)
                               related-facts-chan (get-related-to (:lh_object_uid item) rel-type-uid)
                               facts (<! related-facts-chan)]
                           (if (seq facts)
                             ;; Found facts, add to accumulator and continue
                             (recur (rest items) (concat acc facts))
                             ;; No facts found, continue with next item
                             (recur (rest items) acc))))))]

        ;; Return results
        result)
      (catch Exception e
        (log/error "Error in get-core-sample-rh:" (ex-message e))
        []))))

(defn get-facts-relating-entities [uid1 uid2]
  (go
    (try
      (let [results (graph/exec-query graph/graph-service
                                       queries/facts-relating-entities
                                       {:uid1 uid1
                                        :uid2 uid2})
            res (graph/transform-results results)]
        res)
      (catch Exception e
        (log/error "Error in get-facts-relating-entities:" (ex-message e))
        []))))

(defn get-related-to [uid rel-type-uid]
  (go
    (try
      (let [results (graph/exec-query graph/graph-service
                                       queries/related-to
                                       {:end_uid uid
                                        :rel_type_uids [rel-type-uid]})
            res (graph/transform-results results)]
        res)
      (catch Exception e
        (log/error "Error in get-related-to:" (ex-message e))
        []))))

(defn get-related-to-subtype-cone [lh-object-uid rel-type-uid]
  (go
    (try
      (let [rel-subtypes (cache/all-descendants-of cache/cache-service rel-type-uid)
            all-rel-types (conj rel-subtypes rel-type-uid)
            results (graph/exec-query graph/graph-service
                                       queries/related-to
                                       {:end_uid lh-object-uid
                                        :rel_type_uids all-rel-types})
            res (graph/transform-results results)]
        res)
      (catch Exception e
        (log/error "Error in get-related-to-subtype-cone:" (ex-message e))
        []))))

(defn get-recursive-relations [uid rel-type-uid max-depth]
  (go
    (try
      (log/info (str "Getting flattened recursive relations for uid: " uid " with relation type: " rel-type-uid))
      (<! (traversal/traverse-recursive
            uid
            rel-type-uid
            :outgoing
            max-depth))
      (catch Exception e
        (log/error "Error in get-recursive-relations:" (ex-message e))
        []))))

(defn get-recursive-relations-to [uid rel-type-uid max-depth]
  (go
    (try
      (log/info (str "Getting flattened recursive relations-to for uid: " uid " with relation type: " rel-type-uid))
      (<! (traversal/traverse-recursive
            uid
            rel-type-uid
            :incoming
            max-depth))
      (catch Exception e
        (log/error "Error in get-recursive-relations-to:" (ex-message e))
        []))))

(defn confirm-fact [fact]
  (try
    (let [;; Extract fact properties
          lh-object-uid (:lh_object_uid fact)
          rel-type-uid (:rel_type_uid fact)
          rh-object-uid (:rh_object_uid fact)

          ;; Build the query parameters
          params {:lh_object_uid lh-object-uid
                  :rel_type_uid rel-type-uid
                  :rh_object_uid rh-object-uid}

          ;; Check if the fact already exists
          existing-query "MATCH (a)-[r:FACT {rel_type_uid: $rel_type_uid}]->(b)
                         WHERE a.uid = $lh_object_uid AND b.uid = $rh_object_uid
                         RETURN r"
          existing-results (graph/exec-query graph/graph-service existing-query params)]

      ;; If the fact doesn't exist, create it
      (if (empty? existing-results)
        (let [;; Generate a new fact UID
              fact-uid (first (uid/reserve-uid uid/uid-service 1))

              ;; Add the fact UID to the parameters
              params-with-uid (assoc params :fact_uid fact-uid)

              ;; Create the fact
              create-query "MATCH (a), (b)
                           WHERE a.uid = $lh_object_uid AND b.uid = $rh_object_uid
                           CREATE (a)-[r:FACT {fact_uid: $fact_uid, rel_type_uid: $rel_type_uid}]->(b)
                           RETURN r"
              result (graph/exec-write-query graph/graph-service create-query params-with-uid)]

          ;; Return the created fact
          (if (empty? result)
            nil
            (let [fact-map (get-in (first result) [:r :properties])]
              (into {} fact-map))))

        ;; If the fact already exists, return it
        (let [fact-map (get-in (first existing-results) [:r :properties])]
          (into {} fact-map))))
    (catch Exception e
      (log/error "Error in confirm-fact:" (ex-message e))
      nil)))

(defn confirm-fact-in-relation-cone [lh-object-uids rel-type-uids rh-object-uids]
  (go
    (try
      (let [;; Initialize parameters
            params (atom {:lh_object_uids lh-object-uids
                          :rh_object_uids rh-object-uids})

            ;; Start building the query
            query-with-lh (if (not (nil? lh-object-uids))
                            "MATCH (a)-[r:FACT]->(b) WHERE a.uid IN $lh_object_uids"
                            "MATCH (a)-[r:FACT]->(b)")

            query-with-rh (if (not (nil? rh-object-uids))
                            (str query-with-lh " AND b.uid IN $rh_object_uids")
                            query-with-lh)

            ;; Handle relation type UIDs with subtype expansion
            rel-subtypes (atom [])
            _ (when (not (nil? rel-type-uids))
                (doseq [rel-type-uid rel-type-uids]
                  (let [subtypes (cache/all-descendants-of cache/cache-service rel-type-uid)]
                    (swap! rel-subtypes concat subtypes))))

            query-with-rel (if (not (nil? rel-type-uids))
                             (do
                               (swap! params assoc :rel_subtypes @rel-subtypes)
                               (str query-with-rh " AND r.rel_type_uid IN $rel_subtypes"))
                             query-with-rh)

            ;; Complete the query
            final-query (str query-with-rel " RETURN r")

            ;; Execute the query
            results (graph/exec-query graph/graph-service final-query @params)]

        (if (empty? results)
          []
          (graph/transform-results results)))
      (catch Exception e
        (log/error "Error in confirm-fact-in-relation-cone:" (ex-message e))
        nil))))

(defn delete-fact [uid]
    (let [query queries/delete-fact
          result (graph/exec-write-query graph/graph-service query {:uid uid})]
      result))

(defn delete-entity [uid]
  (let [query queries/delete-entity
        result (graph/exec-write-query graph/graph-service query {:uid uid})]
    result))



(comment)

  
