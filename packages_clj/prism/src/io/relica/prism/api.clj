(ns io.relica.prism.api
  (:require [org.httpkit.server :as http]
            [io.relica.prism.setup :as setup]
            [io.relica.prism.statechart :as statechart]
            [io.relica.prism.config :as config]
            [taoensso.timbre :as log]
            [clojure.data.json :as json]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.keyword-params :refer [wrap-keyword-params]]
            ))

(def server-state (atom nil))

(defn- json-response 
  "Creates a JSON HTTP response."
  [data status]
  {:status status
   :headers {"Content-Type" "application/json"}
   :body (json/write-str data)})

(defn- handle-status 
  "Handles GET /api/setup/status requests."
  [req]
  (json-response (statechart/get-setup-state) 200))

(defn- handle-start-setup 
  "Handles POST /api/setup/start requests."
  [req]
  (setup/start-setup-sequence!)
  (json-response {:success true :message "Setup sequence started"} 200))

(defn- handle-setup-user 
  "Handles POST /api/setup/user requests with admin user creation."
  [req]
  (let [username (get-in req [:params :username])
        password (get-in req [:params :password])
        confirm-password (get-in req [:params :confirmPassword])]
    
    (if (and username password confirm-password)
      (let [validation (setup/validate-credentials username password confirm-password)]
        (if (:valid validation)
          (if (setup/create-admin-user! username password)
            (json-response {:success true :message "Admin user created successfully"} 200)
            (json-response {:success false :message "Failed to create admin user"} 500))
          (json-response {:success false :message (:message validation)} 400)))
      (json-response {:success false :message "Missing required fields"} 400))))

(defn- handle-process-stage
  "Handles POST /api/setup/process-stage requests."
  [req]
  (let [current-state (setup/get-setup-state)
        current-stage (:stage current-state)]
    
    (if (= current-stage :user-setup)
      (json-response {:success false
                     :message "User setup stage requires admin credentials"
                     :requiresUserInput true} 400)
      (do
        (setup/handle-setup-stage!)
        (json-response {:success true
                       :message "Stage processed"
                       :state (setup/get-setup-state)} 200)))))

(defn- app-handler
  "Main Ring handler for the API server."
  [{:keys [uri request-method] :as req}]
  (try
    (case [request-method uri]
      [:get "/"] 
      (json-response {:message "Prism Setup API" :version "1.0.0"} 200)
      
      [:get "/api/setup/status"] 
      (handle-status req)
      
      [:post "/api/setup/start"] 
      (handle-start-setup req)
      
      [:post "/api/setup/user"] 
      (handle-setup-user req)
      
      [:post "/api/setup/process-stage"] 
      (handle-process-stage req)
      
      ;; Default - not found
      (json-response {:error "Not found"} 404))
    (catch Exception e
      (log/error e "Error handling request:" uri)
      (json-response {:error "Internal server error" :message (.getMessage e)} 500))))

(def app
  "Main application with middleware."
  (-> app-handler
      wrap-keyword-params
      wrap-params))

(defn start-server
  "Starts the HTTP server."
  []
  (let [port (config/api-server-port)]
    (log/info "Starting API server on port" port)
    (reset! server-state (http/run-server app {:port port}))
    (log/info "API server started")))

(defn stop-server
  "Stops the HTTP server."
  []
  (when-let [stop-fn @server-state]
    (log/info "Stopping API server")
    (stop-fn :timeout 100)
    (reset! server-state nil)
    (log/info "API server stopped")))

(defn restart-server
  "Restarts the HTTP server."
  []
  (stop-server)
  (start-server))
