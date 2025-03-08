(ns io.relica.archivist.services.graph-service
  (:require [clojure.tools.logging :as log]
            [neo4j-clj.core :as neo4j])
  (:import (org.neo4j.driver Values)
           (org.neo4j.driver.internal.value NumberValueAdapter)))

(defprotocol GraphOperations
  (exec-query [this query params])
  (exec-write-query [this query params]))

(defrecord GraphService [session-factory]

  GraphOperations

  (exec-query [_ query params]
    (with-open [session (session-factory)]
      (vec
        (if (fn? query)
          ;; If query is a function (from defquery), call it with params
          (query session params)
          ;; If query is a raw string, pass it through with params
          (neo4j/execute session query params)))))

  (exec-write-query [this query params]
    (exec-query this query params)))


(defn resolve-neo4j-int [val]
  ;; (tap> {:msg "RESOLVING NEO4J INT"
  ;;        :val val})
  (cond
    (instance? NumberValueAdapter val) (.asNumber val)
    :else val))

(defn convert-neo4j-ints [node]
  (try
    (-> node
        (update :identity #(resolve-neo4j-int %))
        (update :properties (fn [props]
                              (->> props
                                   (map (fn [[k v]] [k (resolve-neo4j-int v)]))
                                   (into {})))))
    (catch Exception e
      (throw e))))

(defn format-date [date-value]
  (cond
    ;; Handle java.time.LocalDate objects
    (instance? java.time.LocalDate date-value)
    (let [year (.getYear date-value)
          month (.getMonthValue date-value)
          day (.getDayOfMonth date-value)]
      (format "%04d-%02d-%02d" year month day))

    ;; Handle strings that might already be dates
    (and (string? date-value)
         (re-matches #"\d{4}-\d{2}-\d{2}" date-value))
    date-value

    ;; Return other values unchanged
    :else date-value))

(defn ensure-integer [v]
  (cond
    ;; Already a number and is an integer value
    (and (number? v) (= (Math/floor v) v))
    (long v)

    ;; String that can be parsed as a number
    (string? v)
    (try
      (Long/parseLong v)
      (catch Exception e
        v))  ; Return original string if it can't be parsed

    ;; For nil or any other type, just return it
    :else v))

(defn transform-results [results]
  (->> results
       (map #(get-in % [:r]))
       (map #(into {} %))
       (map (fn [entry]
              (reduce-kv (fn [m k v]
                           (assoc m k
                                  (cond
                                    ;; Handle date fields
                                    (and (contains? #{:effective_from :latest_update} k)
                                         (or (instance? java.time.LocalDate v)
                                             (string? v)))
                                    (format-date v)

                                    ;; Ensure integer values when appropriate
                                    (contains? #{:rel_type_uid :lh_object_uid :rh_object_uid
                                                :fact_uid :collection_uid :language_uid} k)
                                    (ensure-integer v)

                                    ;; Handle Neo4j numeric values
                                    :else (resolve-neo4j-int v))))
                         {}
                         entry)))))

(defn create-graph-service [session-factory]
  (->GraphService session-factory))

(def graph-service (atom nil))

(defn start []
  (let [conn (neo4j/connect
               (java.net.URI. "bolt://localhost:7687")
               "neo4j"
               "password")
        session-factory (fn [] (neo4j/get-session conn))
        service (create-graph-service session-factory)]
    (reset! graph-service service)
    service))

(defn stop []
  ;; disconnect
  ;; (neo4j/close (neo4j/get-conn @graph-service))
  (reset! graph-service nil))

(comment
  ;; Test operations
  (let [conn (neo4j/connect
               (java.net.URI. "bolt://localhost:7687")
               "neo4j"
               "password")
        session-factory (fn [] (neo4j/get-session conn))
        test-service (create-graph-service session-factory)]
    (exec-query test-service "MATCH (n) RETURN n LIMIT 1" nil))

)
