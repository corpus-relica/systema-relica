(ns io.relica.archivist.io.ws-server
  (:require [mount.core :refer [defstate]]
            [clojure.tools.logging :as log]
            [clojure.core.async :as async :refer [<! go chan]]
            [io.relica.common.websocket.server :as ws]
            [io.relica.archivist.gellish-base-service :as gellish-base-service]))

(defprotocol WebSocketOperations
  (broadcast! [this message])
  (send-to-session! [this session-id message])
  (get-active-sessions [this])
  (disconnect-all! [this])
  (get-xxx [this]))


(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message :entities/resolve
  [{:keys [?data ?reply-fn xxx] :as msg}]
  (tap> {:event :websocket/handling-entities-resolve
         :data ?data
         :full-msg msg})
  (when ?reply-fn
    (let [result (gellish-base-service/get-entities xxx (:uids ?data))]
      (tap> {:event :websocket/sending-resolve-response
             :result result})
      (?reply-fn {:resolved true :data result}))))

(defrecord WebSocketComponent [xxx server]
  WebSocketOperations
  (broadcast! [_ message]
    (broadcast! server message))

  (send-to-session! [_ client-id message]
    (ws/send! server client-id message))

  (get-active-sessions [_]
    (when-let [connected-uids (:connected-uids @(:state server))]
      (count (:any @connected-uids))))

  (disconnect-all! [_]
    (ws/stop! server))

  (get-xxx [_]
    xxx))

(defn create-event-handler [xxx]
  (fn [msg]
    (io.relica.common.websocket.server/handle-ws-message (assoc msg :xxx xxx))))

(defn start [xxx port]
  (tap> (str "!!! Starting WebSocket server on port" port))
  (let [server (ws/create-server {:port port
                                 :event-msg-handler (create-event-handler xxx)})
        component (->WebSocketComponent xxx server)]
    (ws/start! server)
    component))

(defn stop [component]
  (log/info "Stopping WebSocket server...")
  (when-let [server (:server component)]
    (ws/stop! server)))

;; (defstate ws-server
;;   :start (start (:xxx (mount.core/args)) (:port (mount.core/args)))
;;   :stop (stop ws-server))
