(ns io.relica.shutter.core
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [io.pedestal.http.cors :as cors]
            [io.pedestal.interceptor :refer [interceptor]]
            [cheshire.core :as json]
            [buddy.sign.jwt :as jwt]
            [buddy.hashers :as hashers]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [clojure.string :as str]
            [clojure.tools.logging :as log]
            [io.relica.shutter.db :as db]
            [io.relica.shutter.tokens :as tokens])
  (:gen-class))

(def cors-config
  {:allowed-origins (constantly true)  ; Allow all origins for development
   :allowed-methods [:get :post :put :delete :options]
   :allowed-headers ["Content-Type" "Authorization" "Accept"]
   :exposed-headers []
   :max-age 300})


;; Environment configuration
(def env
  {:db-spec {:dbtype "postgresql"
             :dbname (or (System/getenv "POSTGRES_DB") "postgres")
             :host (or (System/getenv "POSTGRES_HOST") "postgres")
             :user (or (System/getenv "POSTGRES_USER") "postgres")
             :password (or (System/getenv "POSTGRES_PASSWORD") "password")
             :port (parse-long (or (System/getenv "POSTGRES_PORT") "5432"))}
   :jwt-secret (or (System/getenv "JWT_SECRET") "your-dev-secret-change-me")
   :port (parse-long (or (System/getenv "PORT") "2173"))})

;; Database setup
(def ds (jdbc/get-datasource (:db-spec env)))

(defn foo []
  (try
    (jdbc/execute-one! ds ["SELECT 1"])
    (catch Exception e
      (log/error e "Database connection failed"))))

;; test db connection
(defn test-db-connection []
  (try
    (do
      (jdbc/execute-one! ds ["SELECT 1"])
      (println "- Database connection successful")
      (log/info "-> Database connection successful")
      true)
    (catch Exception e
      (do
        (println (e "- Database connection failed"))
        (log/error e "-> Database connection failed")
        false))))

(test-db-connection)

(defn create-test-user! [email username password]
  (let [password-hash (hashers/derive password {:algorithm :bcrypt})  ; Just :bcrypt, not :bcrypt+sha512
        result (jdbc/execute-one! ds
                                  ["INSERT INTO users
                  (email, username, password_hash, is_active, first_name, last_name)
                  VALUES (?, ?, ?, true, 'Test', 'User')
                  RETURNING id, email, username, is_active"
                                   email username password-hash]
                                  {:builder-fn rs/as-unqualified-maps})]
    (log/info "Created test user:" (dissoc result :password_hash))
    result))

(defn verify-user [email password]
  (println (str "Verifying user:" email))
  (println (str "Password:" password))
  (try
    (when-let [user (jdbc/execute-one! ds
                                       ["SELECT * FROM users WHERE email = ?" email]
                                       {:builder-fn rs/as-unqualified-maps})]
      (println (str "Found user:" (dissoc user :password_hash)))
      (println (str "Password hash:" (:password_hash user)))
      (when (:is_active user)
        (if (hashers/verify password (:password_hash user))
          (select-keys user [:id :username :email :is_admin])
          (do
            (log/info "Password verification failed")
            nil))))
    (catch Exception e
      (log/error e "Database error during user verification")
      nil)))

