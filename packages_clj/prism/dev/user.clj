(ns user
  (:require [nrepl.server :as nrepl]
            [cider.nrepl :refer [cider-nrepl-handler]]
            [io.relica.prism.core :as core]))

(defn start-dev []
  (println "Starting nREPL server on port 7893")
  (nrepl/start-server :port 7893
                     :bind "0.0.0.0"
                     :handler cider-nrepl-handler)
  (println "Starting Prism service")
  (core/-main))

(defn -main []
  (start-dev))
