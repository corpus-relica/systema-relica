;; src/io/relica/portal/core.clj
(ns io.relica.portal.core
  (:require [org.httpkit.server :as http]
            [compojure.core :refer [defroutes GET POST OPTIONS]]
            [compojure.handler :refer [api site]]
            [clojure.string :as str]
            [compojure.route :as route]
            [clojure.tools.logging :as log]
            [clojure.core.async :refer [go <! chan put! take!]]
            [cheshire.core :as json]
            [buddy.sign.jwt :as jwt]
            [ring.util.response :as response]
            [ring.middleware.cors :refer [wrap-cors]]
            [ring.middleware.json :refer [wrap-json-response wrap-json-body]]
            [io.relica.portal.io.archivist-client :as archivist :refer [archivist-client]]
            [io.relica.portal.io.aperture-client :as aperture :refer [aperture-client]]))

;;
;; Authentication state
(defonce socket-tokens (atom {}))
(defonce connected-clients (atom {}))  ; Track WebSocket connections
(def jwt-secret (or (System/getenv "JWT_SECRET") "changeme"))

;; Server instance
(defonce server-instance (atom nil))


;; Authentication helpers
(defn generate-socket-token []
  (str (java.util.UUID/randomUUID)))

(defn validate-jwt [token]
  (try
    (let [claims (jwt/unsign token jwt-secret)]
      (:user-id claims))
    (catch Exception e
      (log/error "JWT validation failed:" e)
      nil)))

(defn validate-socket-token [token]
  (when-let [{:keys [user-id created-at]} (get @socket-tokens token)]
    ;; Optional: Add token expiry check
    (when (< (- (System/currentTimeMillis) created-at) (* 24 60 60 1000))
      user-id)))

;; Message Handlers
;; WebSocket message handling
(declare ws-handlers)
(defn handle-ws-message [channel data]
  (try
    (let [message (json/parse-string data true)
          {:keys [id type payload]} message
          handler (get ws-handlers type)]
      (if handler
        (go
          (try
            (let [result (<! (handler payload))
                  response {:id id
                          :type "response"
                          :payload result}]
              (http/send! channel (json/generate-string response)))
            (catch Exception e
              (log/error "Error processing message:" e)
              (http/send! channel (json/generate-string
                                 {:id id
                                  :type "error"
                                  :error (.getMessage e)})))))
        (do
          (log/warn "No handler found for message type:" type)
          (http/send! channel (json/generate-string
                              {:id id
                               :type "error"
                               :error (str "Unknown message type: " type)})))))
    (catch Exception e
      (log/error "Error parsing message:" e)
      (http/send! channel (json/generate-string
                          {:type "error"
                           :error "Invalid message format"})))))

;; WebSocket connection handler
(defn ws-handler [request]
  (if-let [token (-> request :params (get "token"))]
    (if-let [user-id (validate-socket-token token)]
      (http/with-channel request channel
        (let [client-id (str (random-uuid))] (swap! connected-clients assoc client-id {:channel channel
                                                  :user-id user-id})
          (http/on-close channel
                        (fn [status]
                          (swap! connected-clients dissoc client-id)
                          (log/info "WebSocket closed:" status)))
          (http/on-receive channel
                          (fn [data]
                            (handle-ws-message channel data)))))
      {:status 401
       :headers {"Content-Type" "application/json"
                "Access-Control-Allow-Origin" "*"
                "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
                "Access-Control-Allow-Headers" "Content-Type, Authorization"}
       :body (json/generate-string {:error "Invalid token"})})
    {:status 401
     :headers {"Content-Type" "application/json"
              "Access-Control-Allow-Origin" "*"
              "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
              "Access-Control-Allow-Headers" "Content-Type, Authorization"}
     :body (json/generate-string {:error "No token provided"})}))


(defn handle-auth [{:keys [jwt]}]
  (go
    (if-let [user-id (validate-jwt jwt)]
      (let [socket-token (generate-socket-token)]
        (swap! socket-tokens assoc socket-token
               {:user-id user-id
                :created-at (System/currentTimeMillis)})
        {:success true
         :token socket-token
         :user-id user-id})
      {:error "Invalid JWT"})))

