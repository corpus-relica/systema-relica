(ns io.relica.aperture.core
  (:require
   [clojure.tools.logging :as log]
   [io.relica.aperture.components :as components]
   ;; Require handler namespace to load defmethods
   [io.relica.aperture.io.ws-handlers]
   ;; Require component namespaces to ensure they are loaded by mount
   [io.relica.aperture.io.ws-server]
   [io.relica.aperture.services.environment-service])
  (:gen-class))

(defn -main [& args]
  (log/info "Aperture starting...")
  ;; Add hook to stop mount cleanly on shutdown
  (.addShutdownHook (Runtime/getRuntime) (Thread. #(components/stop-system)))
  (components/start-system)
  (log/info "Aperture started successfully."))

;; REPL helpers
(comment
  (components/start-system)

  (components/stop-system)
  (components/restart-system)

  ;; Check state
  components/websocket-server
  components/environment-service
  )
