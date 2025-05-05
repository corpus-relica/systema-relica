(ns io.relica.archivist.core.gellish-base
  (:require
   ;; [mount.core :refer [defstate]]
   ;;          [next.jdbc :as jdbc]
   ;;          [next.jdbc.result-set :as rs]
   [io.relica.archivist.db.queries :as queries]
   [io.relica.archivist.services.graph-service :as graph]
   [io.relica.common.services.cache-service :as cache]
   [clojure.tools.logging :as log])
  (:import (java.net URI))
  (:gen-class))

(def ^:private physical-object-uid 730044)
(def ^:private role-uid 160170)
(def ^:private aspect-uid 790229)
(def ^:private relation-uid 2850)
(def ^:private occurrence-uid 193671)


(defn get-entities [uids]
  (let [raw-result (graph/exec-query
                    graph/graph-service
                    queries/entities  ; Use the predefined query
                    {:uids uids})
        result (map (fn [record]
                      (let [entity (:n record)
                            uid (:uid entity)
                            descendants (cache/all-descendants-of cache/cache-service uid)]
                        (assoc entity :descendants descendants)))
                    raw-result)]
    result))

(defn get-fact [fact-uid]
  (try
    (let [result (graph/exec-query
                  graph/graph-service
                  queries/fact
                  {:uid fact-uid})]
      (when (seq result)
        (-> (first result)
            (get-in [:n :properties]))))
    (catch Exception e
      (log/error "Error getting fact:" e)
      nil)))

