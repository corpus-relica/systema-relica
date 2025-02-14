(ns io.relica.archivist.db.redis
  (:require [mount.core :refer [defstate]])
  (:import (redis.clients.jedis JedisPool JedisPoolConfig)))

(defprotocol RedisOperations
  (get-value [this key])
  (set-value [this key value])
  (set-value-with-ttl [this key value ttl])
  (delete-value [this key])
  (get-pool [this]))

(defrecord RedisComponent [pool]
  RedisOperations
  (get-value [_ key]
    ;; Get value from Redis
    )

  (set-value [_ key value]
    ;; Set value in Redis
    )

  (set-value-with-ttl [_ key value ttl]
    ;; Set value with TTL
    )

  (delete-value [_ key]
    ;; Delete value from Redis
    )

  (get-pool [_]
    pool))

(defn create-redis-component
  ([] (create-redis-component "localhost" 6379))
  ([host port]
   (let [pool-config (doto (JedisPoolConfig.)
                      (.setMaxTotal 10)
                      (.setMaxIdle 5)
                      (.setMinIdle 1))
         pool (JedisPool. pool-config host port)]
     (->RedisComponent pool))))

(defonce redis-comp (atom nil))

(defn start
  ([] (start "localhost" 6379))
  ([host port]
   (println "connecting to Redis connection pool...")
   (let [redis-component (create-redis-component host port)]
     (reset! redis-comp redis-component)
     redis-component)))

(defn stop []
  (println "disconnecting from Redis connection pool...")
  (.close (get-pool @redis-comp)))

(comment
  (start)

  (get-pool @redis-comp)

  (stop)

)
