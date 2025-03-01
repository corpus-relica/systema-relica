(ns io.relica.archivist.services.fact-service
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.archivist.services.cache-service :as cache]
            [io.relica.archivist.services.concept-service :as concept]
            [io.relica.archivist.services.uid-service :as uid]
            [io.relica.archivist.db.queries :as queries]))

(defn- await-all
  "Helper function to await a sequence of core.async channels"
  [channels]
  (go
    (let [results (atom [])]
      (doseq [c channels]
        (swap! results conj (<! c)))
      @results)))

(defprotocol FactOperations
  (get-subtypes [this uid])
  (get-subtypes-cone [this uid])
  (get-classified [this uid recursive])
  (get-facts-about-individual [this uid])
  (get-all-related-facts [this uid])
  (get-all-related-facts-recursive [this uid depth])
  (get-related-on-uid-subtype-cone [this lh-object-uid rel-type-uid])
  (get-facts-relating-entities [this uid1 uid2])
  (confirm-fact [this fact])
  (confirm-fact-in-relation-cone [this lh-object-uids rel-type-uids rh-object-uids])
  (delete-fact [this uid])
  (delete-entity [this uid]))

(defrecord FactService [graph-service gellish-base-service cache-service concept-service uid-service]
  FactOperations
  (get-subtypes [_ uid]
    (let [result (graph/exec-query graph-service queries/subtypes {:uid uid})]
      (->> result
           (map #(get-in % [:r :properties]))
           (map #(into {} %)))))

  (get-subtypes-cone [this uid]
    (go
      (let [subtypes (<! (cache/all-descendants-of cache-service uid))
            facts (map #(get-subtypes this %) subtypes)]
        (flatten facts))))

  (get-classified [this uid recursive]
    (go
      (try
        (let [direct-results (graph/exec-query graph-service
                                               queries/classified
                                               {:uid uid})
              direct-classified (if (empty? direct-results)
                                  []
                                  (graph/transform-results graph-service direct-results))]
          (tap> (str "Direct classified: " direct-classified))
          (tap> direct-results)
          (if-not recursive
            direct-classified
            (let [subtypes (<! (cache/all-descendants-of cache-service uid))
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

  (get-all-related-facts [_ uid]
    (tap> "------------------- GET ALL RELATED FACTS -------------------")
    (tap> cache-service)
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
              _ (tap> res-2850)
              results-2850b (graph/exec-query
                             graph-service
                             queries/all-related-facts-d
                             {:start_uid uid
                              :rel_type_uids rel-type-uids})
              res-2850b (graph/transform-results results-2850b)]
          (tap> "------------------- GET ALL RELATED FACTS RESULT -------------------")
          (tap> results-2850)
          (tap> results-2850b)
          (tap> res-2850)
          (tap> (concat res-2850 res-2850b))
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
                                  all-results (await-all recursive-results)]
                              (concat result (flatten all-results)))
                            [])))

              ;; Execute recursive function
              prelim-result (<! (recurse uid 0))

              ;; Filter out duplicates
              unique-results (filter (fn [item]
                                       (let [index-of-first-occurrence
                                             (first
                                              (keep-indexed
                                               (fn [idx itm]
                                                 (when (= (:fact_uid itm) (:fact_uid item)) idx))
                                               prelim-result))]
                                         (= index-of-first-occurrence
                                            (first
                                             (keep-indexed
                                              (fn [idx _] idx)
                                              (filter #(= (:fact_uid %) (:fact_uid item)) prelim-result))))))
                                     prelim-result)]
          unique-results)
        (catch Exception e
          (log/error "Error in get-all-related-facts-recursive:" (ex-message e))
          []))))

  (get-related-on-uid-subtype-cone [_ lh-object-uid rel-type-uid]
    (tap> "------------------- GET RELATED ON UID SUBTYPE CONE -------------------")
    (go
      (try
        (let [;; Get all subtypes of the relation type
              subtypes-of-rel-type (cache/all-descendants-of cache-service rel-type-uid)
              all-rel-types (conj subtypes-of-rel-type rel-type-uid)

              _ (tap> "------------------- GET RELATED ON UID SUBTYPE CONE SUBTYPES -------------------")
              _ (tap> all-rel-types)

              ;; Get all facts involving the entity with the specified relation types
              results (graph/exec-query graph-service
                                        queries/all-related-facts-c
                                        {:start_uid lh-object-uid
                                         :rel_type_uids all-rel-types})
              res (graph/transform-results results)

              _ (tap> "------------------- GET RELATED ON UID SUBTYPE CONE RESULTS -------------------")
              _ (tap> results)
              _ (tap> res)

              ;; Filter out duplicates
              unique-results (filter (fn [item]
                                       (let [index-of-first-occurrence
                                             (first
                                              (keep-indexed
                                               (fn [idx itm]
                                                 (when (= (:fact_uid itm) (:fact_uid item)) idx))
                                               res))]
                                         (= index-of-first-occurrence
                                            (first
                                             (keep-indexed
                                              (fn [idx _] idx)
                                              (filter #(= (:fact_uid %) (:fact_uid item)) res))))))
                                     res)]
          (tap> "------------------- GET RELATED ON UID SUBTYPE CONE UNIQUE RESULTS -------------------")
          (tap> unique-results)
          unique-results)
        (catch Exception e
          (log/error "Error in get-related-on-uid-subtype-cone:" (ex-message e))
          []))))

  (get-facts-relating-entities [_ uid1 uid2]
    (go
      (try
        (let [;; Get facts where uid1 is the subject and uid2 is the object
              results (graph/exec-query graph-service
                                        queries/all-related-facts
                                        {:start_uid uid1
                                         :end_uid uid2})
              res (graph/transform-results results)

              ;; Get facts where uid2 is the subject and uid1 is the object
              results-b (graph/exec-query graph-service
                                          queries/all-related-facts-b
                                          {:start_uid uid1
                                           :end_uid uid2})
              res-b (graph/transform-results results-b)

              ;; Combine results and filter out duplicates
              possibly-redunt-results (concat res res-b)
              unique-results (filter (fn [item]
                                       (let [index-of-first-occurrence
                                             (first
                                              (keep-indexed
                                               (fn [idx itm]
                                                 (when (= (:fact_uid itm) (:fact_uid item)) idx))
                                               possibly-redunt-results))]
                                         (= index-of-first-occurrence
                                            (first
                                             (keep-indexed
                                              (fn [idx _] idx)
                                              (filter #(= (:fact_uid %) (:fact_uid item)) possibly-redunt-results))))))
                                     possibly-redunt-results)]
          unique-results)
        (catch Exception e
          (log/error "Error in get-facts-relating-entities:" (ex-message e))
          []))))

  (confirm-fact [_ fact]
    (go
      (try
        (let [query "MATCH (r:Fact {lh_object_uid: $lh_object_uid, rh_object_uid: $rh_object_uid, rel_type_uid: $rel_type_uid}) RETURN r"
              result (graph/exec-query graph-service
                                       query
                                       {:lh_object_uid (:lh_object_uid fact)
                                        :rh_object_uid (:rh_object_uid fact)
                                        :rel_type_uid (:rel_type_uid fact)})]
          (if (empty? result)
            nil
            (first (graph/transform-results result))))
        (catch Exception e
          (log/error "Error in confirm-fact:" (ex-message e))
          nil))))

  (confirm-fact-in-relation-cone [this lh-object-uids rel-type-uids rh-object-uids]
    (go
      (try
        (when (and (nil? lh-object-uids) (nil? rel-type-uids) (nil? rh-object-uids))
          (throw (Exception. "At least one of lh_object_uid, rel_type_uid, or rh_object_uid must be non-null")))

        (let [;; Build the query dynamically based on the provided parameters
              base-query "MATCH (r:Fact) WHERE 1=1"
              params (atom {})

              ;; Add conditions for lh_object_uids if provided
              query-with-lh (if (not (nil? lh-object-uids))
                              (do
                                (swap! params assoc :lh_object_uids lh-object-uids)
                                (str base-query " AND r.lh_object_uid IN $lh_object_uids"))
                              base-query)

              ;; Add conditions for rh_object_uids if provided
              query-with-rh (if (not (nil? rh-object-uids))
                              (do
                                (swap! params assoc :rh_object_uids rh-object-uids)
                                (str query-with-lh " AND r.rh_object_uid IN $rh_object_uids"))
                              query-with-lh)

              ;; Add conditions for rel_type_uids if provided
              rel-subtypes (atom [])
              _ (when (not (nil? rel-type-uids))
                  (doseq [rel-type-uid rel-type-uids]
                    (let [subtypes (<! (cache/all-descendants-of cache-service rel-type-uid))]
                      (swap! rel-subtypes conj rel-type-uid)
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

;; Helper functions for external use
(defn get-related-on-uid-subtype-cone-facts
  "Get all facts related to an entity with a specific relation type or its subtypes"
  [fact-service lh-object-uid rel-type-uid]
  (get-related-on-uid-subtype-cone fact-service lh-object-uid rel-type-uid))

(comment
  ;; Test operations
  (let [test-service (create-fact-service graph-service nil cache-service nil nil)]
    (get-classified test-service 970178))

  @fact-service

  (go (let [xxx (<! (get-classified @fact-service 1000000061 true))]
        (println "XXX")
        (println xxx)
        xxx)))