(defn handle-ws-auth [request]
  (if-let [user-id (-> request :identity :user-id)]
    (let [socket-token (generate-socket-token)]
      (swap! socket-tokens assoc socket-token
             {:user-id user-id
              :created-at (System/currentTimeMillis)})
      {:status 200
       :body {:token socket-token}})
    {:status 401
     :body {:error "Authentication failed"}}))

(defn handle-get-kinds [{:keys [params] :as req}]
  (let [user-id (-> req :identity :user-id)
        params {:sort (or (some-> params :sort read-string)
                     ["name" "ASC"])
           :range (or (some-> params :range read-string)
                      [0 10])
           :filter (or (some-> params :filter read-string)
                       {})
                ;;parse float
           :user-id user-id}]
  (tap> "GETTING KINDS, MY DUDE!!")
  (tap> "LET'S GO!!!!!!!!!!!!!!!!")
  (go
    (try
      (let [result (<! (archivist/get-kinds
                        archivist-client
                        params))]
        {:status 200
         :headers {"Content-Type" "application/json"}
         :body (json/generate-string (:data result))})
      (catch Exception e
        (log/error "Failed to fetch kinds:" e)
        {:status 500
         :headers {"Content-Type" "application/json"}
         :body {:error "Failed to fetch kinds"
                :message (.getMessage e)}})))))

(defn handle-resolve-uids [{:keys [params body] :as request}]
  (let [uids (or (some-> params :uids read-string)  ; Handle query param array
                 (:uids body)                        ; Handle JSON body
                 [])]
    (go
      (try
        (let [result (<! (archivist/resolve-uids
                          archivist-client
                          uids))]
          {:status 200
           :headers {"Content-Type" "application/json"}
           :body (json/generate-string (:data result))})
        (catch Exception e
          (log/error "Failed to resolve UIDs:" e)
          {:status 500
           :headers {"Content-Type" "application/json"}
           :body {:error "Failed to resolve entities"
                 :message (.getMessage e)}})))))

(defn handle-get-environment [{:keys [identity]}]
  (go
    (try
      (let [response (<! (aperture/get-environment aperture-client (:user-id identity)))]
        {:status 200
         :headers {"Content-Type" "application/json"}
         :body (json/generate-string (:environment response))})
      (catch Exception e
        (log/error "Failed to fetch environment:" e)
        {:error "Failed to fetch environment"}))))

;; JWT Validation Middleware
(defn wrap-jwt-auth [handler]
  (fn [request]
    (if-let [token (-> request :headers (get "authorization") (clojure.string/replace "Bearer " ""))]
      (if-let [user-id (validate-jwt token)]
        (handler (assoc request :identity {:user-id user-id}))
        {:status 401 :body "Invalid token"})
      {:status 401 :body "No token provided"})))

;; HTTP Routes and Handlers
(defn handle-ws-auth [request]
  (if-let [user-id (-> request :identity :user-id)]
    (let [socket-token (generate-socket-token)]
      (swap! socket-tokens assoc socket-token
             {:user-id user-id
              :created-at (System/currentTimeMillis)})
      {:status 200
       :body {:token socket-token}})
    {:status 401
     :body {:error "Authentication failed"}}))

(defn wrap-async-handler [handler]
  (fn [request]
    (http/with-channel request channel
      (take! (handler request)
             (fn [result]
               (http/send! channel
                          {:status 200
                           :headers {"Content-Type" "application/json"
                                   "Access-Control-Allow-Origin" "*"
                                   "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
                                   "Access-Control-Allow-Headers" "Content-Type, Authorization"}
                           :body (:body result)}))))))

(defn wrap-cors-headers [handler]
  (fn [request]
    (let [response (handler request)]
      (-> response
          (update :headers merge
                  {"Access-Control-Allow-Origin" "*"
                   "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
                   "Access-Control-Allow-Headers" "Content-Type, Authorization"
                   "Access-Control-Max-Age" "3600"})))))

;; Error handling middleware with CORS
(defn wrap-error-handling [handler]
  (fn [request]
    (try
      (handler request)
      (catch Exception e
        (log/error "Unhandled exception:" e)
        {:status 500
         :headers {"Content-Type" "application/json"}
         :body {:error "Internal server error"
                :message (.getMessage e)}}))))

