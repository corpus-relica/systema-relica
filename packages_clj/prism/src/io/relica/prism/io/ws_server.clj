(ns io.relica.prism.io.ws-server
  (:require [io.relica.common.websocket.server :as ws-server]
            [io.relica.prism.config :as config]
            [taoensso.timbre :as log]))

;; Store the WebSocket server instance
(defonce server-instance (atom nil))

;; Start the WebSocket server
(defn start-server []
  (when-not @server-instance
    (log/info "Starting WebSocket server on port" (config/ws-server-port))
    (let [server (ws-server/create-server
                  {:port (config/ws-server-port)
                   :path "/ws"
                   :event-msg-handler ws-server/handle-ws-message})]
      (ws-server/start! server)
      (reset! server-instance server)
      (log/info "WebSocket server started")
      server)))

;; Stop the WebSocket server
(defn stop-server []
  (when-let [server @server-instance]
    (log/info "Stopping WebSocket server")
    (ws-server/stop! server)
    (reset! server-instance nil)
    (log/info "WebSocket server stopped")))

;; Broadcast a message to all connected clients
(defn broadcast-setup-update
  [message]
  (ws-server/broadcast! @server-instance message))

(defn broadcast! [message level]
  (when-let [server @server-instance]
    (let [notification {:message message
                        :level level
                        :timestamp (System/currentTimeMillis)}]
      ;; (tap> {:event :app/sending-notification
      ;;        :message message
      ;;        :level level})
      (ws-server/broadcast! server message))))
