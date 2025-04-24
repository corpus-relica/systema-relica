(ns io.relica.common.websocket.server-component
  (:require [io.relica.common.websocket.server :as ws-server]
            [clojure.tools.logging :as log]))

;; Define protocol for websocket operations
(defprotocol WebSocketOperations
  (broadcast! [this message])
  (send-to-client! [this client-id message])
  (get-active-clients [this])
  (disconnect-all! [this]))

;; Component implementation
(defrecord WebSocketComponent [config server state]
  WebSocketOperations

  (broadcast! [_ message]
    (when-let [server @server]
      (ws-server/broadcast! server message)))

  (send-to-client! [_ client-id message]
    (when-let [server @server]
      (ws-server/send! server client-id message)))

  (get-active-clients [_]
    (when-let [connected-uids (:connected-uids @(:state @server))]
      (:any @connected-uids)))

  (disconnect-all! [this]
    (when-let [server @server]
      (ws-server/stop! server))))

;; Factory function to create event handler with injected dependencies
(defn create-event-handler [dependencies]
  (fn [msg]
    (ws-server/handle-ws-message (merge msg dependencies))))

;; Lifecycle functions
(defn start
  "Start a WebSocketComponent with the given configuration and dependencies"
  [{:keys [port] :as config} dependencies]
  (log/info "Starting WebSocket server on port" port)
  (let [state-atom (atom {:clients {}
                          :last-status {:status "OK"
                                        :timestamp (System/currentTimeMillis)
                                        :active-users 0}})
        server-atom (atom nil)
        event-handler (create-event-handler
                        (assoc dependencies :state state-atom))
        component (->WebSocketComponent config server-atom state-atom)]

    ;; Create and start the server
    (let [server (ws-server/create-server
                   {:port port :event-msg-handler event-handler})]
      (reset! server-atom server)
      (ws-server/start! server))

    ;; Return the component
    component))

(defn stop [component]
  (log/info "Stopping WebSocket server...")
  (disconnect-all! component))
