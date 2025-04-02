
(ns io.relica.archivist.services.fact-service
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.services.gellish-base-service :as gellish]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.archivist.services.cache-service :as cache]
            [io.relica.archivist.services.concept-service :as concept]
            [io.relica.archivist.services.uid-service :as uid]
            [io.relica.archivist.utils.traversal :as traversal]
            [io.relica.archivist.db.queries :as queries]))

;; Using the traversal/await-all function instead

(defprotocol FactOperations
  (get-subtypes [this uid])
  (get-subtypes-cone [this uid])
  (get-classified [this uid recursive])
  (get-facts-about-individual [this uid])
  (get-related-facts [this uid rel-type-uid])
  (get-all-related-facts [this uid])
  (get-all-related-facts-recursive [this uid depth])
  (get-related-on-uid-subtype-cone [this lh-object-uid rel-type-uid])
  (get-related-to-on-uid-subtype-cone [this rh-object-uid rel-type-uid])
  (get-inherited-relation [this uid rel-type-uid])
  (get-core-sample [this uid rel-type-uid])
  (get-core-sample-rh [this uid rel-type-uid])
  (get-facts-relating-entities [this uid1 uid2])
  (get-related-to [this uid rel-type-uid])
  (get-related-to-subtype-cone [this lh-object-uid rel-type-uid])
  (get-recursive-relations [this uid rel-type-uid max-depth])
  (get-recursive-relations-to [this uid rel-type-uid max-depth])
  (confirm-fact [this fact])
  (confirm-fact-in-relation-cone [this lh-object-uids rel-type-uids rh-object-uids])
  (delete-fact [this uid])
  (delete-entity [this uid]))

