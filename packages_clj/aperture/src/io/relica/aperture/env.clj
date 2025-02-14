(ns io.relica.aperture.env
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [io.pedestal.http.cors :as cors]
            [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [cheshire.core :as json]
            [clojure.core.async :as async]
            [clojure.tools.logging :as log]
            ))

;; Database configuration
(def db-spec
  {:dbtype "postgresql"
   :dbname (or (System/getenv "POSTGRES_DB") "postgres")
   :host (or (System/getenv "POSTGRES_HOST") "localhost");;"postgres")
   :user (or (System/getenv "POSTGRES_USER") "postgres")
   :password (or (System/getenv "POSTGRES_PASSWORD") "password")
   :port (parse-long (or (System/getenv "POSTGRES_PORT") "5432"))})

(def ds (jdbc/get-datasource db-spec))

(defn get-user-environment
  "Retrieve user's environment by user-id"
  [user-id]
  (tap> (str "!!!!! Getting environment for user:" user-id))
  (let [raw-env (jdbc/execute-one! ds
                  ["SELECT * FROM user_environments WHERE user_id = ?" user-id]
                  {:builder-fn rs/as-unqualified-maps})
        ;; Parse the JSON fields from PGobjects
        parsed-env (-> raw-env
                      (update :facts #(json/parse-string (.getValue %) true))
                      (update :models #(json/parse-string (.getValue %) true)))]
    (tap> (str "Parsed environment:"))
    (tap> parsed-env)
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
        all-values (conj all-values user-id)
        updated-env (jdbc/execute-one!
                     ds
                     (into [query] all-values)
                     {:builder-fn rs/as-unqualified-maps})]  ; Add user-id at the end

    ;; Debug output
    (println "Debug - Query:" query)
    (println "Debug - Values:" (vec all-values))
    (println "Debug - user-id type:" (type user-id))


    updated-env))
