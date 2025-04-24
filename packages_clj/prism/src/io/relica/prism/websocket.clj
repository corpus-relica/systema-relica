(ns io.relica.prism.websocket
  (:require [io.relica.common.websocket.server :as ws-server]
            [io.relica.prism.config :as config]
            [io.relica.prism.setup :as setup]
            [clojure.core.async :refer [go <!]]
            [taoensso.timbre :as log]))

;; Store the WebSocket server instance
(defonce server-instance (atom nil))

;; Handler for WebSocket messages
;; (defn handle-ws-message [event-msg]
;;   (let [{:keys [id ?data client-id ?reply-fn]} event-msg]
;;     (log/debug "Received WebSocket message:" id "from client:" client-id)

;;     (case id
;;       ;; Handle heartbeat messages




;;       ;; :setup/process-stage
;;       ;; (let [current-state (setup/get-setup-state)
;;       ;;       current-stage (:stage current-state)]
;;       ;;   (if (= current-stage :user-setup)
;;       ;;     (?reply-fn {:success false
;;       ;;                 :message "User setup stage requires admin credentials"
;;       ;;                 :requiresUserInput true})
;;       ;;     (do
;;       ;;       (setup/handle-setup-stage!)
;;       ;;       (?reply-fn {:success true
;;       ;;                   :message "Stage processed"
;;       ;;                   :state (setup/get-setup-state)}))))

;;       ;; Ping/Heartbeat handling
;;       :ping
;;       (do
;;         (log/debug "Received ping from client:" client-id)
;;         (?reply-fn {:success true
;;                     :timestamp (System/currentTimeMillis)}))

;;       ;; Default case - unknown message type
;;       (do
;;         (log/warn "Unknown message type:" id)
;;         (?reply-fn {:error (str "Unknown message type: " id)})))))

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
  (ws-server/broadcast! @server-instance
                        {:id "server"
                         :type :setup/update
                         :payload message}))
