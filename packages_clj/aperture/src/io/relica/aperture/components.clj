(ns io.relica.aperture.components
  (:require [mount.core :as mount :refer [defstate]]
            [io.relica.aperture.io.ws-server :as ws-server]
            [io.relica.aperture.services.environment-service :as env-service]
            [io.relica.aperture.io.ws-handlers :as ws-handlers]
            [io.relica.aperture.config :as config]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.aperture.io.client-instances :refer [archivist-client]]
            [clojure.tools.logging :as log]))

;; WebSocket Server Component
(defstate websocket-server
  :start (do
           (log/info "Starting Aperture WebSocket server...")
           (let [port (config/get-ws-port)]
             (ws-server/start! port)))
  :stop (do
          (log/info "Stopping Aperture WebSocket server...")
          (when websocket-server
            (ws-server/stop! websocket-server))))

;; Environment Service Component
(defstate environment-service
  :start (do
           (log/info "Starting Environment Service...")
           ;; Create the environment service with the archivist client
           (let [service (env-service/create-environment-service archivist-client)]
             ;; Register the service with the handlers
             (ws-handlers/set-environment-service! service)
             ;; Return the service instance
             service))
  :stop (do
          (log/info "Stopping Environment Service...")
          ;; Reset the handlers' reference to the service
          (ws-handlers/set-environment-service! nil)))

;; --- System Lifecycle ---
(defn start-system []
  (log/info "Starting Aperture system components...")
  (mount/start))

(defn stop-system []
  (log/info "Stopping Aperture system components...")
  (mount/stop))

(defn restart-system []
  (log/info "Restarting Aperture system components...")
  (mount/stop)
  (mount/start))

(comment
  ;; REPL commands for managing the system
  (start-system)
  (stop-system)
  (restart-system)
  )
