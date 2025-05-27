(ns io.relica.shutter.db
  (:require [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [buddy.hashers :as hashers]
            [clojure.tools.logging :as log]
            [clojure.string :as str]))


(defn pg-array->vec [obj]
  (when (instance? org.postgresql.jdbc.PgArray obj)
    (vec (.getArray obj))))

(defn convert-pg-types [row]
  (reduce-kv (fn [m k v]
               (assoc m k (cond
                           (instance? org.postgresql.jdbc.PgArray v)
                           (vec (.getArray v))

                           (instance? java.sql.Timestamp v)
                           (.toInstant v)

                           (instance? java.sql.Date v)
                           (.toLocalDate v)

                           (instance? java.sql.Time v)
                           (.toLocalTime v)

                           :else v)))
             {} row))
;; Token-related database operations

(defn register-token!
  ;; [ds user-id name description scopes expires-at]
  [ds user-id token name description scopes expires-at]
  (let [token-id (inc (or (:max (jdbc/execute-one! ds
                                                  ["SELECT MAX(id) as max FROM access_tokens"]
                                                  {:builder-fn rs/as-unqualified-maps})) 0))
        ;; random-part (generate-random-token 32)
        full-token (str  token "." token-id)
        token-hash (hashers/derive full-token)]

    (jdbc/execute-one! ds
                      ["INSERT INTO access_tokens (id, user_id, name, description, scopes, expires_at, token_hash)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                        RETURNING id, name, description, scopes, expires_at, created_at"
                       token-id user-id name description
                       (when scopes (into-array String scopes))
                       (when expires-at (java.sql.Timestamp/from expires-at))
                       token-hash]
                      {:builder-fn rs/as-unqualified-maps})
    full-token))

(defn list-user-tokens
  "List all active tokens for a specific user"
  [ds user-id]
  (try
    (jdbc/execute! ds
                   ["SELECT id, name, description, scopes, last_used_at, expires_at, created_at
        FROM access_tokens
        WHERE user_id = ? AND is_active = true
        ORDER BY created_at DESC"
                    user-id]
                   {:builder-fn rs/as-unqualified-maps})
    (catch Exception e
      (log/error e "Failed to list user tokens")
      [])))

(defn find-token-by-hash
  "Find an active token by checking the provided token against stored hash"
  [ds provided-token]
  (try
    ;; Extract token ID from the token
    (when-let [[_ token-id-str] (str/split provided-token #"\." 2)]
      (when-let [token-id (try (Integer/parseInt token-id-str)
                              (catch NumberFormatException _ nil))]

        ;; Direct lookup by ID
        (when-let [token-record (jdbc/execute-one! ds
                                                  ["SELECT t.*, u.email, u.username, u.is_admin
                                                    FROM access_tokens t
                                                    JOIN users u ON t.user_id = u.id
                                                    WHERE t.id = ? AND t.is_active = true"
                                                   token-id]
                                                  {:builder-fn rs/as-unqualified-maps})]

          ;; Verify the full token against stored hash
          (when (:valid (hashers/verify provided-token (:token_hash token-record)))
            (convert-pg-types token-record)))))

    (catch Exception e
      (log/error e "Failed to find token by hash")
      nil)))

(defn revoke-token!
  "Soft delete a token by marking it as inactive"
  [ds token-id user-id]
  (try
    (let [result (jdbc/execute-one! ds
                                    ["UPDATE access_tokens
                     SET is_active = false
                     WHERE id = ? AND user_id = ?
                     RETURNING id"
                                     token-id user-id]
                                    {:builder-fn rs/as-unqualified-maps})]
      (boolean result))
    (catch Exception e
      (log/error e "Failed to revoke token")
      false)))

(defn update-token-last-used!
  "Update the last_used_at timestamp for a token"
  [ds token-id]
  (try
    (jdbc/execute-one! ds
                       ["UPDATE access_tokens
        SET last_used_at = CURRENT_TIMESTAMP
        WHERE id = ?"
                        token-id])
    (catch Exception e
      (log/error e "Failed to update token last used timestamp")
      nil)))

(defn token-exists?
  "Check if a token with the given name already exists for a user"
  [ds user-id token-name]
  (try
    (let [result (jdbc/execute-one! ds
                                    ["SELECT COUNT(*) as count
                     FROM access_tokens
                     WHERE user_id = ? AND name = ? AND is_active = true"
                                     user-id token-name]
                                    {:builder-fn rs/as-unqualified-maps})]
      (> (:count result) 0))
    (catch Exception e
      (log/error e "Failed to check token existence")
      false)))

(defn get-user-token-count
  "Get the count of active tokens for a user"
  [ds user-id]
  (try
    (let [result (jdbc/execute-one! ds
                                    ["SELECT COUNT(*) as count
                     FROM access_tokens
                     WHERE user_id = ? AND is_active = true"
                                     user-id]
                                    {:builder-fn rs/as-unqualified-maps})]
      (:count result))
    (catch Exception e
      (log/error e "Failed to get user token count")
      0)))
