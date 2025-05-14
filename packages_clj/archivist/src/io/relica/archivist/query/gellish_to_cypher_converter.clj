(ns io.relica.archivist.query.gellish-to-cypher-converter
  (:require [clojure.tools.logging :as log]
            [io.relica.common.services.cache-service :as cache :refer [cache-service-comp]]))

(defrecord TempEntity [var-name constraints])

(defn- is-temp-uid? [uid]
  (and (>= uid 1) (<= uid 99)))

(defn- get-entity-variable [temp-entities uid]
  (let [var-name (str "var_" uid)]
    (if-not (contains? @temp-entities var-name)
      (swap! temp-entities assoc var-name (->TempEntity var-name [])))
    var-name))

(defn- generate-return-clause [temp-entities statement-count]
  (println "Generating return clause with statement count:" statement-count)
  (println "Temp entities:" @temp-entities)
  (let [return-items (map (fn [[_ entity]]
                            (str (:var-name entity) " {.*, uid: " (:var-name entity) ".uid}"))
                          @temp-entities)
        fact-items (map #(str "f" %) (range statement-count))]
    (str "RETURN DISTINCT "
         (clojure.string/join ", " (concat return-items fact-items)))))

(defn- generate-cypher-query [patterns where-clauses temp-entities statement-count skip limit]
  (let [match-clauses (clojure.string/join "\n" patterns)
        where-clause (if (seq where-clauses)
                       (str "WHERE " (clojure.string/join " AND " where-clauses))
                       "")
        return-clause (generate-return-clause temp-entities statement-count)]
    (str match-clauses "\n"
         where-clause "\n"
         return-clause "\n"
         "SKIP " skip "\n"
         "LIMIT " limit)))

(defn- generate-cypher-pattern [temp-entities statement index]
  (let [lh-uid (:lh_object_uid statement)
        rh-uid (:rh_object_uid statement)
        rel-uid (:rel_type_uid statement)
        lh-var-name (get-entity-variable temp-entities lh-uid)
        rh-var-name (get-entity-variable temp-entities rh-uid)
        f-var (str "f" index)
        stmt-params (atom {})
        where-clauses (atom [])

        _ (println lh-var-name ":" rh-var-name ":" f-var)

        lh-is-temp (is-temp-uid? lh-uid)
        rh-is-temp (is-temp-uid? rh-uid)
        rel-is-temp (is-temp-uid? rel-uid)]
    (when-not lh-is-temp
      (let [lh-descendants (concat
                             [lh-uid]
                             (cache/all-descendants-of @cache-service-comp lh-uid))]
        (swap! stmt-params assoc (str lh-var-name "Descendants") lh-descendants)
        (swap! where-clauses conj (str lh-var-name ".uid IN $" lh-var-name "Descendants"))))

    (when-not rh-is-temp
      (let [rh-descendants (concat
                             [rh-uid]
                             (cache/all-descendants-of @cache-service-comp rh-uid))]
        (swap! stmt-params assoc (str rh-var-name "Descendants") rh-descendants)
        (swap! where-clauses conj (str rh-var-name ".uid IN $" rh-var-name "Descendants"))))

    (when-not rel-is-temp
      (let [rel-descendants (concat
                             [rel-uid]
                             (cache/all-descendants-of @cache-service-comp rel-uid))]
        (swap! stmt-params assoc (str f-var "Descendants") rel-descendants)
        (swap! where-clauses conj (str f-var ".rel_type_uid IN $" f-var "Descendants"))))

    (let [pattern (str "MATCH (" lh-var-name ":Entity)-->(" f-var ":Fact)-->(" rh-var-name ":Entity)")
          where-clause (if (seq @where-clauses)
                         (clojure.string/join " AND " @where-clauses)
                         nil)]

      {:pattern pattern
       :stmt-params @stmt-params
       :where-clause where-clause})))


(defn process-gellish-query
  ""
  [gellish-statements page page-size]
  (let [temp-entities (atom {})
        cypher-patterns (atom [])
        params (atom {})
        where-clauses (atom [])]

    ;; Process each statement
    (doseq [[i statement] (map-indexed vector gellish-statements)]
      (let [{:keys [pattern stmt-params where-clause]}
            (generate-cypher-pattern temp-entities statement i)]

        (swap! cypher-patterns conj pattern)
        (swap! params merge stmt-params)
        (when where-clause
          (swap! where-clauses conj where-clause))))

    (log/debug "Cypher Patterns:\n" (clojure.string/join "\n" @cypher-patterns))

    (let [skip (* (- page 1) page-size)
          limit page-size

          query (generate-cypher-query
                  @cypher-patterns
                  @where-clauses
                  temp-entities
                  (count gellish-statements)
                  skip
                  limit)]

      (log/debug "Generated Cypher Query:\n" query)
      (log/debug "Query Params:" @params)

      {:query query :params @params})))
