(ns io.relica.common.services.cache-service
  (:require [mount.core :as mount :refer [defstate]]
            [taoensso.carmine :as car :refer [wcar]]
            [clojure.tools.logging :as log]
            [io.relica.common.config :as common-config]))

(def redis-url (str "redis://" (common-config/get-config :redis :host) ":" (common-config/get-config :redis :port)))

(defonce my-conn-pool (car/connection-pool {})) ; Create a new stateful pool
(def     my-conn-spec {:uri redis-url
                       :username (common-config/get-config :redis :user)
                       :password (common-config/get-config :redis :password)})
(def     my-wcar-opts {:pool my-conn-pool
                       :spec my-conn-spec})


(println "Redis URL:" redis-url)
(println "Redis user:" (common-config/get-config :redis :user))
(println "Redis password:" (common-config/get-config :redis :password))

(println "AM I CONNECTED ?????????" (wcar my-wcar-opts (car/ping)))


;; (def redis-conn {:pool my-conn-pool
;;                  :spec {:uri redis-url
;;                         :username (common-config/get-config :redis :user)
;;                         :password (common-config/get-config :redis :password)}})

(defmacro wcar* [& body] `(car/wcar my-wcar-opts ~@body))


(defprotocol CacheServiceOperations
  (update-facts-involving-entity [_ uid])
  (remove-from-facts-involving-entity [_ uid fact-uid])
  (all-facts-involving-entity [_ uid])

  (update-descendants-in-db [_ node-to-descendants])
  (all-descendants-of [_ uid])
  (update-descendants-cache [_ uid])
  (clear-descendants [_])
  (add-descendant-to [_ uid descendant])
  (add-descendants-to [_ uid descendants])
  (remove-descendant-from [_ uid descendant])
  (remove-descendants-from [_ uid descendants])

  (prompt-of [_ uid])
  (set-prompt-of [_ uid prompt])

  (lineage-of [_ uid])
  (clear-entity-lineage-cache [_ uid])
  (clear-entity-lineage-cache-complete [_])
  (add-to-entity-lineage-cache [_ entity-uid lineage])

  (get-min-free-entity-uid [_])
  (set-min-free-entity-uid [_ uid])
  (get-min-free-fact-uid [_])
  (set-min-free-fact-uid [_ uid])

  (clear-entity-facts-cache-complete [_])
  (add-to-entity-facts-cache [_ entity-uid fact-uid])

  (remove-entity-from-lineage-descendants [_ euid luid])
  (remove-entity [_ uid]))

(defrecord CacheServiceComponent [descendants-cache entity-prompt-cache]
  CacheServiceOperations

  ;; Facts
  (update-facts-involving-entity [_ uid]
    (try
      (let [entity-key (str "rlc:db:YYYY:entity:" uid ":facts")]
        ;; Implementation will be added when Neo4j query service is available
        nil)
      (catch Exception e
        (log/error e "Failed to update facts for entity" uid))))

  (remove-from-facts-involving-entity [_ uid fact-uid]
    (try
      (let [entity-key (str "rlc:db:YYYY:entity:" uid ":facts")]
        (wcar* (car/srem entity-key (str fact-uid))))
      (catch Exception e
        (log/error e "Failed to remove fact" fact-uid "from entity" uid))))

  (all-facts-involving-entity [_ uid]
    (try
      (let [entity-key (str "rlc:db:YYYY:entity:" uid ":facts")
            facts (wcar* (car/smembers entity-key))]
        (if (seq facts)
          (mapv #(Integer/parseInt %) facts)
          []))
      (catch Exception e
        (log/error e "Failed to get facts for entity" uid)
        [])))

  ;; Descendants
  ;; (update-descendants-in-db [_ node-to-descendants]
  ;;   (doseq [[node-uid descendants-set] node-to-descendants]
  ;;     (try
  ;;       (let [new-descendants (map str (vec descendants-set))
  ;;             ns (str "rlc:db:YYYY:entity:" node-uid ":descendants")]
  ;;         (doseq [descendant new-descendants]
  ;;           (when (zero? (wcar* (car/sismember ns descendant)))
  ;;             (wcar* (car/sadd ns descendant))
  ;;             (log/debug "Added descendant" descendant "to" node-uid))))
  ;;       (catch Exception e
  ;;         (log/error e "Failed to update descendants for node" node-uid)))))
  (add-descendant-to [_ uid descendant]
    (try
      (let [descendants-key (str "rlc:db:YYYY:entity:" uid ":descendants")]
        (wcar* (car/sadd descendants-key (str descendant))))
      (catch Exception e
        (log/error e "Failed to add descendant" descendant "to entity" uid))))

  (all-descendants-of [_ uid]
    (try
      (let [descendants-key (str "rlc:db:YYYY:entity:" uid ":descendants")
            descendants (wcar* (car/smembers descendants-key))
            parsed-descendants (mapv #(Integer/parseInt %) descendants)]
        (when (seq parsed-descendants)
          (swap! descendants-cache assoc uid parsed-descendants))
        parsed-descendants)
      (catch Exception e
        (tap> {:error e
               :message (str "Failed to get descendants for" uid)})
        [])))

  (update-descendants-cache [_ uid]
    (try
      (let [descendants-key (str "rlc:db:YYYY:entity:" uid ":descendants")
            descendants (wcar* (car/smembers descendants-key))
            parsed-descendants (mapv #(Integer/parseInt %) descendants)]
        (swap! descendants-cache assoc uid parsed-descendants)
        parsed-descendants)
      (catch Exception e
        (log/error e "Failed to update descendants cache for" uid)
        [])))

  (clear-descendants [_]
    (reset! descendants-cache {}))

  ;; Entity Prompts
  (prompt-of [_ uid]
    (try
      (get @entity-prompt-cache uid)
      (catch Exception e
        (log/error e "Failed to get prompt for entity" uid)
        nil)))

  (set-prompt-of [_ uid prompt]
    (try
      (swap! entity-prompt-cache assoc uid prompt)
      (catch Exception e
        (log/error e "Failed to set prompt for entity" uid))))

  (lineage-of [_ uid]
    (try
      (let [lineage-key (str "rlc:db:YYYY:entity:" uid ":lineage")
            lineage (wcar* (car/lrange lineage-key 0 -1))
            parsed-lineage (mapv #(Integer/parseInt %) lineage)]
        parsed-lineage)
      (catch Exception e
        (log/error e "Failed to get lineage for entity" uid)
        [])))

  (clear-entity-lineage-cache [_ uid]
    (try
      (let [lineage-key (str "rlc:db:YYYY:entity:" uid ":lineage")]
        (wcar* (car/del lineage-key)))
      (catch Exception e
        (log/error e "Failed to clear lineage cache for entity" uid))))

  (clear-entity-lineage-cache-complete [_]
    (try
      (let [lineage-keys (wcar* (car/keys "rlc:db:YYYY:entity:*:lineage"))]
        (doseq [lineage-key lineage-keys]
          (wcar* (car/del lineage-key))))
      (catch Exception e
        (log/error e "Failed to clear all lineage caches"))))

  (add-to-entity-lineage-cache [_ entity-uid lineage]
    (try
      (let [lineage-key (str "rlc:db:YYYY:entity:" entity-uid ":lineage")
            string-lineage (mapv str lineage)]
        (wcar* (car/del lineage-key))
        (when (seq string-lineage)
          (wcar* (apply car/rpush lineage-key string-lineage))))
        (catch Exception e
          (log/error e "Failed to add to lineage cache for entity" entity-uid))))

  (get-min-free-entity-uid [_]
    (try
      (let [min-free-entity-uid-key "rlc:db:YYYY:min-free-entity-uid"]
        (wcar* (car/get min-free-entity-uid-key)))
      (catch Exception e
        (log/error e "Failed to get min free entity uid"))))

  (set-min-free-entity-uid [_ uid]
    (try
      (let [min-free-entity-uid-key "rlc:db:YYYY:min-free-entity-uid"]
        (wcar* (car/set min-free-entity-uid-key uid)))
      (catch Exception e
        (log/error e "Failed to set min free entity uid"))))

  (get-min-free-fact-uid [_]
    (try
      (let [min-free-fact-uid-key "rlc:db:YYYY:min-free-fact-uid"]
        (wcar* (car/get min-free-fact-uid-key)))
      (catch Exception e
        (log/error e "Failed to get min free fact uid"))))

  (set-min-free-fact-uid [_ uid]
    (try
      (let [min-free-fact-uid-key "rlc:db:YYYY:min-free-fact-uid"]
        (wcar* (car/set min-free-fact-uid-key uid)))
      (catch Exception e
        (log/error e "Failed to set min free fact uid"))))

  (clear-entity-facts-cache-complete [_]
    (try
      (let [entity-facts-keys (wcar* (car/keys "rlc:db:YYYY:entity:*:facts"))]
        (doseq [entity-facts-key entity-facts-keys]
          (wcar* (car/del entity-facts-key))))
      (catch Exception e
        (log/error e "Failed to clear all entity facts caches"))))

  (add-to-entity-facts-cache [_ entity-uid fact-uid]
    (try
      (let [entity-facts-key (str "rlc:db:YYYY:entity:" entity-uid ":facts")
            res (wcar* (car/sadd entity-facts-key (str fact-uid)))]
        (println (str "add to entity facts cache:" entity-facts-key " fact-uid:" fact-uid))
        (println "res:" res))
      (catch Exception e
        (println e "Failed to add to entity facts cache for entity" entity-uid))))

  (remove-entity-from-lineage-descendants [_ euid luid]
    (try
      (let [lineage-descendants-key (str "rlc:db:YYYY:entity:" luid ":lineage-descendants")]
        (wcar* (car/srem lineage-descendants-key (str euid))))
      (catch Exception e
        (log/error e "Failed to remove entity from lineage descendants for entity" luid))))

  (remove-entity [_ uid]
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

(defn create-cache-service-component []
  (->CacheServiceComponent (atom {}) (atom {})))

(defonce cache-service-comp (atom nil))

(defn start [_]
  (log/info "Starting Common Cache Service...")
  ;; Ensure common config is started first if using mount
  (mount/start #'common-config/config)
  (let [service (create-cache-service-component)]
    (reset! cache-service-comp service)
    service))

(defn stop []
  (log/info "Stopping Common Cache Service...")
  (when-let [service @cache-service-comp]
    (clear-descendants service) ; Assumes clear-descendants is still relevant
    (reset! cache-service-comp nil))
  ;; Stop common config if needed
  (mount/stop #'common-config/config))

;; CACHE SERVICE

(defstate cache-service
  :start (do
           (println "Starting Cache service...")
           (start nil))
  :stop (do
          (println "Stopping Cache service...")
          (stop)))
