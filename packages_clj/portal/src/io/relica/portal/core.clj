(ns io.relica.portal.core
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [io.pedestal.http.cors :as cors]
            [io.pedestal.http.body-params :as body-params]
            [io.pedestal.websocket :as ws]
            [clojure.tools.logging :as log]
            [clojure.core.async :as async]
            [cheshire.core :as json]
            [buddy.sign.jwt :as jwt]
            [clojure.string :as str]
            [io.relica.portal.io.archivist-client :as archivist-client]
            [io.relica.portal.io.aperture-client :as aperture-client]
            )
  (:import [org.eclipse.jetty.websocket.api Session]))

;; Add ping configuration
(def ping-config
  {:interval 25000    ; Send ping every 25 seconds
   :timeout 10000})   ; Consider connection dead after 10s without pong

(defn start-ping-loop
  "Starts a ping loop for a websocket session"
  [{:keys [session channel user-id] :as sesh}]
  (tap> {:event :starting-ping-loop :user-id user-id})
  (let [stop-ch (async/chan)]
    (async/go-loop []
      (when (.isOpen session)
        (let [[_ ch] (async/alts! [(async/timeout (:interval ping-config)) stop-ch])]
          (when (nil? ch)  ;; timeout occurred, not stop-ch
            (when (.isOpen session)  ;; double-check session is still open
              (try
                (async/put! channel (json/generate-string {:type "ping"}))
                (tap> {:event :ping-sent :user-id user-id})
                (catch Exception e
                  (tap> {:event :ping-error :error e})))
              (recur))))))  ;; recur outside the try block
    stop-ch))

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
        query (.getQuery uri)]
    (when query  ; Add nil check
      (let [q-params (clojure.string/split query #"&")
            map-params (into {} (map #(clojure.string/split % #"=" 2) q-params))]
        (get map-params "token")))))

(def ws-paths
  {"/chsk"
   {:on-open (fn [ws-session conf]
               (tap> "WebSocket connection attempt starting...")
               (let [token (token-from-session ws-session)]
                 (if-let [user-data (get @socket-tokens token)]
                   (let [user-id (:user-id user-data)
                         chan (ws/start-ws-connection ws-session {})
                         stop-ch (async/chan)
                         sesh {:user-id user-id
                              :session ws-session
                              :channel chan
                              :last-pong (System/currentTimeMillis)
                              :stop-ping stop-ch}]
                     (swap! ws-sessions assoc ws-session sesh)
                     ;; Start ping loop
                     (start-ping-loop sesh)
                     (async/put! chan (json/generate-string
                                     {:type "welcome"
                                      :message "Connection established!"
                                      :user-id user-id}))
                     sesh)
                   (do
                     (tap> (str "Invalid socket token:" token))
                     (.close ws-session)
                     nil))))

    :on-text (fn [sesh text]
               (let [user-id (:user-id sesh)]
                 (try
                   (let [data (json/parse-string text true)]
                     (case (:type data)
                       ;; Add pong handler
                       "pong" (do
                               (tap> {:event :pong-received :user-id user-id})
                               (swap! ws-sessions assoc-in
                                     [(:session sesh) :last-pong]
                                     (System/currentTimeMillis)))

                       "loadSpecializationHierarchy" (do
                                                       (tap> {:event :loadSpecializationHierarchy :user-id user-id})
                                                       (tap> data)
                                                       (let [uid (:uid (:payload data))
                                                             response (aperture-client/load-specialization-hierarchy uid user-id)]
                                                         (tap> {:event :loadSpecializationHierarchy-response :response response})
                                                         (async/put! (:channel sesh) (json/generate-string response))))

                       ;; Your existing handlers...
                       "test" (broadcast-to-user user-id
                                               {:type "test-response"
                                                :echo (:data data)})

                       (broadcast-to-user user-id
                                        {:type "error"
                                         :message (str "Unknown message type: " (:type data) " from user: " user-id)})))
                   (catch Exception e
                     (tap> {:event :message-error :error e})))))

    :on-binary (fn [conn payload offset length]
                (log/warn "Binary message from user"
                         (:user-id conn)
                         "not supported"))

    :on-error (fn [conn ws-session throwable]
               (log/error "WebSocket error for user"
                         (:user-id conn) ":" throwable)
               (swap! ws-sessions dissoc ws-session))

    :on-close (fn [sesh ws-session status-code reason]
                (when-let [stop-ch (:stop-ping sesh)]
                  (async/close! stop-ch))
                (swap! ws-sessions dissoc ws-session)
                (tap> {:event :connection-closed
                      :user-id (:user-id sesh)
                      :status-code status-code
                      :reason reason}))}})

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
      :route-name ::health]

["/kinds" :get
 [http/json-body
  (fn [{:keys [query-params] :as request}]
    (tap> {:msg "Received kinds request"
           :params query-params})
    (let [{:keys [sort range filter userId]} query-params]
      (try
        (let [response (archivist-client/get-kinds
                        {:sort (json/parse-string sort)
                         :range (json/parse-string range)
                         :filter (json/parse-string filter)
                         :user-id userId})]
          (tap> {:msg "Got response from archivist"
                 :response response})
          {:status 200
           :headers {"Content-Type" "application/json"
                    "Access-Control-Allow-Origin" "*"}  ; Explicitly add CORS header
           :body (json/generate-string response)})
        (catch Exception e
          (tap> {:msg "Error in kinds handler"
                 :error e})
          {:status 500
           :headers {"Content-Type" "application/json"
                    "Access-Control-Allow-Origin" "*"}  ; Add CORS even for errors
           :body (json/generate-string
                  {:error "Failed to fetch kinds"})}))))]
 :route-name ::get-kinds]

     ["/kinds" :options
      (fn [_]
        {:status 200
         :headers {"Access-Control-Allow-Origin" "*"
                  "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
                  "Access-Control-Allow-Headers" "Content-Type, Authorization"}})
      :route-name ::kinds-options]

     }))

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
