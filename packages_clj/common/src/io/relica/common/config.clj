(ns io.relica.common.config
  (:require [mount.core :refer [defstate]]
            [clojure.tools.logging :as log]))

(def config
  {:redis {:host     (or (System/getenv "REDIS_HOST") "localhost")
           :port     (Integer/parseInt (or (System/getenv "REDIS_PORT") "6379"))
           :user     (or (System/getenv "REDIS_USER") "default")        ;; Optional user
           :password (or (System/getenv "REDIS_PASSWORD") "redis")}   ;; Optional password
            ;; Add other common configs as needed
   })

(defn get-config [& keys]
  (get-in config keys))
