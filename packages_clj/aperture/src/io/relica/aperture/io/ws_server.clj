(ns io.relica.aperture.io.ws-server
  (:require [io.pedestal.log :as log]
            [clojure.core.async :as async :refer [go <! >! chan]]
            [cheshire.core :as json]
            [io.relica.aperture.env :refer [get-user-environment update-user-environment!]])
  (:import [org.eclipse.jetty.websocket.api Session WebSocketAdapter]
           [org.eclipse.jetty.websocket.server WebSocketUpgradeFilter]
           [org.eclipse.jetty.websocket.servlet WebSocketCreator]
           [org.eclipse.jetty.server.handler ContextHandler]
           [javax.servlet ServletContextListener]
           [javax.servlet.http HttpServletRequest HttpServletResponse]))


;; WebSocket session management
(defonce ws-sessions (atom {}))

;; Message handlers
(defmulti handle-ws-message :type)

(defmethod handle-ws-message "get-environment"
  [{:keys [user-id session-id]}]
  (let [env (get-user-environment (parse-long user-id))]
    {:type "environment-update"
     :session-id session-id
     :environment env}))

(declare broadcast!)

(defmethod handle-ws-message "update-environment"
  [{:keys [user-id updates session-id]}]
  (if-let [updated (update-user-environment! (parse-long user-id) updates)]
    (do
      (broadcast!
       {:type "environment-updated"
        :user-id user-id
        :environment updated})
      {:type "environment-updated"
       :session-id session-id
       :environment updated})
    {:type "error"
     :session-id session-id
     :message "Failed to update environment"}))

(defmethod handle-ws-message :default
  [{:keys [type session-id]}]
  {:type "error"
   :session-id session-id
   :message (str "Unknown message type: " type)})

;; WebSocket handler implementation
(defn- ws-adapter []
  (proxy [WebSocketAdapter] []
    (onWebSocketConnect [^Session session]
      (proxy-super onWebSocketConnect session)
      (let [session-id (str (random-uuid))]
        (swap! ws-sessions assoc session-id
               {:session session
                :created-at (System/currentTimeMillis)})
        (log/info :msg "WebSocket client connected" :session-id session-id)))

    (onWebSocketText [^String message]
      (try
        (let [session (proxy-super getSession)
              session-id (-> @ws-sessions
                            (filter #(= session (:session (val %))))
                            first
                            key)
              parsed-msg (-> message
                           (json/parse-string true)
                           (assoc :session-id session-id))
              response (handle-ws-message parsed-msg)]
          (.sendString session (json/generate-string response)))
        (catch Exception e
          (log/error :msg "WebSocket error handling message"
                    :exception e))))

    (onWebSocketClose [status-code ^String reason]
      (let [session (proxy-super getSession)
            session-id (-> @ws-sessions
                          (filter #(= session (:session (val %))))
                          first
                          key)]
        (swap! ws-sessions dissoc session-id)
        (log/info :msg "WebSocket client disconnected"
                 :session-id session-id
                 :status-code status-code
                 :reason reason)
        (proxy-super onWebSocketClose status-code reason)))))

;; WebSocket configuration
(defn ws-handler []
  (proxy [ContextHandler] ["/ws"]
    (doStart []
      (proxy-super doStart)
      (let [ws-filter (WebSocketUpgradeFilter/configure context)]
        (.addMapping (.getFactory ws-filter)
                    "/"
                    (reify WebSocketCreator
                      (createWebSocket [_ req resp]
                        (ws-adapter))))))))

;; Public API for broadcasting
(defn broadcast! [message]
  (doseq [{:keys [session]} (vals @ws-sessions)]
    (try
      (.sendString session (json/generate-string message))
      (catch Exception e
        (log/error :msg "Failed to broadcast message"
                  :exception e)))))

(defn send-to-session! [session-id message]
  (when-let [{:keys [session]} (get @ws-sessions session-id)]
    (try
      (.sendString session (json/generate-string message))
      (catch Exception e
        (log/error :msg "Failed to send message to session"
                  :exception e)))))

;; Session management utilities
(defn get-active-sessions []
  (count @ws-sessions))

(defn disconnect-all! []
  (doseq [{:keys [session]} (vals @ws-sessions)]
    (.close session))
  (reset! ws-sessions {}))
