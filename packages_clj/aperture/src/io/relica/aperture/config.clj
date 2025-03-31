(ns io.relica.aperture.config
  (:require [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [taoensso.nippy :as nippy]
            [clojure.string :as str]
            [clojure.tools.logging :as log]))

;; WebSocket Port Configuration
(defn get-ws-port []
  (or (some-> (System/getenv "APERTURE_WS_PORT") parse-long)
      2175)) ; Default port

;; Database configuration
(def db-spec
  {:dbtype "postgresql"
   :dbname (or (System/getenv "POSTGRES_DB") "postgres")
   :host (or (System/getenv "POSTGRES_HOST") "localhost")
   :user (or (System/getenv "POSTGRES_USER") "postgres")
   :password (or (System/getenv "POSTGRES_PASSWORD") "password")
   :port (parse-long (or (System/getenv "POSTGRES_PORT") "5432"))})

(def ds (jdbc/get-datasource db-spec))

;; Safe thaw function that handles null values
(defn safe-thaw [data]
  (if (nil? data)
    []  ;; Return empty vector for null values
    (try
      (nippy/thaw data)
      (catch Exception e
        (log/warn "Error deserializing data:" (ex-message e))
        []))))

(defn get-user-environments
  "Retrieve all environments for a user"
  [user-id]
  (let [envs (jdbc/execute! ds
                            ["SELECT e.*, ue.is_owner, ue.can_write, ue.last_accessed
                 FROM environments e
                 JOIN user_environments ue ON e.id = ue.environment_id
                 WHERE ue.user_id = ?" user-id]
                            {:builder-fn rs/as-unqualified-maps})]
    (map #(-> %
              (update :facts safe-thaw)
              (update :models safe-thaw))
         envs)))

(defn get-user-environment
  "Retrieve specific environment by user-id and env-id"
  [user-id env-id]
  (when-let [user-env (jdbc/execute-one! ds
                                         ["SELECT e.*, ue.is_owner, ue.can_write, ue.last_accessed
                          FROM environments e
                          JOIN user_environments ue ON e.id = ue.environment_id
                          WHERE ue.user_id = ? AND e.id = ?" user-id env-id]
                                         {:builder-fn rs/as-unqualified-maps})]
    (let [now (System/currentTimeMillis)
          parsed-env (-> user-env
                         (update :facts safe-thaw)
                         (update :models safe-thaw))]
      (log/info "Environment parsing time:" (- (System/currentTimeMillis) now) "ms")
      parsed-env)))

(defn create-environment!
  "Create a new environment with a name and return it"
  [env-name]
  (let [empty-array (nippy/freeze [])]
    (jdbc/execute-one! ds
                       ["INSERT INTO environments (name, facts, models)
        VALUES (?, ?, ?)
        RETURNING *" env-name empty-array empty-array]
                       {:builder-fn rs/as-unqualified-maps})))

(defn create-user-environment!
  "Create initial environment for user with a name"
  [user-id env-name]
  (jdbc/with-transaction [tx ds]
    (let [env (create-environment! env-name)]
      ;; Create the user-environment association
      (jdbc/execute-one! tx
                        ["INSERT INTO user_environments (user_id, environment_id, is_owner, can_write)
                          VALUES (?, ?, true, true)"
                         user-id (:id env)])
      ;; Return the full environment
      (get-user-environment user-id (:id env)))))

(defn update-user-environment!
  "Update specific fields in user's environment"
  [user-id env-id updates]
  (let [user-id (long user-id)
        ;; Verify user has write access to this environment
        can-write-result (jdbc/execute-one! ds
                                  ["SELECT can_write FROM user_environments
                                    WHERE user_id = ? AND environment_id = ?"
                                   user-id env-id])
        can-write? (:user_environments/can_write can-write-result)

        ;; Build the update query for environments table
        set-clauses (remove nil?
                           [(when (:name updates) "name = ?")
                            (when (:facts updates) "facts = ?")
                            (when (:models updates) "models = ?")
                            (when (:selected_entity_id updates) "selected_entity_id = ?")
                            (when (:selected_entity_type updates) "selected_entity_type = ?::entity_fact_enum")])

        ;; Generate the values for update fields
        set-values (remove nil?
                          [(when (:name updates) (:name updates))
                           (when (:facts updates) (nippy/freeze (:facts updates)))
                           (when (:models updates) (nippy/freeze (:models updates)))
                           (when (:selected_entity_id updates) (:selected_entity_id updates))
                           (when (:selected_entity_type updates) (name (:selected_entity_type updates)))])

        ;; Only proceed if we have write access and updates to make
        updated-env (when (and can-write? (seq set-clauses))
                     (let [query (str "UPDATE environments SET "
                                     (str/join ", " set-clauses)
                                     " WHERE id = ? RETURNING *")
                           all-values (conj (vec set-values) env-id)]
                       ;; Update the environment
                       (try
                         (jdbc/execute-one! ds
                                          (into [query] all-values)
                                          {:builder-fn rs/as-unqualified-maps})
                         (catch Exception e
                           (log/error "SQL error:" (ex-message e))
                           (tap> (str "SQL error: " (.getMessage e)))
                           nil))))
        
        ;; Update last_accessed in user_environments
        _ (when can-write?
            (jdbc/execute-one! ds
                             ["UPDATE user_environments SET last_accessed = CURRENT_TIMESTAMP
                               WHERE user_id = ? AND environment_id = ?"
                              user-id env-id]))]
    
    ;; Return the full updated environment
    (when updated-env
      (get-user-environment user-id env-id))))

(defn deselect-entity!
  "Clear the selected entity for a user's environment"
  [user-id env-id]
  (let [user-id (long user-id)
        ;; Verify user has write access to this environment
        can-write-result (jdbc/execute-one! ds
                               ["SELECT can_write FROM user_environments
                                 WHERE user_id = ? AND environment_id = ?"
                                user-id env-id])
        can-write? (:user_environments/can_write can-write-result)

        ;; Execute explicit NULL update
        updated-env (when can-write?
                      (try
                        (jdbc/execute-one! ds
                                         ["UPDATE environments SET selected_entity_id = NULL WHERE id = ? RETURNING *"
                                          env-id]
                                         {:builder-fn rs/as-unqualified-maps})
                        (catch Exception e
                          (tap> (str "SQL error: " (.getMessage e)))
                          nil)))

        ;; Update last_accessed in user_environments
        _ (when can-write?
            (jdbc/execute-one! ds
                             ["UPDATE user_environments SET last_accessed = CURRENT_TIMESTAMP
                              WHERE user_id = ? AND environment_id = ?"
                              user-id env-id]))]

    ;; Return the full updated environment
    (when updated-env
      (get-user-environment user-id env-id))))

(defn select-entity!
  [user-id env-id entity-uid]
  (update-user-environment! user-id env-id {:selected_entity_id entity-uid}))

(defn get-default-environment
  "Get the most recently accessed environment for a user"
  [user-id]
  (let [user-id (if (string? user-id) (parse-long user-id) user-id)
        env-query ["SELECT environment_id 
                    FROM user_environments 
                    WHERE user_id = ? 
                    ORDER BY last_accessed DESC 
                    LIMIT 1" user-id]
        env-id  (:user_environments/environment_id (jdbc/execute-one! ds env-query))]
    (if env-id
      (try
        (get-user-environment user-id env-id)
        (catch Exception e
          (log/error "Error getting default environment:" (ex-message e))
          (tap> {:msg "Error getting default environment" :user-id user-id :error (ex-message e)})
          ;; Return a minimal valid environment structure with empty collections
          {:id env-id
           :facts []
           :models []
           :user_id user-id}))
      (do
        (tap> {:msg "No default environment found" :user-id user-id})
        nil))))
