(ns io.relica.clarity.io.ws-server
  (:require [io.relica.common.websocket.server :as ws-server]
            [clojure.core.async :as async :refer [go go-loop <! >! timeout chan]]
            [clojure.tools.logging :as log]))

;; Application state (would typically be in a database or other persistence)
(def app-state (atom {:clients {}
                      :last-status {:status "OK"
                                   :timestamp (System/currentTimeMillis)
                                   :active-users 0}
                      :files {}}))

(defmethod ws-server/handle-ws-message
  :app/request-status
  [{:keys [uid ?reply-fn] :as msg}]
  (tap> {:event :app/status-requested
         :client-id uid})

  ;; Update client last active time
  (swap! app-state assoc-in [:clients uid :last-active] (System/currentTimeMillis))

  ;; Send current status
  (when ?reply-fn
    (?reply-fn (get @app-state :last-status))))

(defmethod ws-server/handle-ws-message
  :app/heartbeat
  [{:keys [uid ?data] :as msg}]
  (tap> {:event :app/heartbeat-received
         :client-id uid
         :timestamp (:timestamp ?data)})

  ;; Update client last active time
  (swap! app-state assoc-in [:clients uid :last-active] (System/currentTimeMillis)))

;; Connection lifecycle handlers
(defmethod ws-server/handle-ws-message
  :chsk/uidport-open
  [{:keys [uid] :as msg}]
  ;; Add client to connected clients
  (swap! app-state assoc-in [:clients uid]
         {:connected-at (System/currentTimeMillis)
          :last-active (System/currentTimeMillis)})

  ;; Update active users count
  (swap! app-state assoc-in [:last-status :active-users]
         (count (:clients @app-state)))

  (tap> {:event :app/client-connected
         :client-id uid
         :active-users (get-in @app-state [:last-status :active-users])}))

(defmethod ws-server/handle-ws-message
  :chsk/uidport-close
  [{:keys [uid] :as msg}]
  ;; Remove client from connected clients
  (swap! app-state update :clients dissoc uid)

  ;; Update active users count
  (swap! app-state assoc-in [:last-status :active-users]
         (count (:clients @app-state)))

  (tap> {:event :app/client-disconnected
         :client-id uid
         :active-users (get-in @app-state [:last-status :active-users])}))

;; Server functions
(defn start! [port]
  (tap> {:event :app/starting-server
         :port port})

  (let [server (ws-server/create-server {:port port
                                         :event-msg-handler ws-server/handle-ws-message})]
    ;; Save server reference in app state
    (swap! app-state assoc :server server)

    ;; Start the server
    (ws-server/start! server)

    server))

(defn stop! [server]
  ;; (tap> {:event :app/stopping-server})
  (ws-server/stop! server)
  (swap! app-state dissoc :server))

(defn broadcast! [message level]
  ;; (tap> "crashout")
  ;; (tap> @app-state)
  (when-let [server (:server @app-state)]
    ;; (tap> "Broadcasting message")
    ;; (tap> server)
    (let [notification {:message message
                       :level level
                       :timestamp (System/currentTimeMillis)}]
      ;; (tap> {:event :app/sending-notification
      ;;        :message message
      ;;        :level level})
      (ws-server/broadcast! server message))))

;; ==========================================================================
;; REPL Testing
;; ==========================================================================
(comment
  ;; Start the application server on port 3000
  (def app-server (start! 2176))

  ;; Check app state
  @app-state

  ;; Send a notification to all clients
  ;; (send-notification! "System maintenance in 5 minutes" "warning")

  ;; ;; Update and broadcast system status
  ;; (update-status! "degraded")

  ;; (update-status! "OK")

  ;; Send a direct message to a specific client
  (let [client-id (first (keys (:clients @app-state)))]
    (ws-server/send! (:server @app-state) client-id
                    {:type :direct-message
                     :message "This is a personal message"
                     :timestamp (System/currentTimeMillis)}))

  (broadcast! "Hello, everyone!" "info")

  ;; Stop the server
  (stop! app-server)

  )
