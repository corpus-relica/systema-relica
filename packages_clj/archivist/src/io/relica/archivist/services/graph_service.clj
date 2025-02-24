(ns io.relica.archivist.services.graph-service
  (:require [clojure.tools.logging :as log]
            [neo4j-clj.core :as neo4j])
  (:import (org.neo4j.driver Values)
           (org.neo4j.driver.internal.value NumberValueAdapter)))

(defprotocol GraphOperations
  (exec-query [this query params])
  (exec-write-query [this query params])
  (resolve-neo4j-int [this val])
  (convert-neo4j-ints [this node])
  (resolve-neo4j-date [this neo4j-date])
  (transform-results [this results]))

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
    (exec-query this query params))

  ;; (resolve-neo4j-int [_ val] (tap> {:msg "RESOLVING NEO4J INT"
  ;;          :val val})
  ;;   (cond
  ;;     (instance? NumberValueAdapter val) (.asNumber val)
  ;;     :else val))

  ;; (convert-neo4j-ints [this node]
  ;;   (try
  ;;     (-> node
  ;;         (update :identity #(resolve-neo4j-int this %))
  ;;         (update :properties (fn [props]
  ;;                               (->> props
  ;;                                    (map (fn [[k v]] [k (resolve-neo4j-int this v)]))
  ;;                                    (into {})))))
  ;;     (catch Exception e
  ;;       (throw e))))

  ;; (resolve-neo4j-date [this neo4j-date]
  ;;   (when neo4j-date
  ;;     (let [year (resolve-neo4j-int this (.year neo4j-date))
  ;;           month (resolve-neo4j-int this (.month neo4j-date))
  ;;           day (resolve-neo4j-int this (.day neo4j-date))]
  ;;       (java.util.Date. year (dec month) day))))

  ;; (transform-results [this results]
  ;;   (->> results
  ;;        (map #(get-in % [:r :properties]))
  ;;        (map #(into {} %))
  ;;        (map #(update-vals % (fn [v] (resolve-neo4j-int this v))))))
  )


(defn resolve-neo4j-int [val]

  (tap> {:msg "RESOLVING NEO4J INT"
         :val val})
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

(defn resolve-neo4j-date [neo4j-date]
  (when neo4j-date
    (let [year (resolve-neo4j-int (.year neo4j-date))
          month (resolve-neo4j-int (.month neo4j-date))
          day (resolve-neo4j-int (.day neo4j-date))]
      (java.util.Date. year (dec month) day))))

(defn transform-results [results]
  (->> results
       (map #(get-in % [:r :properties]))
       (map #(into {} %))
       (map #(update-vals % (fn [v] (resolve-neo4j-int v))))))

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
