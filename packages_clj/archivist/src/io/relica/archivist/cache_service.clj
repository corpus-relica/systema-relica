(ns io.relica.archivist.cache-service
  (:require [mount.core :refer [defstate]]
            [taoensso.carmine :as car]
            [clojure.string :as str]
            [io.relica.archivist.linearization-service :as lin]))

(def redis-conn {:pool {} :spec {:uri "redis://localhost:6379"
                                 :username "default"
                                 :password "redis"}})

(defmacro wcar* [& body] `(car/wcar redis-conn ~@body))

(defprotocol CacheServiceOperations
  (update-facts-involving-entity [this uid])
  (remove-from-facts-involving-entity [this uid fact-uid])
  (all-facts-involving-entity [this uid])
  (update-descendants-in-db [this node-to-descendants])
  (all-descendants-of [this uid])
  (update-descendants-cache [this uid])
  (clear-descendants [this])
  (add-descendant-to [this uid descendant])
  (add-descendants-to [this uid descendants])
  (remove-descendant-from [this uid descendant])
  (remove-descendants-from [this uid descendants])
  (lineage-of [this uid])
  (prompt-of [this uid])
  (set-prompt-of [this uid prompt])
  (clear-entity-lineage-cache [this uid])
  (clear-entity-lineage-cache-complete [this])
  (add-to-entity-lineage-cache [this entity-uid lineage])
  (get-min-free-entity-uid [this])
  (set-min-free-entity-uid [this uid])
  (get-min-free-fact-uid [this])
  (set-min-free-fact-uid [this uid])
  (clear-entity-facts-cache-complete [this])
  (add-to-entity-facts-cache [this entity-uid fact-uid])
  (remove-entity-from-lineage-descendants [this euid luid])
  (append-fact [this fact])
  (remove-entity [this uid]))

(defrecord CacheServiceComponent [descendants-cache linearization-service]
  CacheServiceOperations

  ;; Facts
  (update-facts-involving-entity [this uid]
    ;; Implementation commented out in original
    nil)

  (remove-from-facts-involving-entity [this uid fact-uid]
    (let [facts-key (str "rlc:db:YYYY:entity:" uid ":facts")]
      (wcar* (car/srem facts-key (str fact-uid)))))

  (all-facts-involving-entity [this uid]
    (let [facts-key (str "rlc:db:YYYY:entity:" uid ":facts")
          facts (wcar* (car/smembers facts-key))]
      (if (seq facts)
        (mapv #(Integer/parseInt %) facts)
        [])))

  ;; Descendants
  (update-descendants-in-db [this node-to-descendants]
    (doseq [[node-uid descendants-set] node-to-descendants]
      (try
        (let [new-descendants (map str (vec descendants-set))
              ns (str "rlc:db:YYYY:entity:" node-uid ":descendants")]
          (doseq [descendant new-descendants]
            (when (zero? (wcar* (car/sismember ns descendant)))
              (wcar* (car/sadd ns descendant)))))
        (catch Exception e
          (println "Failed to update descendants for node" node-uid ":" e)))))

  (all-descendants-of [this uid]
    (let [descendants-key (str "rlc:db:YYYY:entity:" uid ":descendants")
          descendants (wcar* (car/smembers descendants-key))]
      (if (seq descendants)
        (mapv #(Integer/parseInt %) descendants)
        [])))

  (update-descendants-cache [this uid]
    (let [descendants-key (str "rlc:db:YYYY:entity:" uid ":descendants")
          descendants (wcar* (car/smembers descendants-key))
          parsed-descendants (mapv #(Integer/parseInt %) descendants)]
      (swap! (:descendants-cache this) assoc uid parsed-descendants)
      parsed-descendants))

  (clear-descendants [this]
    (reset! (:descendants-cache this) {}))

  (add-descendant-to [this uid descendant]
    (let [descendants-key (str "rlc:db:YYYY:entity:" uid ":descendants")]
      (wcar* (car/sadd descendants-key (str descendant)))
      (when (get @(:descendants-cache this) uid)
        (swap! (:descendants-cache this) update uid conj descendant))))

  ;; ... More implementations following the same pattern

  (append-fact [this fact]
    (when (or (= (:rel_type_uid fact) 1146)
              (= (:rel_type_uid fact) 1726))
      (let [lineage (lin/calculate-lineage (:linearization-service this) (:lh_object_uid fact))
            descendants (all-descendants-of this (:lh_object_uid fact))]
        ;; Add descendants to each supertype in lineage
        (doseq [ancestor (rest lineage)]
          (add-descendants-to this ancestor (cons (:lh_object_uid fact) descendants)))
        ;; Update lineage caches
        (add-to-entity-lineage-cache this (:lh_object_uid fact) lineage)
        (doseq [descendant descendants]
          (let [desc-lineage (lin/calculate-lineage (:linearization-service this) descendant)]
            (add-to-entity-lineage-cache this descendant desc-lineage)))))
    ;; Update facts cache
    (add-to-entity-facts-cache this (:lh_object_uid fact) (:fact_uid fact))
    (add-to-entity-facts-cache this (:rh_object_uid fact) (:fact_uid fact))))

(defn create-cache-service-component [linearization-service]
  (->CacheServiceComponent (atom {}) linearization-service))

(defonce cache-service-comp (atom nil))

(defn start [linearization-service]
  (println "Starting Cache Service...")
  (let [service (create-cache-service-component linearization-service)]
    (reset! cache-service-comp service)
    service))

(defn stop []
  (println "Stopping Cache Service..."))

(comment

  ;; (def neo4j-instance io.relica.archivist.components/neo4j-conn)

  ;; neo4j-instance

  ;; (neo4j/execute-query neo4j-instance "foobar" {:foo "bar"})

  ;; (def service (start neo4j-instance))

  @cache-service-comp

  (io.relica.archivist.cache-service/all-descendants-of @cache-service-comp 1225)

  ;; (someshit service)

  ;; (stop)

  )
