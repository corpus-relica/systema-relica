(ns io.relica.aperture.core
  (:require
   [mount.core :as mount]
   [clojure.tools.logging :as log]
   [io.relica.aperture.io.ws-handlers]
   ;; Require component namespaces to ensure they are loaded by mount
   [io.relica.aperture.services.ws-service])
   ;; [io.relica.aperture.io.ws-server
  (:gen-class))

(defn -main [& args]
  (log/info "Aperture starting...")
  ;; Add hook to stop mount cleanly on shutdown
  (.addShutdownHook (Runtime/getRuntime) (Thread. #(mount/stop)))
  (mount/start)
  (log/info "Aperture started successfully."))

;; REPL helpers
(comment
  (mount/start)

  (mount/stop))
