(ns user
  (:require [nrepl.server :as nrepl]
            [cider.nrepl :refer [cider-nrepl-handler]]
            [io.relica.aperture.core :as core]))

(defn start-dev []
  (println "Starting nREPL server on port 7892")
  (nrepl/start-server :port 7892
                     :bind "0.0.0.0"
                     :handler cider-nrepl-handler)
  (println "Starting Aperture service")
  (core/-main))

(defn -main []
  (start-dev))
