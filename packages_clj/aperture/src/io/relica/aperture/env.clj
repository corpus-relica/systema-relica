(ns io.relica.aperture.env
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
   :host (or (System/getenv "POSTGRES_HOST") "localhost")
   :user (or (System/getenv "POSTGRES_USER") "postgres")
   :password (or (System/getenv "POSTGRES_PASSWORD") "password")
   :port (parse-long (or (System/getenv "POSTGRES_PORT") "5432"))})

(def ds (jdbc/get-datasource db-spec))

(defn get-user-environments
  "Retrieve all environments for a user"
  [user-id]
  (tap> (str "Getting all environments for user:" user-id))
  (let [envs (jdbc/execute! ds
                            ["SELECT e.*, ue.is_owner, ue.can_write, ue.last_accessed
                 FROM environments e
                 JOIN user_environments ue ON e.id = ue.environment_id
                 WHERE ue.user_id = ?" user-id]
                            {:builder-fn rs/as-unqualified-maps})]
    (map #(-> %
              (update :facts (fn [f] (json/parse-string (.getValue f) true)))
              (update :models (fn [m] (json/parse-string (.getValue m) true))))
         envs)))

(defn get-user-environment
  "Retrieve specific environment by user-id and env-id"
  [user-id env-id]
  (tap> (str "Getting environment " env-id " for user:" user-id))
  (when-let [user-env (jdbc/execute-one! ds
                                         ["SELECT e.*, ue.is_owner, ue.can_write, ue.last_accessed
                          FROM environments e
                          JOIN user_environments ue ON e.id = ue.environment_id
                          WHERE ue.user_id = ? AND e.id = ?" user-id env-id]
                                         {:builder-fn rs/as-unqualified-maps})]
    (let [parsed-env (-> user-env
                         (update :facts #(json/parse-string (.getValue %) true))
                         (update :models #(json/parse-string (.getValue %) true)))]
      (tap> (str "Parsed environment:"))
      (tap> parsed-env)
      parsed-env)))

(defn create-environment!
  "Create a new environment with a name and return it"
  [env-name]
  (let [empty-json-array (json/generate-string [])]
    (jdbc/execute-one! ds
                       ["INSERT INTO environments (name, facts, models)
        VALUES (?, ?, ?)
        RETURNING *" env-name empty-json-array empty-json-array]
                       {:builder-fn rs/as-unqualified-maps})))

(defn create-user-environment!
  "Create initial environment for user with a name"
  [user-id env-name]
  (jdbc/with-transaction [tx ds]
    (let [env (create-environment! env-name)
          user-env (jdbc/execute-one! tx
                                      ["INSERT INTO user_environments (user_id, environment_id, is_owner, can_write)
                            VALUES (?, ?, true, true)
                            RETURNING *" user-id (:id env)]
                                      {:builder-fn rs/as-unqualified-maps})]
      (get-user-environment user-id (:id env)))))

(defn update-user-environment!
  "Update specific fields in user's environment"
  [user-id env-id updates]
  (let [user-id (long user-id)
        ;; Verify user has write access to this environment
        can-write? (:can_write (jdbc/execute-one! ds
                                                  ["SELECT can_write FROM user_environments 
                                 WHERE user_id = ? AND environment_id = ?"
                                                   user-id env-id]))

        ;; Build the update query for environments table
        set-clauses (remove nil?
                            [(when (:name updates) "name = ?")
                             (when (:facts updates) "facts = ?::jsonb")
                             (when (:models updates) "models = ?::jsonb")
                             (when (:selected_entity_id updates) "selected_entity_id = ?")
                             (when (:selected_entity_type updates) "selected_entity_type = ?::entity_fact_enum")])

        ;; Generate the values for update fields
        set-values (remove nil?
                           [(when (:name updates) (:name updates))
                            (when (:facts updates) (json/generate-string (:facts updates)))
                            (when (:models updates) (json/generate-string (:models updates)))
                            (when (:selected_entity_id updates) (:selected_entity_id updates))
                            (when (:selected_entity_type updates) (name (:selected_entity_type updates)))])

        ;; Only proceed if we have write access and updates to make
        updated-env (when (and can-write? (seq set-clauses))
                      (let [query (str "UPDATE environments SET "
                                       (clojure.string/join ", " set-clauses)
                                       " WHERE id = ? RETURNING *")
                            all-values (conj (vec set-values) env-id)]
                       ;; Update the environment
                        (jdbc/execute-one! ds
                                           (into [query] all-values)
                                           {:builder-fn rs/as-unqualified-maps})))

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
  (tap> {:msg "Getting default environment" :user-id user-id})
  (let [user-id (if (string? user-id) (parse-long user-id) user-id)
        env-query ["SELECT environment_id 
                    FROM user_environments 
                    WHERE user_id = ? 
                    ORDER BY last_accessed DESC 
                    LIMIT 1" user-id]
        env-id  (:user_environments/environment_id (jdbc/execute-one! ds env-query))]
    (tap> {:msg "Found default environment" :env-id env-id})
    (tap> (jdbc/execute-one! ds env-query))
    (if env-id
      (do
        (tap> {:msg "Found default environment" :env-id env-id})
        (get-user-environment user-id env-id))
      (do
        (tap> {:msg "No default environment found" :user-id user-id})
        nil))))