(def auth-interceptor
  (interceptor
   {:name ::auth
    :enter (fn [context]
             (if-let [auth-header (get-in context [:request :headers "authorization"])]
               (try
                 (let [token (str/replace auth-header #"^Bearer " "")
                       claims (jwt/unsign token (:jwt-secret env))]
                   (assoc-in context [:request :identity] claims))
                 (catch Exception e
                   (log/warn e "Token validation failed")
                   (assoc context :response {:status 401
                                             :body {:error "Invalid token"}})))
               (assoc context :response {:status 401
                                         :body {:error "No token provided"}})))
    :error (fn [context e]
             (log/error e "Authentication error")
             (assoc context :response
                    {:status 401
                     :body {:error "Authentication failed"}}))}))

(def json-body-interceptor
  (interceptor
   {:name ::json-body
    :enter (fn [context]
             (let [body (-> context :request :body slurp)]
               (try
                 (if (str/blank? body)
                   context
                   (let [json-body (json/parse-string body true)]
                     (assoc-in context [:request :json-params] json-body)))
                 (catch Exception e
                   (assoc context :response {:status 400
                                             :body {:error "Invalid JSON"}})))))}))

(def json-response-interceptor
  (interceptor
   {:name ::json-response
    :leave (fn [context]
             (if-let [response (:response context)]
               (assoc-in context [:response :headers "Content-Type"] "application/json")
               context))}))

(def common-interceptors [auth-interceptor])

;; Login handler
(def login-handler
  {:name ::login
   :enter
   (fn [context]
     (println "HANDLING LOGIN")
     (let [raw-body (-> context :request :body slurp)
           body (json/parse-string raw-body true)
           {:keys [email password]} body]
       (println "Parsed body:" body)
       (println "Email:" email)
       (println "Password:" password)
       (if-let [user (verify-user email password)]
         (let [claims {:user-id (:id user)
                       :email (:email user)
                       :admin (:is_admin user)}
               token (jwt/sign claims (:jwt-secret env)
                               {:exp (+ (System/currentTimeMillis)
                                        (* 24 60 60 1000))})]
           (assoc context :response
                  {:status 200
                   :headers {"Content-Type" "application/json"}
                   :body (json/generate-string
                          {:token token
                           :user (dissoc user :password_hash)})}))
         (assoc context :response
                {:status 401
                 :headers {"Content-Type" "application/json"}
                 :body (json/generate-string
                        {:error "Invalid credentials"})}))))})

;; Guest auth handler - provides limited token for setup process
(def guest-auth-handler
  {:name ::guest-auth
   :enter
   (fn [context]
     (println "HANDLING GUEST AUTH")
     ;; Create a guest token with minimal permissions
     (let [claims {:user-id "guest"
                   :email "guest"
                   :roles ["setup"]
                   :guest true
                   ;; Short expiration time for security
                   :exp (+ (System/currentTimeMillis) (* 30 60 1000))} ; 30 minutes
           token (jwt/sign claims (:jwt-secret env))]
       (assoc context :response
              {:status 200
               :headers {"Content-Type" "application/json"
                         "Access-Control-Allow-Origin" "*"}
               :body (json/generate-string
                      {:token token
                       :user {:id "guest"
                              :username "guest"
                              :roles ["setup"]}})})))
   :error
   (fn [context e]
     (log/error e "Guest auth error")
     (assoc context :response
            {:status 500
             :headers {"Content-Type" "application/json"
                       "Access-Control-Allow-Origin" "*"}
             :body (json/generate-string
                    {:error "Guest authentication failed"})}))})

;; Token management handlers

(def create-token-handler
  {:name ::create-token
   :enter
   (fn [context]
     (let [user-id (get-in context [:request :identity :user-id])
           body (get-in context [:request :json-params])
           {:keys [name description scopes expires-in-days]} body]
       (try
         ;; Check rate limiting
         (let [token-count (db/get-user-token-count ds user-id)]
           (if-not (tokens/can-create-token? token-count)
             (assoc context :response
                    {:status 429
                     :headers {"Content-Type" "application/json"}
                     :body (json/generate-string
                            {:error (str "Token limit exceeded. Maximum "
                                         tokens/MAX_TOKENS_PER_USER
                                         " tokens allowed per user.")})})
             ;; Check if token name already exists
             (if (db/token-exists? ds user-id name)
               (assoc context :response
                      {:status 400
                       :headers {"Content-Type" "application/json"}
                       :body (json/generate-string
                              {:error "Token with this name already exists"})})
               ;; Create the token
               (let [raw-token (tokens/generate-secure-token)
                     token-hash (tokens/hash-token raw-token)
                     token-data (tokens/prepare-token-data body)
                     created-token (db/create-token! ds user-id token-hash
                                                     (:name token-data)
                                                     (:description token-data)
                                                     (:scopes token-data)
                                                     (:expires-at token-data))]
                 (assoc context :response
                        {:status 201
                         :headers {"Content-Type" "application/json"}
                         :body (json/generate-string
                                {:token raw-token
                                 :token_info (tokens/format-token-response created-token)})})))))
         (catch Exception e
           (log/error e "Failed to create token")
           (assoc context :response
                  {:status 500
                   :headers {"Content-Type" "application/json"}
                   :body (json/generate-string
                          {:error "Failed to create token"})})))))})

(def list-tokens-handler
  {:name ::list-tokens
   :enter
   (fn [context]
     (let [user-id (get-in context [:request :identity :user-id])]
       (try
         (let [tokens (db/list-user-tokens ds user-id)]
           (assoc context :response
                  {:status 200
                   :headers {"Content-Type" "application/json"}
                   :body (json/generate-string
                          {:tokens (map tokens/format-token-response tokens)})}))
         (catch Exception e
           (log/error e "Failed to list tokens")
           (assoc context :response
                  {:status 500
                   :headers {"Content-Type" "application/json"}
                   :body (json/generate-string
                          {:error "Failed to list tokens"})})))))})

(def revoke-token-handler
  {:name ::revoke-token
   :enter
   (fn [context]
     (let [user-id (get-in context [:request :identity :user-id])
           token-id (-> context :request :path-params :id)]
       (try
         (if (db/revoke-token! ds (parse-long token-id) user-id)
           (assoc context :response
                  {:status 200
                   :headers {"Content-Type" "application/json"}
                   :body (json/generate-string
                          {:message "Token revoked successfully"})})
           (assoc context :response
                  {:status 404
                   :headers {"Content-Type" "application/json"}
                   :body (json/generate-string
                          {:error "Token not found or unauthorized"})}))
         (catch Exception e
           (log/error e "Failed to revoke token")
           (assoc context :response
                  {:status 500
                   :headers {"Content-Type" "application/json"}
                   :body (json/generate-string
                          {:error "Failed to revoke token"})})))))})

(def validate-api-token-handler
  {:name ::validate-api-token
   :enter
   (fn [context]
     (let [auth-header (get-in context [:request :headers "authorization"])
           token (tokens/extract-token-from-header auth-header)]
       (if (and token (tokens/valid-token-format? token))
         (try
           (if-let [token-data (db/find-token-by-hash ds (tokens/hash-token token))]
             (if (tokens/token-expired? (:expires-at token-data))
               (assoc context :response
                      {:status 401
                       :headers {"Content-Type" "application/json"}
                       :body (json/generate-string
                              {:valid false
                               :error "Token expired"})})
               (do
                 ;; Update last used timestamp
                 (db/update-token-last-used! ds (:id token-data))
                 (assoc context :response
                        {:status 200
                         :headers {"Content-Type" "application/json"}
                         :body (json/generate-string
                                {:valid true
                                 :user_id (:user-id token-data)
                                 :scopes (:scopes token-data)
                                 :token_id (:id token-data)})})))
             (assoc context :response
                    {:status 401
                     :headers {"Content-Type" "application/json"}
                     :body (json/generate-string
                            {:valid false
                             :error "Invalid token"})}))
           (catch Exception e
             (log/error e "Token validation error")
             (assoc context :response
                    {:status 500
                     :headers {"Content-Type" "application/json"}
                     :body (json/generate-string
                            {:valid false
                             :error "Token validation failed"})})))
         (assoc context :response
                {:status 400
                 :headers {"Content-Type" "application/json"}
                 :body (json/generate-string
                        {:valid false
                         :error "Invalid token format"})}))))})

(def routes
  #{["/health" :get
     (fn [_]
       (try
         (jdbc/execute-one! ds ["SELECT 1"])
         {:status 200
          :headers {"Content-Type" "application/json"}
          :body (json/generate-string
                 {:status "healthy"
                  :db "connected"})}
         (catch Exception e
           {:status 500
            :headers {"Content-Type" "application/json"}
            :body (json/generate-string
                   {:status "unhealthy"
                    :db "disconnected"})})))
     :route-name :health-check]

    ["/api/guest-auth" :post
     guest-auth-handler
     :route-name :guest-auth]

    ["/api/guest-auth" :options
     (fn [_]
       {:status 200
        :headers {"Access-Control-Allow-Origin" "*"
                  "Access-Control-Allow-Methods" "POST, OPTIONS"
                  "Access-Control-Allow-Headers" "Content-Type, Authorization"
                  "Access-Control-Max-Age" "3600"}})
     :route-name :guest-auth-options]

    ["/api/login" :post
     (assoc login-handler
            :error (fn [context e]
                     {:status 401
                      :headers {"Content-Type" "application/json"}
                      :body (json/generate-string
                             {:error "Authentication failed"})}))
     :route-name :login]

    ["/api/validate" :post
     (conj common-interceptors json-response-interceptor
           (fn [request]
             {:status 200
              :body (json/generate-string
                     {:message "Token valid"
                      :identity (:identity request)})}))
     :route-name :validate-token]

    ["/auth/profile" :get
     (conj common-interceptors json-response-interceptor
           (fn [request]
             (let [identity (:identity request)]
               {:status 200
                :body (json/generate-string
                       {:sub (:user-id identity)
                        :username (:email identity)})})))
     :route-name :get-profile]

    ;; Token management endpoints
    ["/api/tokens/create" :post
     (conj common-interceptors json-body-interceptor json-response-interceptor
           create-token-handler)
     :route-name :create-token]

    ["/api/tokens" :get
     (conj common-interceptors json-response-interceptor
           list-tokens-handler)
     :route-name :list-tokens]

    ["/api/tokens/:id" :delete
     (conj common-interceptors json-response-interceptor
           revoke-token-handler)
     :route-name :revoke-token]

    ;; API token validation endpoint (no JWT auth required)
    ["/api/validate-token" :post
     (conj [json-response-interceptor]
           validate-api-token-handler)
     :route-name :validate-api-token]})

