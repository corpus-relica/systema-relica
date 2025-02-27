(ns io.relica.aperture.io.ws-server-ii
  (:require [io.relica.common.websocket.server :as ws-server]
            [clojure.core.async :as async :refer [go go-loop <! >! timeout chan]]
            [clojure.tools.logging :as log]))

;; Application state (would typically be in a database or other persistence)
(def app-state (atom {:clients {}
                      :last-status {:status "OK"
                                   :timestamp (System/currentTimeMillis)
                                   :active-users 0}
                      :files {}}))

;; Application-specific message handlers
;; (defmethod ws-server/handle-ws-message
;;   :app/sync-files
;;   [{:keys [?data uid ?reply-fn] :as msg}]
;;   (tap> {:event :app/sync-files-received
;;          :client-id uid
;;          :files-count (count (:files ?data))})

;;   ;; Process files and update state
;;   (let [files (:files ?data)
;;         file-ids (map :id files)]
;;     (swap! app-state update :files
;;            (fn [existing-files]
;;              (reduce (fn [acc file]
;;                        (assoc acc (:id file) file))
;;                      existing-files
;;                      files)))

;;     ;; Track client activity
;;     (swap! app-state assoc-in [:clients uid :last-active] (System/currentTimeMillis))

;;     ;; Reply to client
;;     (when ?reply-fn
;;       (?reply-fn {:status "success"
;;                  :message (str "Processed " (count files) " files")
;;                  :file-ids file-ids}))

;;     ;; Broadcast to all clients that new files are available
;;     (when-let [server (:server @app-state)]
;;       (ws-server/broadcast! server {:type :file-sync
;;                                    :files files
;;                                    :timestamp (System/currentTimeMillis)}))))

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
  (tap> {:event :app/stopping-server})
  (ws-server/stop! server)
  (swap! app-state dissoc :server))

(defn broadcast! [message level]
  (tap> "crashout")
  (tap> @app-state)
  (when-let [server (:server @app-state)]
    (tap> "Broadcasting message")
    (tap> server)
    (let [notification {:message message
                       :level level
                       :timestamp (System/currentTimeMillis)}]
      (tap> {:event :app/sending-notification
             :message message
             :level level})
      (ws-server/broadcast! server message))))
      ;; (ws-server/broadcast! server {:type :app/notification
      ;;                               :event-type :app/notification
      ;;                              :message message
      ;;                              :level level
      ;;                              :timestamp (System/currentTimeMillis)}))))

;; (defn update-status! [status]
;;   (let [timestamp (System/currentTimeMillis)
;;         active-users (count (:clients @app-state))
;;         status-update {:status status
;;                       :timestamp timestamp
;;                       :active-users active-users}]
;;     ;; Update app state
;;     (swap! app-state assoc :last-status status-update)

;;     ;; Broadcast to all clients
;;     (when-let [server (:server @app-state)]
;;       (tap> {:event :app/broadcasting-status-update
;;              :status status})
;;       (ws-server/broadcast! server {:type :status-update
;;                                    :status status
;;                                    :timestamp timestamp
;;                                    :active-users active-users}))))

;; ==========================================================================
;; REPL Testing
;; ==========================================================================
(comment
  ;; Start the application server on port 3000
  (def app-server (start! 2175))

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
  (stop-server! app-server)

  )
