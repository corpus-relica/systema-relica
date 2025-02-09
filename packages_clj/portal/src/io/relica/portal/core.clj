(ns io.relica.portal.core
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [io.pedestal.http.cors :as cors]
            [io.pedestal.http.jetty.websockets :as ws]
            [clojure.tools.logging :as log]
            [clojure.core.async :as async]
            [cheshire.core :as json]
            [buddy.sign.jwt :as jwt])
  (:import [org.eclipse.jetty.websocket.api Session]))

;; Track authenticated sessions and tokens
(def ws-sessions (atom {}))  ; {ws-session -> {:user-id id :session ws-session :channel ch}}
(def socket-tokens (atom {})) ; {token -> {:user-id id :created-at timestamp}}

(defn generate-socket-token []
  (str (java.util.UUID/randomUUID)))

;; JWT Validation Interceptor (for HTTP routes)
(def validate-jwt
  {:name ::validate-jwt
   :enter (fn [context]
            (let [token (-> context :request :headers (get "authorization")
                          (clojure.string/replace "Bearer " ""))]
              (try
                (let [claims (jwt/unsign token (System/getenv "JWT_SECRET"))]
                  (assoc-in context [:request :identity] claims))
                (catch Exception e
                  (assoc context :response {:status 401 :body "Invalid token"})))))})

(defn validate-socket-token [token]
  (when-let [user-data (get @socket-tokens token)]
    ;; Check if token is still valid (optional: add expiry check here)
    (:user-id user-data)))

(defn get-user-sessions
  "Get all sessions for a user"
  [user-id]
  (->> @ws-sessions
       vals
       (filter #(= (:user-id %) user-id))))

(defn broadcast-to-user
  "Send a message to all sessions of a user"
  [user-id message]
  (doseq [{:keys [channel]} (get-user-sessions user-id)]
    (async/put! channel (json/generate-string message))))


(defn handle-client-message [text]
  (log/info "Handling client message:" text)
  (try
    (let [data (json/parse-string text true)
          ;; Get first active session that matches this message
          first-session (first (vals @ws-sessions))
          user-id (:user-id first-session)]
      (when user-id
        (case (:type data)
          "ping" (broadcast-to-user user-id {:type "pong"})

          "test" (broadcast-to-user user-id
                                  {:type "test-response"
                                   :echo (:data data)})

          ;; Default case
          (do
            (log/warn "Unknown message type:" (:type data))
            (broadcast-to-user user-id
                             {:type "error"
                              :message "Unknown message type"})))))
    (catch Exception e
      (log/error "Error handling message:" e))))

(def ws-paths
  {"/chsk" {:on-connect (ws/start-ws-connection
             (fn [ws-session send-ch]
               (log/info "WebSocket connection attempt starting...")
               (let [token (-> ws-session
                             .getUpgradeRequest
                             .getParameterMap
                             (get "token")
                             first)]
                 (log/info "Got token from params:" token)
                 (if-let [user-data (get @socket-tokens token)]
                   (let [user-id (:user-id user-data)]
                     (log/info "WebSocket client authenticated for user:" user-id)
                     ;; Store this connection
                     (swap! ws-sessions assoc ws-session
                            {:user-id user-id
                             :session ws-session
                             :channel send-ch})
                     ;; Notify this connection
                     (async/put! send-ch (json/generate-string
                                         {:type "welcome"
                                          :message "Connection established!"
                                          :user-id user-id}))
                     ;; Log total connections for this user
                     (log/info "Total connections for user" user-id ":"
                              (count (get-user-sessions user-id))))
                   (do
                     (log/error "Invalid socket token:" token)
                     (.close ws-session))))))

           :on-text handle-client-message

           :on-binary (fn [ws-session payload offset length]
                       (log/warn "Binary message received - not supported"))

           :on-error (fn [ws-session throwable]
                      (log/error "WebSocket error occurred:" throwable)
                      (when-let [session-data (get @ws-sessions ws-session)]
                        (log/info "Removing errored connection for user:"
                                 (:user-id session-data)))
                      (swap! ws-sessions dissoc ws-session))

           :on-close (fn [ws-session status-code reason]
                      (when-let [session-data (get @ws-sessions ws-session)]
                        (log/info "Closing connection for user:"
                                 (:user-id session-data)))
                      (swap! ws-sessions dissoc ws-session))}})


;; HTTP Routes
(def routes
  (route/expand-routes
   #{["/ws-auth" :post
      [validate-jwt
       (fn [request]
         (let [user-id (-> request :identity :user-id)
               socket-token (generate-socket-token)]
           (log/info "Generated socket token:" socket-token "for user:" user-id)
           (swap! socket-tokens assoc socket-token
                  {:user-id user-id
                   :created-at (System/currentTimeMillis)})
           {:status 200
            :headers {"Content-Type" "application/json"}
            :body (json/generate-string
                    {:token socket-token})}))]
      :route-name ::ws-auth]

     ["/health" :get
      (fn [_]
        (log/info "Health check hit")
        {:status 200 :body "healthy"})
      :route-name ::health]}))

;; Server configuration
(def service-map
  (-> {::http/routes routes
       ::http/type :jetty
       ::http/port 8080
       ::http/host "0.0.0.0"
       ::http/join? false
       ::http/allowed-origins {:creds true :allowed-origins (constantly true)}
       ::http/container-options {:context-configurator #(ws/add-ws-endpoints % ws-paths)}}
      http/default-interceptors
      (update ::http/interceptors conj (cors/allow-origin cors-config))))

(defn start []
  (log/info "Starting server...")
  (-> service-map
      http/create-server
      http/start))

(defn -main [& args]
  (start))

;; REPL helpers
(comment
  (def server (start))

  (http/stop server)

  )
