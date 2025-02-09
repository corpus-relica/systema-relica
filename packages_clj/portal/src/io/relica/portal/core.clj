(ns io.relica.portal.core
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [io.pedestal.http.cors :as cors]
            [io.pedestal.websocket :as ws]
            [clojure.tools.logging :as log]
            [clojure.core.async :as async]
            [cheshire.core :as json]
            [buddy.sign.jwt :as jwt]
            [clojure.string :as str])
  (:import [org.eclipse.jetty.websocket.api Session]))

(println "Hello, World!")

;; Track authenticated sessions and tokens
(def ws-sessions (atom {}))  ; {ws-session -> {:user-id id :session ws-session :channel ch}}
(def socket-tokens (atom {})) ; {token -> {:user-id id :created-at timestamp}}

(defn generate-socket-token []
  (str (java.util.UUID/randomUUID)))

;; JWT Validation Interceptor (for HTTP routes)
(def validate-jwt
  {:name ::validate-jwt
   :enter (fn [context]
            (tap> "Validating JWT...")
            (let [token (-> context :request :headers (get "authorization")
                          (clojure.string/replace "Bearer " ""))]
              (tap> (str "Got token from headers:" token))
              (tap> (str "JWT_SECRTE: " (or (System/getenv "JWT_SECRET") "changeme")))
              (try
                (let [claims (jwt/unsign token (or (System/getenv "JWT_SECRET") "changeme"))]
                  (tap> (str "Token claims:"))
                  (tap> claims)
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


;; (defn handle-client-message [ws-session text]
;;   (log/info "Handling client message:" text)
;;   (try
;;     (let [data (json/parse-string text true)
;;           ;; Get first active session that matches this message
;;           first-session (first (vals @ws-sessions))
;;           user-id (:user-id first-session)]
;;       (when user-id
;;         (case (:type data)
;;           "ping" (broadcast-to-user user-id {:type "pong"})

;;           "test" (broadcast-to-user user-id
;;                                   {:type "test-response"
;;                                    :echo (:data data)})

;;           ;; Default case
;;           (do
;;             (log/warn "Unknown message type:" (:type data))
;;             (broadcast-to-user user-id
;;                              {:type "error"
;;                               :message "Unknown message type"})))))
;;     (catch Exception e
;;       (log/error "Error handling message:" e))))

(defrecord WSConnection [user-id channel])

(defn token-from-session [ws-session]
  (let [uri (.getRequestURI ws-session)
        query (.getQuery uri)
        q-params (clojure.string/split query #"&")
        map-params (into {} (map #(clojure.string/split % #"=" 2) q-params))
        token (get map-params "token")]
    token
    ))

(def ws-paths
  {"/chsk" {:on-open (fn [ws-session conf]
           ;; (log/info "WebSocket connection attempt starting...")
           (tap> "WebSocket connection attempt starting...")
           (tap> (token-from-session ws-session))
           ;; Extract the token from the WebSocket session parameters
           (let [token (token-from-session ws-session)]
             ;; (log/info "Got token from params:" token)
             (tap> (str"Got token from params:" token))
             (tap> (str "Socket tokens:" @socket-tokens))
             (tap> (get @socket-tokens token))

             (tap> "THIS ISN'T WHAT YOU THINK IT IS!!!")
            (tap> conf)

             (if-let [user-data (get @socket-tokens token)]
               (let [user-id (:user-id user-data)
                     ;; Create connection context that will be passed to handlers
                     ;; conn (->WSConnection user-id conf)
                     chan (ws/start-ws-connection ws-session {})
                     sesh {:user-id user-id
                          :session ws-session
                          :channel chan}]

                 (tap> (str "WebSocket client authenticated for user:" user-id))
                 (swap! ws-sessions assoc ws-session sesh)

                 (tap> "THE MUTHERFUCKING CHAN")
                 (tap> chan)

                 (async/put! chan (json/generate-string
                                     {:type "welcome"
                                      :message "Connection established!"
                                      :user-id user-id}))
                 ;; Return connection context
                 sesh)
               (do
                 (tap> (str "Invalid socket token:" token))
                 (.close ws-session)
                 nil))))

           ;; Now we get both the connection context and the message
           :on-text (fn [sesh text]
                      (let [user-id (:user-id sesh)]
                        (tap> (str "!!!!! Message from user:" user-id " - " text))
                        (try
                          (let [data (json/parse-string text true)]
                            (case (:type data)
                              "ping" (broadcast-to-user user-id {:type "pong"})

                              "test" (broadcast-to-user user-id {:type "test-response" :echo (:data data)})

                              ;; Default case
                              (broadcast-to-user user-id {:type "error" :message "Unknown message type"})))

                          (catch Exception e
                            (tap> (str "Error handling message:" e))))))

           :on-binary (fn [conn payload offset length]
                       (log/warn "Binary message from user"
                                (:user-id conn)
                                "not supported"))

           :on-error (fn [conn ws-session throwable]
                      (log/error "WebSocket error for user"
                                (:user-id conn) ":" throwable)
                      (swap! ws-sessions dissoc ws-session))

           :on-close (fn [conn ws-session status-code reason]
                       (tap> (str "Closing connection for user:"
                                 (:user-id conn)))
                      (swap! ws-sessions dissoc ws-session))}})


;; HTTP Routes
(def routes
  (route/expand-routes
   #{["/ws-auth" :post
      [validate-jwt
       (fn [request]
         (let [user-id (-> request :identity :user-id)
               socket-token (generate-socket-token)]
           (tap> (str "Generated socket token:" socket-token " for user:" user-id))
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
        (tap> (str "Health check hit"))
        {:status 200 :body "healthy"})
      :route-name ::health]}))

(def cors-config
  {:allowed-origins (constantly true)  ; Allow all origins for development
   :allowed-methods [:get :post :put :delete :options]
   :allowed-headers ["Content-Type" "Authorization" "Accept"]
   :exposed-headers []
   :max-age 300})

;; Server configuration
(def service-map
  (-> {::http/routes routes
       ::http/type :jetty
       ::http/port 2174
       ::http/host "0.0.0.0"
       ::http/join? false
       ::http/websockets ws-paths  ; This is how we configure WebSockets in 0.7
       ::http/allowed-origins {:creds true :allowed-origins (constantly true)}}
      http/default-interceptors
      (update ::http/interceptors conj (cors/allow-origin cors-config))))

(defn start []
  ;; (log/info "Starting server...")
  (tap> "Starting server...")
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
