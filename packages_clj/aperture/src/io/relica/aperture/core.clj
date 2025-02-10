(ns io.relica.aperture.core
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [io.pedestal.http.cors :as cors]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [cheshire.core :as json]
            [clojure.core.async :as async]
            [clojure.tools.logging :as log]))

;; Database configuration
(def db-spec
  {:dbtype "postgresql"
   :dbname (or (System/getenv "POSTGRES_DB") "postgres")
   :host (or (System/getenv "POSTGRES_HOST") "localhost");;"postgres")
   :user (or (System/getenv "POSTGRES_USER") "postgres")
   :password (or (System/getenv "POSTGRES_PASSWORD") "password")
   :port (parse-long (or (System/getenv "POSTGRES_PORT") "5432"))})

(def ds (jdbc/get-datasource db-spec))

;; Environment Operations
(defn get-user-environment
  "Retrieve user's environment by user-id"
  [user-id]
  (jdbc/execute-one! ds
    ["SELECT * FROM user_environments WHERE user_id = ?" user-id]
    {:builder-fn rs/as-unqualified-maps}))

(defn create-user-environment!
  "Create initial environment for user"
  [user-id]
  (jdbc/execute-one! ds
    ["INSERT INTO user_environments (user_id, facts, models)
      VALUES (?, '[]'::jsonb, '[]'::jsonb)
      RETURNING *" user-id]
    {:builder-fn rs/as-unqualified-maps}))

(defn update-user-environment!
  "Update specific fields in user's environment"
  [user-id updates]
  (let [set-clauses (remove nil?
                     [(when (:facts updates) "facts = ?::jsonb")
                      (when (:models updates) "models = ?::jsonb")
                      (when (:selected_entity_id updates) "selected_entity_id = ?")
                      (when (:selected_entity_type updates) "selected_entity_type = ?::entity_fact_enum")
                      "last_accessed = CURRENT_TIMESTAMP"])
        values (remove nil?
                [(when (:facts updates) (json/generate-string (:facts updates)))
                 (when (:models updates) (json/generate-string (:models updates)))
                 (when (:selected_entity_id updates) (:selected_entity_id updates))
                 (when (:selected_entity_type updates) (name (:selected_entity_type updates)))])
        query (str "UPDATE user_environments SET "
                  (clojure.string/join ", " set-clauses)
                  " WHERE user_id = ? RETURNING *")]
    (jdbc/execute-one! ds
      (into [query] (conj values user-id))
      {:builder-fn rs/as-unqualified-maps})))

;; Environment sync channels
;; (def environment-channels (atom {}))

;; (defn broadcast-environment-update
;;   "Broadcast environment update to all subscribers"
;;   [user-id environment]
;;   (when-let [channels (get @environment-channels user-id)]
;;     (doseq [ch channels]
;;       (async/put! ch environment))))

;; ;; Message Handling
;; (defn handle-environment-message
;;   "Handle incoming environment-related messages"
;;   [{:keys [type user-id] :as msg}]
;;   (try
;;     (case type
;;       "get-environment"
;;       (if-let [env (get-user-environment user-id)]
;;         {:type "environment-update" :environment env}
;;         (let [new-env (create-user-environment! user-id)]
;;           {:type "environment-update" :environment new-env}))

;;       "update-environment"
;;       (if-let [updated (update-user-environment! user-id (:updates msg))]
;;         (do
;;           (broadcast-environment-update user-id updated)
;;           {:type "environment-updated" :environment updated})
;;         {:type "error" :message "Failed to update environment"})

;;       {:type "error" :message "Unknown message type"})
;;     (catch Exception e
;;       (log/error e "Error handling environment message")
;;       {:type "error" :message "Internal server error"})))

;; Routes
(def routes
  (route/expand-routes
    #{["/health" :get
       (fn [_]
         (try
           (jdbc/execute-one! ds ["SELECT 1"])
           {:status 200
            :body {:status "healthy"
                   :db "connected"}}
           (catch Exception e
             {:status 500
              :body {:status "unhealthy"
                     :db "disconnected"}})))
       :route-name ::health]

      ["/api/environment/:user-id" :get
       (fn [{{:keys [user-id]} :path-params}]
         (if-let [env (get-user-environment (parse-long user-id))]
           {:status 200
            :body env}
           {:status 404
            :body {:error "Environment not found"}}))
       :route-name ::get-environment]

      ["/api/environment/:user-id" :put
       (fn [{{:keys [user-id]} :path-params
             updates :json-params}]
         (if-let [updated (update-user-environment!
                           (parse-long user-id)
                           updates)]
           {:status 200
            :body updated}
           {:status 404
            :body {:error "Failed to update environment"}}))
       :route-name ::update-environment]}))

(def cors-config
  {:allowed-origins (constantly true)
   :allowed-methods [:get :post :put :delete :options]
   :allowed-headers ["Content-Type" "Authorization"]})

(def service-map
  (-> {::http/routes routes
       ::http/type :jetty
       ::http/port 2175
       ::http/host "0.0.0.0"
       ::http/join? false
       ::http/allowed-origins {:creds true :allowed-origins (constantly true)}}
      http/default-interceptors
      (update ::http/interceptors conj (cors/allow-origin cors-config))))

(defn start []
  (tap> "Starting Aperture server...")
  (-> service-map
      http/create-server
      http/start))

(defn -main [& args]
  (start))

;; REPL helpers
(comment
  (def server (start))

  (http/stop server)

  ;; Test environment operations
  (get-user-environment 7)

  (update-user-environment! 1 {:facts [[:new-fact "value"]]})

  )
