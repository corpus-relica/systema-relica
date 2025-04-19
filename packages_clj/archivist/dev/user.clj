(ns user
  (:require [nrepl.server :as nrepl]
            [cider.nrepl :refer [cider-nrepl-handler]]
            [io.relica.archivist.core :as core]))

(defn start-dev []
  (println "Starting nREPL server on port 7894")
  (nrepl/start-server :port 7894
                     :bind "0.0.0.0"
                     :handler cider-nrepl-handler)
  (println "Starting Archivist service")
  (core/start-app))

(defn -main []
  (start-dev))
