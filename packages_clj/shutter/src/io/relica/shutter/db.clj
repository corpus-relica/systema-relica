(ns io.relica.shutter.db
  (:require [next.jdbc :as jdbc]
            [next.jdbc.result-set :as rs]
            [clojure.tools.logging :as log]))

;; Token-related database operations

(defn create-token!
  "Create a new access token record in the database"
  [ds user-id token-hash name description scopes expires-at]
  (try
    (jdbc/execute-one! ds
                       ["INSERT INTO access_tokens 
        (user_id, token_hash, name, description, scopes, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING id, name, description, scopes, expires_at, created_at"
                        user-id token-hash name description
                        (when scopes (into-array String scopes))
                        expires-at]
                       {:builder-fn rs/as-unqualified-maps})
    (catch Exception e
      (log/error e "Failed to create access token")
      (throw e))))

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
  "Find an active token by its hash"
  [ds token-hash]
  (try
    (jdbc/execute-one! ds
                       ["SELECT t.*, u.email, u.username, u.is_admin
        FROM access_tokens t
        JOIN users u ON t.user_id = u.id
        WHERE t.token_hash = ? AND t.is_active = true"
                        token-hash]
                       {:builder-fn rs/as-unqualified-maps})
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