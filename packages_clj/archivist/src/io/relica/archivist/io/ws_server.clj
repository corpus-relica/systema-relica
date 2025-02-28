(ns io.relica.archivist.io.ws-server
  (:require [clojure.tools.logging :as log]
            [io.relica.common.websocket.server :as ws]
            ;; require all ws-handlers
            [io.relica.archivist.io.ws-handlers]))


(defprotocol WebSocketOperations
  (broadcast! [this message])
  (send-to-session! [this session-id message])
  (get-active-sessions [this])
  (disconnect-all! [this])
  (get-xxx [this]))


(defrecord WebSocketComponent [args]
  WebSocketOperations
  (broadcast! [_ message]
    (broadcast! (:server args) message))

  (send-to-session! [_ client-id message]
    (ws/send! (:server args) client-id message))

  (get-active-sessions [_]
    (when-let [connected-uids (:connected-uids @(:state (:server args)))]
      (count (:any @connected-uids))))

  (disconnect-all! [_]
    (ws/stop! (:server args)))

  (get-xxx [_]
    (:gellish-base args)))

(defn create-event-handler [{:keys [gellish-base
                                    kind
                                    entity-retrieval
                                    general-search
                                    fact-service]}]
  (fn [msg]
    (io.relica.common.websocket.server/handle-ws-message (assoc msg
                                                                :gellish-base-s gellish-base
                                                                :kind-s kind
                                                                :entity-s entity-retrieval
                                                                :general-search-s general-search
                                                                :fact-s fact-service))))

(defn start [{:keys [port] :as args}]
  (tap> (str "!!! Starting WebSocket server on port" port))
  (let [server (ws/create-server {:port port
                                  :event-msg-handler (create-event-handler args)})
        component (->WebSocketComponent (assoc args :server server))]
    (ws/start! server)
    component))

(defn stop [component]
  (log/info "Stopping WebSocket server...")
  (when-let [server (:server component)]
    (ws/stop! server)))

;; (defstate ws-server
;;   :start (start (:xxx (mount.core/args)) (:port (mount.core/args)))
;;   :stop (stop ws-server))