(defrecord FactService [graph-service gellish-base-service cache-service concept-service uid-service]
  FactOperations
  (get-subtypes [_ uid]
    (let [result (graph/exec-query graph-service queries/subtypes {:uid uid})
          transformed-result (graph/transform-results result)]
      (tap> "TF???????????????????????????????????????")
      (tap> transformed-result)
      transformed-result))

  (get-subtypes-cone [this uid]
    (tap> "------------------- GET SUBTYPES CONE DAMNIT! -------------------")
    (tap> uid)
    (traversal/get-specialization-cone (:graph-service this)
                                       (:cache-service this)
                                       #(get-subtypes this %)
                                       uid))

  (get-classified [this uid recursive]
    (go
      (try
        (let [direct-results (graph/exec-query graph-service
                                               queries/classified
                                               {:uid uid})
              direct-classified (if (empty? direct-results)
                                  []
                                  (graph/transform-results direct-results))]
          (if-not recursive
            direct-classified
            (let [subtypes (cache/all-descendants-of cache-service uid)
                  subtypes-facts (map #(get-classified this % false) subtypes)
                  all-facts (concat direct-classified (flatten subtypes-facts))]
              all-facts)))
        (catch Exception e
          (log/error "Error in get-classified:" e)
          (throw e)))))

  (get-facts-about-individual [_ uid]
    (let [query queries/facts-about-individual
          result (graph/exec-query graph-service query {:uid uid})]
      (->> result
           (map #(get-in % [:r :properties]))
           (map #(into {} %)))))

  (get-related-facts [_ uid rel-type-uid]
    (go
      (try
        (let [results (graph/exec-query graph-service
                                        queries/related-facts
                                        {:start_uid uid
                                         :rel_type_uid rel-type-uid})
              res (graph/transform-results results)]
          res)
        (catch Exception e
          (log/error "Error in get-related-facts:" (ex-message e))
          []))))

  (get-all-related-facts [_ uid]
    (go
      (try
        (let [;; Get all specialization subtypes to exclude
              subtypes-1146 (cache/all-descendants-of cache-service 1146) ;;(set (<! (cache/all-descendants-of cache-service 1146)))
              ;; Get all fact types
              subtypes-2850 (cache/all-descendants-of cache-service 2850) ;;(set (<! (cache/all-descendants-of cache-service 2850)))
              ;; Filter out specialization facts and their subtypes
              rel-type-uids (set (filter #(and (not (contains? subtypes-1146 %))
                                               (not= 1146 %))
                                         subtypes-2850))
              ;; Get all facts involving the entity
              results-2850 (graph/exec-query graph-service
                                             queries/all-related-facts-c
                                             {:start_uid uid
                                              :rel_type_uids rel-type-uids})
              res-2850 (graph/transform-results results-2850)
              results-2850b (graph/exec-query
                             graph-service
                             queries/all-related-facts-d
                             {:start_uid uid
                              :rel_type_uids rel-type-uids})
              res-2850b (graph/transform-results results-2850b)]
          (concat res-2850 res-2850b))
        (catch Exception e
          (log/error "Error in get-all-related-facts:" (ex-message e))
          []))))

  (get-all-related-facts-recursive [this uid depth]
    (go
      (try
        (let [max-depth 3
              actual-depth (min depth max-depth)

              ;; Define recursive function
              recurse (fn recurse-fn [current-uid curr-depth]
                        (go
                          (if (< curr-depth actual-depth)
                            (let [result (<! (get-all-related-facts this current-uid))
                                  next-uids (map :lh_object_uid result)
                                  recursive-results (map #(recurse-fn % (inc curr-depth)) next-uids)
                                  all-results (<! (traversal/await-all recursive-results))]
                              (concat result (flatten all-results)))
                            [])))

              ;; Execute recursive function
              prelim-result (<! (recurse uid 0))]

          ;; Deduplicate results
          (traversal/deduplicate-facts prelim-result))
        (catch Exception e
          (log/error "Error in get-all-related-facts-recursive:" (ex-message e))
          []))))

  (get-related-on-uid-subtype-cone [this lh-object-uid rel-type-uid]
    (go
      (try
        (let [results (<! (traversal/traverse-with-subtypes
                            (:graph-service this)
                            (:cache-service this)
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

  (get-related-to-on-uid-subtype-cone [this rh-object-uid rel-type-uid]
    (go
      (try
        (let [results (<! (traversal/traverse-with-subtypes
                            (:graph-service this)
                            (:cache-service this)
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

  (get-inherited-relation [this uid rel-type-uid]
    (go
      (try
        (let [rel (<! (get-related-facts this uid rel-type-uid))]
          (if (not (empty? rel))
            rel
            (let [spec-h (gellish/get-specialization-hierarchy gellish-base-service uid)
                  spec-facts (reverse (:facts spec-h))]
              (tap> spec-facts)
              ;; Process the specialization hierarchy sequentially, returning first non-empty result
              (loop [items spec-facts]
                (if (empty? items)
                  nil  ;; No matching results found in hierarchy
                  (let [item (first items)
                        related-facts-chan (get-related-facts this (:lh_object_uid item) rel-type-uid)
                        facts (<! related-facts-chan)]
                    (if (seq facts)
                      facts  ;; Return first non-empty result
                      (recur (rest items)))))))))
        (catch Exception e
          (log/error "Error in get-inherited-relation:" (ex-message e))
          []))))

  (get-core-sample [this uid rel-type-uid]
    (go
      (try
        (let [spec-h (gellish/get-specialization-hierarchy gellish-base-service uid)
              spec-facts (reverse (:facts spec-h))  ;; Reverse to get subject-centric order

              ;; Function to get related facts based on match-on parameter
              get-facts-fn (fn [hierarchy-uid]
                             (get-related-facts this hierarchy-uid rel-type-uid))

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

  ;; (get-core-sample [this uid rel-type-uid]
  ;;   (go
  ;;     (try
  ;;       (let [spec-h (gellish/get-specialization-hierarchy gellish-base-service uid)
  ;;             spec-facts (reverse (:facts spec-h))  ;; Reverse to get subject-centric order

  ;;             ;; Get all related facts for the entity itself
  ;;             direct-facts (<! (get-related-facts this uid rel-type-uid))

  ;;             ;; If we have direct facts, return them
  ;;             result (if (not (empty? direct-facts))
  ;;                      direct-facts
  ;;                      ;; Otherwise, check specialization hierarchy
  ;;                      (loop [items spec-facts
  ;;                             acc []]
  ;;                        (if (empty? items)
  ;;                          acc  ;; Return accumulated results
  ;;                          (let [item (first items)
  ;;                                related-facts-chan (get-related-facts this (:lh_object_uid item) rel-type-uid)
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

  (get-core-sample-rh [this uid rel-type-uid]
    (go
      (try
        (let [spec-h (gellish/get-specialization-hierarchy gellish-base-service uid)
              spec-facts (reverse (:facts spec-h))  ;; Reverse to get subject-centric order

              ;; Get all related-to facts for the entity itself
              direct-facts (<! (get-related-to this uid rel-type-uid))

              ;; If we have direct facts, return them
              result (if (not (empty? direct-facts))
                       direct-facts
                       ;; Otherwise, check specialization hierarchy
                       (loop [items spec-facts
                              acc []]
                         (if (empty? items)
                           acc  ;; Return accumulated results
                           (let [item (first items)
                                 related-facts-chan (get-related-to this (:lh_object_uid item) rel-type-uid)
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

  (get-facts-relating-entities [_ uid1 uid2]
    (go
      (try
        (let [results (graph/exec-query graph-service
                                         queries/facts-relating-entities
                                         {:uid1 uid1
                                          :uid2 uid2})
              res (graph/transform-results results)]
          res)
        (catch Exception e
          (log/error "Error in get-facts-relating-entities:" (ex-message e))
          []))))

  (get-related-to [_ uid rel-type-uid]
    (go
      (try
        (let [results (graph/exec-query graph-service
                                         queries/related-to
                                         {:end_uid uid
                                          :rel_type_uids [rel-type-uid]})
              res (graph/transform-results results)]
          res)
        (catch Exception e
          (log/error "Error in get-related-to:" (ex-message e))
          []))))

  (get-related-to-subtype-cone [this lh-object-uid rel-type-uid]
    (go
      (try
        (let [rel-subtypes (cache/all-descendants-of cache-service rel-type-uid)
              all-rel-types (conj rel-subtypes rel-type-uid)
              results (graph/exec-query graph-service
                                         queries/related-to
                                         {:end_uid lh-object-uid
                                          :rel_type_uids all-rel-types})
              res (graph/transform-results results)]
          res)
        (catch Exception e
          (log/error "Error in get-related-to-subtype-cone:" (ex-message e))
          []))))

  (get-recursive-relations [this uid rel-type-uid max-depth]
    (go
      (try
        (log/info (str "Getting flattened recursive relations for uid: " uid " with relation type: " rel-type-uid))
        (<! (traversal/traverse-recursive
              (:graph-service this)
              (:cache-service this)
              uid
              rel-type-uid
              :outgoing
              max-depth))
        (catch Exception e
          (log/error "Error in get-recursive-relations:" (ex-message e))
          []))))

  (get-recursive-relations-to [this uid rel-type-uid max-depth]
    (go
      (try
        (log/info (str "Getting flattened recursive relations-to for uid: " uid " with relation type: " rel-type-uid))
        (<! (traversal/traverse-recursive
              (:graph-service this)
              (:cache-service this)
              uid
              rel-type-uid
              :incoming
              max-depth))
        (catch Exception e
          (log/error "Error in get-recursive-relations-to:" (ex-message e))
          []))))

  (confirm-fact [_ fact]
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
            existing-results (graph/exec-query graph-service existing-query params)]

        ;; If the fact doesn't exist, create it
        (if (empty? existing-results)
          (let [;; Generate a new fact UID
                fact-uid (first (uid/reserve-uid uid-service 1))

                ;; Add the fact UID to the parameters
                params-with-uid (assoc params :fact_uid fact-uid)

                ;; Create the fact
                create-query "MATCH (a), (b)
                             WHERE a.uid = $lh_object_uid AND b.uid = $rh_object_uid
                             CREATE (a)-[r:FACT {fact_uid: $fact_uid, rel_type_uid: $rel_type_uid}]->(b)
                             RETURN r"
                result (graph/exec-write-query graph-service create-query params-with-uid)]

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

  (confirm-fact-in-relation-cone [this lh-object-uids rel-type-uids rh-object-uids]
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
                    (let [subtypes (cache/all-descendants-of cache-service rel-type-uid)]
                      (swap! rel-subtypes concat subtypes))))

              query-with-rel (if (not (nil? rel-type-uids))
                               (do
                                 (swap! params assoc :rel_subtypes @rel-subtypes)
                                 (str query-with-rh " AND r.rel_type_uid IN $rel_subtypes"))
                               query-with-rh)

              ;; Complete the query
              final-query (str query-with-rel " RETURN r")

              ;; Execute the query
              results (graph/exec-query graph-service final-query @params)]

          (if (empty? results)
            []
            (graph/transform-results results)))
        (catch Exception e
          (log/error "Error in confirm-fact-in-relation-cone:" (ex-message e))
          nil))))

  (delete-fact [_ uid]
    (let [query queries/delete-fact
          result (graph/exec-write-query graph-service query {:uid uid})]
      result))

  (delete-entity [_ uid]
    (let [query queries/delete-entity
          result (graph/exec-write-query graph-service query {:uid uid})]
      result)))

(defn create-fact-service [{:keys [graph
                                   gellish-base
                                   cache
                                   concept
                                   uid]}]
  (->FactService graph gellish-base cache concept uid))


(defonce fact-service (atom nil))

(defn start [services]
  (println "Starting Fact Service...")
  (let [service (create-fact-service services)]
    (reset! fact-service service)
    service))

(defn stop  []
  (println "Stopping Fact Service..."))


(comment
  ;; Test operations
  (let [test-service (create-fact-service graph-service nil cache-service nil nil)]
    (get-classified test-service 970178))

  @fact-service

  ;; Test the new recursive relations function
  (go (let [composition-hierarchy (<! (get-recursive-relations @fact-service 1000000123 5519 5))]
        (println "Composition hierarchy:")
        (println composition-hierarchy)
        composition-hierarchy))

  )
