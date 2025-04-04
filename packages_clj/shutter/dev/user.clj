(ns user
  (:require [nrepl.server :as nrepl]
            [cider.nrepl :refer [cider-nrepl-handler]]
            [io.relica.shutter.core :as core]))

(defn start-dev []
  (println "Starting nREPL server on port 7889")
  (nrepl/start-server :port 7889
                     :bind "0.0.0.0"
                     :handler cider-nrepl-handler)
  (println "Starting Shutter service")
  (core/start))

(defn -main []
  (start-dev))