(defn get-facts [fact-uids]
  (try
    (let [result (graph/exec-query
                  graph/graph-service
                  queries/facts
                  {:uids fact-uids})]
      (when (seq result)
        (mapv #(get-in % [:n :properties]) result)))
    (catch Exception e
      (log/error "Error getting facts:" e)
      nil)))

(declare get-specialization-fact)
(declare get-classification-fact)
(defn get-specialization-hierarchy [uid]
  (try
    (let [class-fact (get-classification-fact uid)
          uid (if (seq class-fact)
                (get-in (first class-fact) [:rh_object_uid])
                uid)
          concepts-set (atom #{})
          concepts (atom [])
          lineage (cache/lineage-of cache/cache-service uid)
          facts (atom [])]
        ;; Get all specialization facts for the lineage
      (doseq [uid lineage]
        (let [spec-facts (get-specialization-fact uid)]
            ;; Use into to ensure we maintain a vector
          (swap! facts into spec-facts)))
        ;; Add classification fact if it exists
      (when (seq class-fact)
          ;; Use into or vec/concat to ensure the class-fact is added to the end
        (swap! facts into [(first class-fact)]))
        ;; Collect unique concepts
      (doseq [fact @facts]
        (let [lh-uid (:lh_object_uid fact)
              rh-uid (:rh_object_uid fact)]
          (when (and lh-uid (not (@concepts-set lh-uid)))
            (swap! concepts-set conj lh-uid)
            (swap! concepts conj {:uid lh-uid}))
          (when (and rh-uid (not (@concepts-set rh-uid)))
            (swap! concepts-set conj rh-uid)
            (swap! concepts conj {:uid rh-uid}))))
      {:facts @facts
       :concepts (vec @concepts-set)})
    (catch Exception e
      (log/error "Error getting specialization hierarchy:" e)
      {:facts [] :concepts []})))

(defn get-sh [uid]
  (try
    (let [result (get-specialization-hierarchy uid)]
      (if (empty? (:facts result))
        []
        (mapv (fn [item]
                [(:lh_object_uid item)
                 (:rel_type_uid item)
                 (:rh_object_uid item)])
              (:facts result))))
    (catch Exception e
      (log/error "Error getting SH:" e)
      [])))

(defn get-specialization-fact [uid]
  (try
    (let [result (graph/exec-query
                  graph/graph-service
                  queries/specialization-fact
                  {:uid uid})
          res (if (empty? result)
                []
                (mapv (fn [item]
                        (let [r (:r item)]
                          (cond-> r
                            (:effective_from r) (update :effective_from graph/format-date)
                            (:latest_update r) (update :latest_update graph/format-date)
                            (:rel_type_uid r) (update :rel_type_uid graph/ensure-integer)
                            (:lh_object_uid r) (update :lh_object_uid graph/ensure-integer)
                            (:rh_object_uid r) (update :rh_object_uid graph/ensure-integer)
                            (:collection_uid r) (update :collection_uid graph/ensure-integer)
                            (:language_uid r) (update :language_uid graph/ensure-integer))))
                            
                      result))]
      res)
      
    (catch Exception e
      (log/error "Error getting specialization fact:" e)
      [])))

(defn get-specialization-facts [uids]
  (try
    (cond
      (and (sequential? uids) (empty? uids)) []
      (nil? uids) []
      (not (sequential? uids)) (get-specialization-facts [uids])
      :else (->> uids
                 (map #(get-specialization-fact (if (string? %) (Integer/parseInt %) %)))
                 (filter not-empty)
                 (apply concat)))
    (catch Exception e
      (log/error "Error getting specialization facts:" e)
      [])))

(defn get-qualification-fact [uid]
  (try
    (let [result (graph/exec-query
                  graph/graph-service
                  queries/qualification-fact
                  {:uid uid})]
      (if (empty? result)
        []
        (mapv graph/transform-results result)))
    (catch Exception e
      (log/error "Error getting qualification fact:" e)
      [])))

(defn get-classification-fact [uid]
  (try
    (let [result (graph/exec-query
                  graph/graph-service
                  queries/classification-fact
                  {:uid uid})]
      (println "!!!!!!!!!!!!!!!!!!!!!!!! Classification fact result:" (graph/transform-results result))
      (if (empty? result)
        []
        (graph/transform-results result)))
    (catch Exception e
      (log/error "Error getting classification fact:" e)
      [])))

(defn get-classification-facts [uids]
  (try
    (->> uids
         (map #(get-classification-fact %))
         (apply concat))
    (catch Exception e
      (log/error "Error getting classification facts:" e)
      [])))

(defn get-entity-category [uid]
  (try
    (let [class-fact (get-classification-fact uid)
          uid (if (seq class-fact)
                (get-in (first class-fact) [:rh_object_uid])
                uid)
          physical-object-subtypes (cache/all-descendants-of cache/cache-service physical-object-uid)
          role-subtypes (cache/all-descendants-of cache/cache-service role-uid)
          aspect-subtypes (cache/all-descendants-of cache/cache-service aspect-uid)
          relation-subtypes (cache/all-descendants-of cache/cache-service relation-uid)
          occurrence-subtypes (cache/all-descendants-of cache/cache-service occurrence-uid)
          res (cond
                (or (= uid physical-object-uid)
                    ((set physical-object-subtypes) uid)) "physical object"
                (or (= uid role-uid)
                    ((set role-subtypes) uid)) "role"
                (or (= uid aspect-uid)
                    ((set aspect-subtypes) uid)) "aspect"
                (or (= uid occurrence-uid)
                    ((set occurrence-subtypes) uid)) "occurrence"
                (or (= uid relation-uid)
                    ((set relation-subtypes) uid)) "relation"
                :else "anything")]
      res)
    (catch Exception e
      (log/error "Error getting category:" e)
      "anything")))

(defn get-synonyms [uid]
  (try
    (let [result (graph/exec-query
                  graph/graph-service
                  queries/synonyms
                  {:uid uid})]
      (graph/transform-results result))
    (catch Exception e
      (log/error "Error getting synonyms:" e)
      [])))

;; (get-inverses [uid]
;;   (try
;;     (let [result (graph/exec-query
;;                   graph/graph-service
;;                   queries/inverses
;;                   {:uid uid})]
;;       (graph/transform-results result))
;;     (catch Exception e
;;       (log/error "Error getting inverses:" e)
;;       [])))

(defn get-possible-roles [uid]
  (try
    (let [spec-h (get-specialization-hierarchy uid)
          facts (:facts spec-h)
          unique-results (atom #{})]

      (doseq [fact (butlast facts)]
        (let [res (graph/exec-query
                   graph/graph-service
                   queries/possible-roles
                   {:uid (:lh_object_uid fact)})]
          (doseq [item res]
            (let [transformed-item (assoc
                                    (get-in item [:r :properties])
                                    :rel_type_name
                                    (get-in item [:r :type]))]
              (swap! unique-results conj transformed-item)))))

      (vec @unique-results))
    (catch Exception e
      (log/error "Error getting possible roles:" e)
      [])))

(defn get-partial-defs [uid]
  (try
    (let [result (graph/exec-query
                  graph/graph-service
                  queries/partial-defs
                  {:uid uid})]
      (mapv (fn [item]
              {:sourceUID (get item :source_uid)
               :partialDef (get item :partial_definition)})
            result))
    (catch Exception e
      (log/error "Error getting partial defs:" e)
      [])))

(defn get-names [uid]
  (try
    (let [spec-fact (get-specialization-fact uid)
          spec-fact-names (mapv :lh_object_name spec-fact)
          class-fact (get-classification-fact uid)
          class-fact-names (mapv :lh_object_name class-fact)
          synonyms (get-synonyms uid)
          synonym-names (mapv :lh_object_name synonyms)]
      (vec (concat spec-fact-names class-fact-names synonym-names)))
    (catch Exception e
      (log/error "Error getting names:" e)
      [])))

(defn get-required-role [relation-uid role-index]
  (try
    (let [spec-h (get-specialization-hierarchy relation-uid)
          query (if (= role-index 1)
                  queries/required-role1
                  queries/required-role2)]
      (loop [i 0
             facts (:facts spec-h)]
        (if (or (>= i (dec (count facts)))
                (empty? facts))
          nil
          (let [fact (nth facts i)
                result (graph/exec-query
                        graph/graph-service
                        query
                        {:uid (:lh_object_uid fact)})]
            (if (empty? result)
              (recur (inc i) facts)
              (graph/transform-results (first result)))))))
    (catch Exception e
      (log/error "Error getting required role:" e)
      nil)))

(defn get-required-role1 [relation-uid]
  (get-required-role relation-uid 1))

(defn get-required-role2 [relation-uid]
  (get-required-role relation-uid 2))

(defn get-possible-role-players [role-uid]
  (try
    (let [spec-h (get-specialization-hierarchy role-uid)
          facts (:facts spec-h)]
      (loop [i 0
             result []]
        (if (>= i (count facts))
          (if (empty? result)
            []
            (graph/transform-results result))
          (let [fact (nth facts i)
                res (graph/exec-query
                     graph/graph-service
                     queries/possible-role-players
                     {:uid (:lh_object_uid fact)})]
            (recur (inc i) (concat result res))))))
    (catch Exception e
      (log/error "Error getting possible role players:" e)
      [])))

(defn get-requiring-relations [role-uid]
  (try
    (let [spec-h (get-specialization-hierarchy role-uid)
          facts (:facts spec-h)]
      (loop [i 0
             result []]
        (if (or (>= i (dec (count facts)))
                (empty? facts))
          (if (empty? result)
            []
            (graph/transform-results result))
          (let [fact (nth facts i)
                res (graph/exec-query
                     graph/graph-service
                     queries/requiring-relations
                     {:uid (:lh_object_uid fact)})]
            (recur (inc i) (concat result res))))))
    (catch Exception e
      (log/error "Error getting requiring relations:" e)
      [])))

(defn get-definitive-facts [uid]
  (try
    (let [spec-fact (get-specialization-fact uid)
          class-fact (get-classification-fact uid)
          qual-fact (get-qualification-fact uid)
          res (cond
                (not-empty spec-fact) spec-fact
                (not-empty class-fact) class-fact
                (not-empty qual-fact) qual-fact
                :else [])]
      res)
      
    (catch Exception e
      (log/error "Error getting definitive facts:" e)
      [])))

(defn update-fact-definition [fact-uid partial-definition full-definition]
  (try
    (let [result (graph/exec-write-query
                  graph/graph-service
                  queries/update-fact-definition
                  {:fact_uid fact-uid
                   :partial_definition partial-definition
                   :full_definition full-definition})]
      (graph/transform-results (first result)))
    (catch Exception e
      (log/error "Error updating fact definition:" e)
      nil)))

(defn update-fact-collection [fact-uid collection-uid collection-name]
  (try
    (let [result (graph/exec-write-query
                  graph/graph-service
                  queries/update-fact-collection
                  {:fact_uid fact-uid
                   :collection_uid collection-uid
                   :collection_name collection-name})]
      (graph/transform-results (first result)))
    (catch Exception e
      (log/error "Error updating fact collection:" e)
      nil)))

(defn update-fact-name [fact-uid name]
  (try
    (let [result (graph/exec-write-query
                  graph/graph-service
                  queries/update-fact-name
                  {:fact_uid fact-uid
                   :name name})]
      (graph/transform-results (first result)))
    (catch Exception e
      (log/error "Error updating fact name:" e)
      nil)))

(defn blanket-update-fact-name [uid new-name]
  (try
    (let [facts (graph/exec-query
                 graph/graph-service
                 queries/all-facts-involving-entity
                 {:uid uid})
          facts (map #(get-in % [:r :properties]) facts)
          facts (map (fn [fact]
                       (cond-> fact
                         (= (:rh_object_uid fact) uid) (assoc :rh_object_name new-name)
                         (= (:lh_object_uid fact) uid) (assoc :lh_object_name new-name)))
                     facts)
          results (map #(graph/exec-write-query
                         graph/graph-service
                         queries/update-fact-names
                         {:fact_uid (:fact_uid %)
                          :lh_name (:lh_object_name %)
                          :rh_name (:rh_object_name %)})
                       facts)]
      (mapv #(get-in (first %) [:r :properties]) results))
    (catch Exception e
      (log/error "Error in blanket update fact name:" e)
      [])))


;; (defn create-gellish-base-service-component [graph/graph-service cache/cache-service]
;;   (->GellishBaseServiceComponent graph/graph-service cache/cache-service))

;; (defonce gb-comp (atom nil))

;; (defn start [graph/graph-service cache/cache-service]
;;   (println "Starting Gellish Base Service...")
;;   (let [service (create-gellish-base-service-component graph/graph-service cache/cache-service)]
;;     (reset! gb-comp service)
;;     service))

;; (defn stop []
;;   (println "Stopping Gellish Base Service..."))

(comment
  @gb-comp

  (get-entities @gb-comp [1225 1146])

  (get-specialization-hierarchy @gb-comp 1225)

  (get-specialization-hierarchy @gb-comp 1000000067)

  (get-specialization-fact @gb-comp 1225)

  ;; Test get-fact
  (get-fact @gb-comp 123)

  ;; Test get-facts
  (get-facts @gb-comp [123 456]))

  