(def expanded-routes
  (route/expand-routes routes))

(def service-map
  (-> {::http/routes expanded-routes
       ::http/type   :jetty
       ::http/host   "0.0.0.0"
       ::http/port   (:port env)
       ::http/join?  false
       ::http/mime-types {"application/json" :json}
       ::http/secure-headers nil  ; Disable secure headers for CORS
       ::http/body-params {:edn :edn-string
                           :json json/decode}
       ::http/json-body {:encoder json/encode
                         :decoder json/decode
                         :decode-key-fn keyword}}
      http/default-interceptors
      (update ::http/interceptors conj (cors/allow-origin cors-config))
      (update ::http/interceptors conj json-response-interceptor)))


(defonce server (atom nil))

(defn start []
  (println "SOMETHING ACTUALLY HAPPENED!!!!")
  (when-not @server
    (reset! server (http/start (http/create-server service-map)))
    (log/info "Server started on port" (:port env))))

(defn stop []
  (when @server
    (http/stop @server)
    (reset! server nil)
    (log/info "Server stopped")))

(defn -main [& args]
  (.addShutdownHook (Runtime/getRuntime)
                    (Thread. ^Runnable stop))
  (start))

(comment
  ;; REPL Development
  (start)

  (stop)

  ;; Test DB connection
  (jdbc/execute-one! ds ["SELECT * FROM users LIMIT 1"])

  ;; Test user verification
  (verify-user "suck.muhdik@gmail.com" "changeme")

  (verify-user "doesnt.exist@gmail.com","whatever")

  (println (str (tokens/generate-secure-token) "!2"))

  (let [token (tokens/generate-secure-token)]
    (println "Generated token:" token)
    (let [hashed-token (tokens/hash-token token)]
      (println "Hashed token:" hashed-token)
      (println "Token format valid:" (tokens/valid-token-format? token))
      (println "Token valid:" (tokens/verify-token token hashed-token))
      (println "Token invalid:" (tokens/verify-token "invalid-token" hashed-token))))

  (let [token (tokens/generate-secure-token)
        foo (db/register-token! ds
                                2
                                token
                                "Test Token"
                                "This is a test token"
                                ["read" "write"]
                                (java.time.Instant/parse "2024-12-31T23:59:59Z"))
        bar (db/find-token-by-hash ds token)]


    (println "Created token:" token)
    (println "registered token:" foo)
    (println "Found token:" bar))

  (println (db/list-user-tokens ds 2))

  (db/find-token-by-hash ds "srt_40egFxdHBdGRs-3-9Bzbnv1Wj8liJsm85C2jPHtDCLA")

  (db/revoke-token! ds 1 2)

  (hashers/check "bcrypt+sha512$99be381110fcb43a663e7bb196dec8a1$12$d55ebeacc55bee65070a30fb91d7058b03483d511e415275"
                 "bcrypt+sha512$16a3759c51c25fb9d81e3b36ff715e4a$12$28b20e48ff9f26bd2414684608fc3ba839e72aa060356b33")

  (hashers/verify "srt_40egFxdHBdGRs-3-9Bzbnv1Wj8liJsm85C2jPHtDCLA"
                  "bcrypt+sha512$16a3759c51c25fb9d81e3b36ff715e4a$12$28b20e48ff9f26bd2414684608fc3ba839e72aa060356b33")

  (println (tokens/hash-token "srt_40egFxdHBdGRs-3-9Bzbnv1Wj8liJsm85C2jPHtDCLA"))

  (print))


;; (create-test-user!
;;   "suck.muhdik@gmail.com"
;;   "john"
;;   "changeme")
