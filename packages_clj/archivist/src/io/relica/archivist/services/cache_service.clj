(ns io.relica.archivist.services.cache-service
  (:require [mount.core :refer [defstate]]
            [taoensso.carmine :as car]
            [clojure.tools.logging :as log]
            [clojure.string :as str]
            [io.relica.archivist.services.linearization-service :as lin]
            [io.relica.archivist.config :refer [db-config]]))

(def redis-url (str "redis://" (get-in db-config [:redis :host]) ":" (get-in db-config [:redis :port])))
(println "Redis URL:" redis-url)
(println "Redis user:" (get-in db-config [:redis :user]))
(println "Redis password:" (get-in db-config [:redis :password]))

;; Redis connection configuration
(def redis-conn {:pool {}
                 :spec {:uri redis-url
                        :username (get-in db-config [:redis :user])
                        :password (get-in db-config [:redis :password])}})

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

(defrecord CacheServiceComponent [descendants-cache entity-prompt-cache linearization-service]
  CacheServiceOperations

  ;; Facts
  (update-facts-involving-entity [this uid]
    (try
      (let [facts-key (str "rlc:db:YYYY:entity:" uid ":facts")]
        ;; Implementation will be added when Neo4j query service is available
        nil)
      (catch Exception e
        (log/error e "Failed to update facts for entity" uid))))

  (remove-from-facts-involving-entity [this uid fact-uid]
    (try
      (let [facts-key (str "rlc:db:YYYY:entity:" uid ":facts")]
        (wcar* (car/srem facts-key (str fact-uid))))
      (catch Exception e
        (log/error e "Failed to remove fact" fact-uid "from entity" uid))))

  (all-facts-involving-entity [this uid]
    (try
      (let [facts-key (str "rlc:db:YYYY:entity:" uid ":facts")
            facts (wcar* (car/smembers facts-key))]
        (if (seq facts)
          (mapv #(Integer/parseInt %) facts)
          []))
      (catch Exception e
        (log/error e "Failed to get facts for entity" uid)
        [])))

  ;; Descendants
  (update-descendants-in-db [this node-to-descendants]
    (doseq [[node-uid descendants-set] node-to-descendants]
      (try
        (let [new-descendants (map str (vec descendants-set))
              ns (str "rlc:db:YYYY:entity:" node-uid ":descendants")]
          (doseq [descendant new-descendants]
            (when (zero? (wcar* (car/sismember ns descendant)))
              (wcar* (car/sadd ns descendant))
              (log/debug "Added descendant" descendant "to" node-uid))))
        (catch Exception e
          (log/error e "Failed to update descendants for node" node-uid)))))

  (all-descendants-of [this uid]
    (try
      (let [cached-descendants (get @descendants-cache uid)]
        ;; (if cached-descendants
        ;;   cached-descendants
          (let [descendants-key (str "rlc:db:YYYY:entity:" uid ":descendants")
                descendants (wcar* (car/smembers descendants-key))
                parsed-descendants (mapv #(Integer/parseInt %) descendants)]
            (when (seq parsed-descendants)
              (swap! descendants-cache assoc uid parsed-descendants))
            parsed-descendants))
        ;;)
      (catch Exception e
        (tap> {:error e
              :message (str "Failed to get descendants for" uid)})
        [])))

  (update-descendants-cache [this uid]
    (try
      (let [descendants-key (str "rlc:db:YYYY:entity:" uid ":descendants")
            descendants (wcar* (car/smembers descendants-key))
            parsed-descendants (mapv #(Integer/parseInt %) descendants)]
        (swap! descendants-cache assoc uid parsed-descendants)
        parsed-descendants)
      (catch Exception e
        (log/error e "Failed to update descendants cache for" uid)
        [])))

  (clear-descendants [this]
    (reset! descendants-cache {}))

  ;; Entity Prompts
  (prompt-of [this uid]
    (try
      (get @entity-prompt-cache uid)
      (catch Exception e
        (log/error e "Failed to get prompt for entity" uid)
        nil)))

  (set-prompt-of [this uid prompt]
    (try
      (swap! entity-prompt-cache assoc uid prompt)
      (catch Exception e
        (log/error e "Failed to set prompt for entity" uid))))

  (lineage-of [this uid]
    (try
      (let [lineage-key (str "rlc:db:YYYY:entity:" uid ":lineage")
            lineage (wcar* (car/lrange lineage-key 0 -1))
            parsed-lineage (mapv #(Integer/parseInt %) lineage)]
        parsed-lineage)
      (catch Exception e
        (log/error e "Failed to get lineage for entity" uid)
        [])))

  ;; async lineageOf(uid: number) {
  ;;   try {
  ;;     const lineageKey = `rlc:db:YYYY:entity:${uid}:lineage`;
  ;;     let lineage: any[] = await this.redisClient.lrange(lineageKey, 0, -1);
  ;;     lineage = lineage.map((uid) => parseInt(uid, 10));
  ;;     return lineage;
  ;;   } catch (e) {
  ;;     console.log(e);

  ;;     return [];
  ;;   }
  ;; }

  (clear-entity-lineage-cache [this uid]
    (try
      (let [lineage-key (str "rlc:db:YYYY:entity:" uid ":lineage")]
        (wcar* (car/del lineage-key)))
      (catch Exception e
        (log/error e "Failed to clear lineage cache for entity" uid))))

  (clear-entity-lineage-cache-complete [this]
    (try
      (let [lineage-keys (wcar* (car/keys "rlc:db:YYYY:entity:*:lineage"))]
        (doseq [lineage-key lineage-keys]
          (wcar* (car/del lineage-key))))
      (catch Exception e
        (log/error e "Failed to clear all lineage caches"))))

  (add-to-entity-lineage-cache [this entity-uid lineage]
    (try
      (let [lineage-key (str "rlc:db:YYYY:entity:" entity-uid ":lineage")]
        (doseq [ancestor lineage]
          (wcar* (car/sadd lineage-key (str ancestor)))))
      (catch Exception e
        (log/error e "Failed to add to lineage cache for entity" entity-uid))))

  (get-min-free-entity-uid [this]
    (try
      (let [min-free-entity-uid-key "rlc:db:YYYY:min-free-entity-uid"]
        (wcar* (car/get min-free-entity-uid-key)))
      (catch Exception e
        (log/error e "Failed to get min free entity uid"))))

  (set-min-free-entity-uid [this uid]
    (try
      (let [min-free-entity-uid-key "rlc:db:YYYY:min-free-entity-uid"]
        (wcar* (car/set min-free-entity-uid-key uid)))
      (catch Exception e
        (log/error e "Failed to set min free entity uid"))))

  (get-min-free-fact-uid [this]
    (try
      (let [min-free-fact-uid-key "rlc:db:YYYY:min-free-fact-uid"]
        (wcar* (car/get min-free-fact-uid-key)))
      (catch Exception e
        (log/error e "Failed to get min free fact uid"))))

  (set-min-free-fact-uid [this uid]
    (try
      (let [min-free-fact-uid-key "rlc:db:YYYY:min-free-fact-uid"]
        (wcar* (car/set min-free-fact-uid-key uid)))
      (catch Exception e
        (log/error e "Failed to set min free fact uid"))))

  (clear-entity-facts-cache-complete [this]
    (try
      (let [entity-facts-keys (wcar* (car/keys "rlc:db:YYYY:entity:*:facts"))]
        (doseq [entity-facts-key entity-facts-keys]
          (wcar* (car/del entity-facts-key))))
      (catch Exception e
        (log/error e "Failed to clear all entity facts caches"))))

  (add-to-entity-facts-cache [this entity-uid fact-uid]
    (try
      (let [entity-facts-key (str "rlc:db:YYYY:entity:" entity-uid ":facts")]
        (wcar* (car/sadd entity-facts-key (str fact-uid))))
      (catch Exception e
        (log/error e "Failed to add to entity facts cache for entity" entity-uid))))

  (remove-entity-from-lineage-descendants [this euid luid]
    (try
      (let [lineage-descendants-key (str "rlc:db:YYYY:entity:" luid ":lineage-descendants")]
        (wcar* (car/srem lineage-descendants-key (str euid))))
      (catch Exception e
        (log/error e "Failed to remove entity from lineage descendants for entity" luid))))

  (append-fact [this fact]
    (try
      (when (or (= (:rel_type_uid fact) 1146)
                (= (:rel_type_uid fact) 1726))
        (let [lineage (lin/calculate-lineage linearization-service (:lh_object_uid fact))
              descendants (all-descendants-of this (:lh_object_uid fact))]
          (doseq [uid lineage]
            (add-to-entity-lineage-cache this uid lineage))
          (doseq [uid descendants]
            (add-descendant-to this uid (:rh_object_uid fact)))))
      (catch Exception e
        (log/error e "Failed to append fact" fact))))

  (remove-entity [this uid]
    (try
      (let [descendants-key (str "rlc:db:YYYY:entity:" uid ":descendants")
            facts-key (str "rlc:db:YYYY:entity:" uid ":facts")]
        (wcar* 
          (car/del descendants-key)
          (car/del facts-key))
        (swap! descendants-cache dissoc uid)
        (swap! entity-prompt-cache dissoc uid))
      (catch Exception e
        (log/error e "Failed to remove entity" uid)))))

(defn create-cache-service-component [linearization-service]
  (->CacheServiceComponent (atom {}) (atom {}) linearization-service))

(defonce cache-service-comp (atom nil))

(defn start [linearization-service]
  (log/info "Starting Cache Service...")
  (let [service (create-cache-service-component linearization-service)]
    (reset! cache-service-comp service)
    service))

(defn stop []
  (log/info "Stopping Cache Service...")
  (when-let [service @cache-service-comp]
    (clear-descendants service)
    (reset! cache-service-comp nil)))
