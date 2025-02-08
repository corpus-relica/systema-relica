(ns io.relica.shutter.core
  (:require[io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [io.pedestal.http.cors :as cors]
            [io.pedestal.interceptor :refer [interceptor]]
            [cheshire.core :as json]
            [buddy.sign.jwt :as jwt]
            [buddy.hashers :as hashers]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [clojure.string :as str]
            [clojure.tools.logging :as log])
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
  (try
    (when-let [user (jdbc/execute-one! ds
                      ["SELECT * FROM users WHERE email = ?" email]
                      {:builder-fn rs/as-unqualified-maps})]
      (log/info "Found user:" (dissoc user :password_hash))
      (log/info "Password hash:" (:password_hash user))
      (when (:is_active user)
        ;; Use buddy.hashers/check instead of bcrypt-clj
        (if (hashers/check password (:password_hash user))
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
     (let [raw-body (-> context :request :body slurp)
           body (json/parse-string raw-body true)
           {:keys [email password]} body]
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
     :route-name :get-profile]})

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
      (update ::http/interceptors conj
              (cors/allow-origin cors-config))
      (update ::http/interceptors conj json-response-interceptor)
      (update ::http/interceptors conj (cors/allow-origin cors-config))))

(defonce server (atom nil))

(defn start []
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

  ;; (create-test-user!
  ;;   "suck.muhdik@gmail.com"
  ;;   "john"
  ;;   "changeme")

  )