;; WebSocket connection authentication middleware
;; (defn auth-middleware [handler]
;;   (fn [message session-id]
;;     (if (= (:type message) "auth")
;;       (handler message session-id)
;;       (if-let [token (get-in message [:auth :token])]
;;         (if-let [user-id (validate-socket-token token)]
;;           (handler (assoc message :user-id user-id) session-id)
;;           {:error "Invalid socket token"})
;;         {:error "Authentication required"}))))

;; Message routing
(def ws-handlers
  {"auth" handle-auth
   "kinds:get" handle-get-kinds
   "entities:resolve" handle-resolve-uids
   "environment:get" handle-get-environment})

;; Server management
;; (defn start! []
;;   (when-not @server-instance
;;     (let [port 2174
;;           server (ws/create-server
;;                   port
;;                   {:handlers handlers
;;                    :middleware [auth-middleware]
;;                    :on-connect (fn [session-id]
;;                                (log/info "New connection:" session-id))
;;                    :on-disconnect (fn [session-id]
;;                                   (log/info "Connection closed:" session-id))
;;                    :on-error (fn [session-id error]
;;                              (log/error "WebSocket error:" error))})]
;;       (ws/start! server)
;;       (reset! server-instance server)
;;       (log/info "Portal WebSocket server started on port" port)
;;       server)))

;; (defn stop! []
;;   (when-let [server @server-instance]
;;     (ws/stop! server)
;;     (reset! server-instance nil)
;;     (log/info "Portal WebSocket server stopped")))

;; Define routes with WebSocket support
(defroutes app-routes
  (GET "/chsk" [] (wrap-jwt-auth ws-handler))
  (POST "/ws-auth" [] (wrap-jwt-auth handle-ws-auth))
  (GET "/kinds" [] (->  handle-get-kinds
                        wrap-async-handler
                        wrap-jwt-auth))
  (OPTIONS "/concept/entities" []
          {:status 200
           :headers {"Access-Control-Allow-Origin" "*"
                    "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
                    "Access-Control-Allow-Headers" "Content-Type, Authorization"
                    "Access-Control-Max-Age" "3600"}})
  (GET "/concept/entities" [] (-> handle-resolve-uids
                                 wrap-async-handler
                                 wrap-jwt-auth))  ; Support GET with query params
  (POST "/concept/entities" [] (-> handle-resolve-uids
                                  wrap-async-handler
                                  wrap-jwt-auth))  ; Support POST with body
  (GET "/environment/retrieve" [] (-> handle-get-environment
                                      wrap-async-handler
                                      wrap-jwt-auth
                                   ))
  (GET "/health" [] {:status 200 :body "healthy"})
  (OPTIONS "/*" [] {:status 200
                    :headers {"Access-Control-Allow-Origin" "*"
                             "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
                             "Access-Control-Allow-Headers" "Content-Type, Authorization"
                             "Access-Control-Max-Age" "3600"}}))

(def handler (-> app-routes api))

;; Server setup
(def app
  (-> handler
      wrap-error-handling
      wrap-cors-headers
      wrap-json-response
      (wrap-json-body {:keywords? true})))

(defn start! []
  (when-not @server-instance
    (let [port 2174
          server (http/run-server app {:port port})]
      (reset! server-instance server)
      (log/info "Portal server started on port" port)
      server)))

(defn stop! []
  (when-let [stop-fn @server-instance]
    (stop-fn)  ; http-kit servers are stopped by calling the returned function
    (reset! server-instance nil)
    (reset! connected-clients {})  ; Clear connected clients
    (log/info "Portal server stopped")))

(defn -main [& args]
  (start!))

;; REPL helpers
(comment
  ;; Start server
  (def server (start!))

  ;; Test authentication
  (handle-auth {:jwt "your.test.jwt"})

  ;; Test kinds query
  (handle-get-kinds {:sort ["name" "ASC"]
                     :range [0 10]
                     :user-id "test-user"})

  ;; Stop server
  (stop!)

  ;; Check active sessions
  (ws/get-active-sessions @server-instance)

  ;; Clean up expired tokens
  (let [now (System/currentTimeMillis)
        day-ms (* 24 60 60 1000)]
    (swap! socket-tokens
           #(into {} (filter (fn [[_ v]]
                              (< (- now (:created-at v)) day-ms)) %))))
  )
