(ns user
  (:require [nrepl.server :as nrepl]
            [cider.nrepl :refer [cider-nrepl-handler]]
            [rlc.clarity.core :as core]))

(defonce nrepl-server (atom nil))

(defn start-nrepl []
  (reset! nrepl-server
          (nrepl/start-server
           :bind "0.0.0.0"
           :port 7888
           :handler cider-nrepl-handler))
  (println "nREPL server started on port 7888"))

(defn stop-nrepl []
  (when @nrepl-server
    (nrepl/stop-server @nrepl-server)
    (reset! nrepl-server nil)
    (println "nREPL server stopped")))

(defn -main [& args]
  (println "Starting development environment...")
  (start-nrepl)
  (core/-main args)
  (println "Development environment ready!"))

;; Dev time helpers
(comment
  (start-nrepl)
  (stop-nrepl)
  (core/restart))
