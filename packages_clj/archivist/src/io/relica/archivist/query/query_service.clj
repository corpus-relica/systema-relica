;; (ns io.relica.archivist.query.query-service
;;   (:require
;;    [io.relica.archivist.query.gel-to-cypher :as gel-to-cypher]
;;    [io.relica.archivist.query.gel-parser]
;;    [clojure.core.async :refer [go <! >! chan]]))

(ns io.relica.archivist.query.query-service
  (:require
   [io.relica.archivist.services.graph-service :as graph :refer [graph-service]]
   [io.relica.archivist.services.gellish-base-service :as gellish-base :refer [gb-comp]]
   [io.relica.archivist.query.gellish-to-cypher-converter :as gtc]
   [io.relica.archivist.query.gel-parser :as parser]
   [clojure.tools.logging :as log]
   [clojure.pprint :as pp]
   [io.relica.common.services.cache-service :as cache :refer [cache-service-comp]]))

(defn- temp-uid? [uid]
  (and (>= uid 1) (<= uid 99)))

(defn- transform-result [result]
  (reduce-kv (fn [m k v]
               (assoc m k
                      (cond
                        ;; Handle date fields
                        (and (contains? #{:effective_from :latest_update} k)
                             (or (instance? java.time.LocalDate v)
                                 (string? v)))
                        (graph/format-date v)

                        ;; Ensure integer values when appropriate
                        (contains? #{:rel_type_uid :lh_object_uid :rh_object_uid
                                     :fact_uid :collection_uid :language_uid} k)
                        (graph/ensure-integer v)

                        ;; Handle Neo4j numeric values
                        :else (graph/resolve-neo4j-int v))))
             {}
             result))

(defn- process-cypher-results [cypher-results]
  (let [unique-facts (atom {})
        variables (atom {})]
        

    (doseq [record cypher-results]
      (doseq [[key value] record]
        (do
          ;; (println "Processing key-value pair ^^^^^^^^^^^^^:" key value)
          (cond
            ;; For fact nodes (keys starting with "f")
            (and (keyword? key) (clojure.string/starts-with? (name key) "f"))
            (when value  ; When the fact node exists
              (let [fact-key (:fact_uid value)
                    transformed-value (transform-result value)]
                (swap! unique-facts assoc fact-key transformed-value)))

            ;; For variable nodes (any other keys that have an :uid field)
            (and (keyword? key) (:uid value))
            (let [var-name (name key)
                  uid (:uid value)]
              (let [s (or (get @variables var-name) #{})]
                (swap! variables assoc var-name (conj s uid))))

            :else
            (when-not (nil? value)
              (log/debug "Skipping key-value pair:" key value))))))

    (log/debug "Unique facts:" @unique-facts)
    (log/debug "Variables:" @variables)

    {:facts (vals @unique-facts)
     :variables @variables}))

(defn- resolve-variables [variables original-query]
  (let [result (atom {})]
    (doseq [[index query-fact] (map-indexed vector original-query)]
      (doseq [[position key field-name]
              [[0 :lh_object_uid :lh_object_name]
               [1 :rel_type_uid :rel_type_name]
               [2 :rh_object_uid :rh_object_name]]]
        (println "@@@@@@@@@@@@@@@@@@@@@@@@@ Processing:" index position key field-name)
        (println "@@@@@@@@@@@@@@@@@@@@@@@@@ Query Fact:" query-fact)
        (println "+++++++++++++++++++++++++ Vairables:" variables)
        (let [uid (get query-fact key)]
          (println "+++++++++++++++++++++++++ UID:" uid "--" (temp-uid? uid))
          (when (temp-uid? uid)
            (let [var-name (str "var_" uid)
                  _ (println "+++++++++++++++++++++++++ Var Name:" var-name)
                  name (get query-fact field-name)
                    _ (println "+++++++++++++++++++++++++ Name:" name)
                  matching-var (get variables var-name)]
              (println "+++++++++++++++++++++++++ Matching Var:" matching-var)
              (when-not (get @result var-name)
                (swap! result assoc var-name
                       {:uid uid
                        :name name
                        :possible-values (if matching-var (vec matching-var) [])
                        :is-resolved (boolean matching-var)})))))))

    (vals @result)))

(defn- get-total-count [table]
  (let [{:keys [query params]} (gtc/process-gellish-query table 1 1)
        count-query (str (first (clojure.string/split query #"RETURN")) " RETURN count(*) as total")
        result (graph/exec-query @graph-service count-query params)]
    ;; (println "FOOBARBAZ" query params)
    ;; (println "TOTAL QUERY " count-query)
    ;; (println "RESULT" result)
    ;; (println "RESULT" (first result) (type (first result)))
    ;; (println "!!!!!!" (:total (first result)))
    (-> result
        first
        :total)))

(defn interpret-query-table [table & {:keys [page page-size]
                                      :or {page 1 page-size 10}}]
  (try
    (let [{:keys [query params]} (gtc/process-gellish-query table page page-size)
          result (graph/exec-query @graph-service query params)
          _ (log/error "***************************** Cypher Result:")
          ;; _ (pp/pprint result)
          {:keys [facts variables]} (process-cypher-results result)
          resolved-vars (resolve-variables variables table)
          _ (log/error "***************************** Resolved Vars:" resolved-vars)
          resolved-uids (reduce (fn [acc curr]
                                  (concat acc (:possible-values curr)))
                                []
                                resolved-vars)
          _ (log/error "***************************** Resolved UIDs:" resolved-uids)
          unanchored-uids (filter (fn [uid]
                                    (not (some (fn [fact]
                                                 (and (= (:lh_object_uid fact) uid)
                                                      (or
                                                       (= (:rel_type_uid fact) 1146)
                                                       (= (:rel_type_uid fact) 1225)
                                                       (= (:rel_type_uid fact) 1726))))
                                               facts)))
                                  resolved-uids)
          _ (log/error "***************************** Unanchored UIDs:" unanchored-uids)
          spec-facts (gellish-base/get-specialization-facts @gb-comp unanchored-uids)
          class-facts (gellish-base/get-classification-facts @gb-comp unanchored-uids)
          total-count (get-total-count table)]

      {:facts facts
       :grounding-facts (concat spec-facts class-facts)
       :vars resolved-vars
       :total-count total-count})

    (catch Exception e
      (log/error "Error interpreting query table" e)
      (throw e))))

(defn interpret-query-string [query-string
                              & {:keys [page page-size]
                                 :or {page 1 page-size 10}}]
  (let [query-string-array (clojure.string/split query-string #"\n")
        final-array (loop [remaining query-string-array
                           q-str ""
                           result []]
                      (if (empty? remaining)
                        (if (empty? q-str) result (conj result q-str))
                        (let [line (first remaining)
                              new-q-str (str q-str line "\n")]
                          (if (.startsWith line "@")
                            (recur (rest remaining) new-q-str result)
                            (recur (rest remaining) "" (conj result new-q-str))))))

        query-table (reduce (fn [memo query-str]
                              (concat memo (parser/parse query-str)))
                            []
                            final-array)]

    (interpret-query-table query-table
                           :page page
                           :page-size page-size)))


(comment

  (cache/start "xxx")

  (graph/start)

  (gellish-base/start @graph-service @cache-service-comp)

  (pp/pprint (interpret-query-string "1.? > 1225 > 2.?"))

  (pp/pprint (interpret-query-string "1744 > 5091 > 1.?"))

  (pp/pprint (interpret-query-string "1.? > 5091 > 2.?"))

  (pp/pprint (interpret-query-string "1744 > 5091 > 3.?
                                      1.? > 1225 > 2.?"))

  (print))
