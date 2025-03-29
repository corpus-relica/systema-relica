(ns io.relica.clarity.components
  (:require [mount.core :refer [defstate]]
            [io.relica.clarity.config :refer [app-config]]
            [io.relica.clarity.io.ws-server :as ws-server]
            [io.relica.clarity.services.semantic-model-service :as semantic-model-service]
            [clojure.tools.logging :as log]))

;; WEBSOCKET SERVER

(defstate ws-server-component
  :start (let [{:keys [port]} (:ws-server app-config)]
           (log/info "Starting WebSocket server on port" port "...")
           (ws-server/start! port))
  :stop (do
          (log/info "Stopping WebSocket server...")
          (ws-server/stop! ws-server-component)))

;; SEMANTIC MODEL SERVICE

(defstate semantic-model-service-component
  :start (do
           (log/info "Starting Semantic Model service...")
           (semantic-model-service/start))
  :stop (do
          (log/info "Stopping Semantic Model service...")
          (semantic-model-service/stop)))

;; Add additional services as needed

;; SYSTEM LIFECYCLE

(defn start-system []
  (log/info "Starting Clarity system...")
  (mount.core/start))

(defn stop-system []
  (log/info "Stopping Clarity system...")
  (mount.core/stop))
