(ns io.relica.aperture.services.ws-service
  (:require [mount.core :refer [defstate]]
            [io.relica.aperture.io.ws-server :as ws-server]
            [io.relica.aperture.config :refer [app-config]]
            [clojure.tools.logging :as log]))


;; WebSocket Server Component
(defstate ws-service
  :start (do
           (log/info "Starting Aperture WebSocket server...")
           (let [port (get-in app-config [:ws-server :port])]
             (ws-server/start! port)))
  :stop (do
          (log/info "Stopping Aperture WebSocket server...")
          (when ws-service
            (ws-server/stop! ws-service))))
