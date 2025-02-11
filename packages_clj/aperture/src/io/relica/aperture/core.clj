(ns io.relica.aperture.core
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [io.pedestal.http.cors :as cors]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [cheshire.core :as json]
            [clojure.core.async :as async]
            [clojure.tools.logging :as log]
            [io.relica.io.archivist-client :as archivist]
            ))

;; Configure logging levels
(System/setProperty "org.eclipse.jetty.LEVEL" "INFO")

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
;; (defn get-user-environment
;;   "Retrieve user's environment by user-id"
;;   [user-id]
;;   (jdbc/execute-one! ds
;;     ["SELECT * FROM user_environments WHERE user_id = ?" user-id]
;;     {:builder-fn rs/as-unqualified-maps}))

(defn get-user-environment
  "Retrieve user's environment by user-id"
  [user-id]
  (let [raw-env (jdbc/execute-one! ds
                  ["SELECT * FROM user_environments WHERE user_id = ?" user-id]
                  {:builder-fn rs/as-unqualified-maps})
        ;; Parse the JSON fields from PGobjects
        parsed-env (-> raw-env
                      (update :facts #(json/parse-string (.getValue %) true))
                      (update :models #(json/parse-string (.getValue %) true)))]
    parsed-env))

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
  (let [user-id (long user-id)

        set-clauses (remove nil?
                     [(when (:facts updates) "facts = ?::jsonb")
                      (when (:models updates) "models = ?::jsonb")
                      (when (:selected_entity_id updates) "selected_entity_id = ?")
                      (when (:selected_entity_type updates) "selected_entity_type = ?::entity_fact_enum")
                      "last_accessed = CURRENT_TIMESTAMP"])

        ;; Generate the values for update fields
        set-values (remove nil?
                    [(when (:facts updates) (json/generate-string (:facts updates)))
                     (when (:models updates) (json/generate-string (:models updates)))
                     (when (:selected_entity_id updates) (:selected_entity_id updates))
                     (when (:selected_entity_type updates) (name (:selected_entity_type updates)))])

        query (str "UPDATE user_environments SET "
                  (clojure.string/join ", " set-clauses)
                  " WHERE user_id = ? RETURNING *")

        ;; Now append user-id at the end since that's where the WHERE clause is
        all-values (vec set-values)  ; Convert to vector first
        all-values (conj all-values user-id)]  ; Add user-id at the end

    ;; Debug output
    (println "Debug - Query:" query)
    (println "Debug - Values:" (vec all-values))
    (println "Debug - user-id type:" (type user-id))

    (jdbc/execute-one! ds
      (into [query] all-values)
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

      ["/api/environment/:user-id/get" :get
       (fn [{{:keys [user-id]} :path-params}]
         (if-let [env (get-user-environment (parse-long user-id))]
           {:status 200
            :headers {"Content-Type" "application/edn"}  ;; Add this
            :body env}
           {:status 404
            :headers {"Content-Type" "application/edn"}  ;; Add this
            :body {:error "Environment not found"}}))
       :route-name ::get-environment]

      ["/api/environment/:user-id/put" :put
       (fn [{{:keys [user-id]} :path-params
             updates :json-params}]
         (if-let [updated (update-user-environment!
                           (parse-long user-id)
                           updates)]
           {:status 200
            :body updated}
           {:status 404
            :body {:error "Failed to update environment"}}))
       :route-name ::update-environment]

["/api/environment/:user-id/load-specialization-heirarchy/:uid" :get
  (fn [{{:keys [uid user-id]} :path-params}]
    (let [user-id (parse-long user-id)
          uid (parse-long uid)
          sh (archivist/get-specialization-hierarchy uid user-id)
          facts (:facts sh)]
      (println "Specialization hierarchy:" sh)
      (println sh)
      (update-user-environment! user-id {:facts facts})
      (if facts
        {:status 200
         :headers {"Content-Type" "application/edn"}  ;; Add this
         :body (pr-str facts)}                       ;; And this
        {:status 404
         :headers {"Content-Type" "application/edn"}  ;; Add this
         :body (pr-str {:error "Specialization not found"})}))) ;; And this
  :route-name ::load-specialization-hierarchy]
      }))

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
       ::http/allowed-origins {:creds true :allowed-origins (constantly true)}
       ::http/container-options {:context-configurator
                                 ;; Disable Jetty debug logging
                                 ;; it somehow pollutes the websocket traffic
       (fn [^org.eclipse.jetty.servlet.ServletContextHandler context]
         ;; Get the Jetty logger
         (let [logger (org.eclipse.jetty.util.log.Log/getLogger "org.eclipse.jetty")]
           (.setDebugEnabled logger false))
         context)}}
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

  ;; Example usage with vectors of maps:
  (def example-updates
    {:facts [{:type "fact1"
              :value "value1"
              :metadata {:source "system1"}}
             {:type "fact2"
              :value "value2"
              :metadata {:source "system2"}}]
     :models [{:type "model1"
               :params {:p1 "v1"}
               :status "active"}
              {:type "model2"
               :params {:p2 "v2"}
               :status "pending"}]
     :selected_entity_id 42
     :selected_entity_type :person})

  ;; Example calls:
  ;; Update just facts
  (update-user-environment! 7
    {:facts [{:type "new-fact"
              :value "some value"
              :metadata {:source "user-input"}}]})

  ;; Update just models
  (update-user-environment! 7
    {:models [{:type "new-model"
               :params {:key "value"}
               :status "active"}]})

  ;; Update multiple fields
  (update-user-environment! 7 example-updates)

  (println (get-user-environment 7))

  )
