(ns io.relica.shutter.tokens
  (:require [buddy.hashers :as hashers]
            [clojure.string :as str]
            [clojure.tools.logging :as log])
  (:import [java.security SecureRandom]
           [java.util Base64]))

;; Token configuration
(def ^:const TOKEN_PREFIX "srt_")
(def ^:const TOKEN_LENGTH 32) ; bytes, will be base64 encoded
(def ^:const MAX_TOKENS_PER_USER 10) ; Rate limiting

;; Token generation

(defn generate-secure-token
  "Generate a cryptographically secure random token with srt_ prefix"
  []
  (let [random-bytes (byte-array TOKEN_LENGTH)
        secure-random (SecureRandom.)]
    (.nextBytes secure-random random-bytes)
    (str TOKEN_PREFIX
         (-> (Base64/getUrlEncoder)
             (.withoutPadding)
             (.encodeToString random-bytes)))))

(defn hash-token
  "Hash a token using bcrypt"
  [token]
  (hashers/derive token {:algorithm :bcrypt}))

(defn verify-token
  "Verify a token against its hash"
  [token hash]
  (try
    (hashers/verify token hash)
    (catch Exception e
      (log/debug e "Token verification failed")
      false)))

;; Token validation

(defn valid-token-format?
  "Check if token has valid format (starts with srt_ and may include an ID component)"
  [token]
  (and (string? token)
       (str/starts-with? token TOKEN_PREFIX)
       (> (count token) (count TOKEN_PREFIX))))

(defn extract-token-from-header
  "Extract token from Authorization header"
  [auth-header]
  (when auth-header
    (let [parts (str/split auth-header #" " 2)]
      (when (and (= 2 (count parts))
                 (= "Bearer" (first parts)))
        (second parts)))))

(defn token-expired?
  "Check if token has expired"
  [expires-at]
  (when expires-at
    (let [now (java.time.Instant/now)
          expiry (java.time.Instant/parse expires-at)]
      (.isBefore expiry now))))

;; Scope validation

(def valid-scopes #{"read" "write" "admin" "websocket"})

(defn validate-scopes
  "Validate that all provided scopes are valid"
  [scopes]
  (every? valid-scopes scopes))

(defn has-scope?
  "Check if token has a specific scope"
  [token-scopes required-scope]
  (contains? (set token-scopes) required-scope))

(defn has-any-scope?
  "Check if token has any of the required scopes"
  [token-scopes required-scopes]
  (some #(has-scope? token-scopes %) required-scopes))

(defn has-all-scopes?
  "Check if token has all of the required scopes"
  [token-scopes required-scopes]
  (every? #(has-scope? token-scopes %) required-scopes))

;; Token creation helpers

(defn prepare-token-data
  "Prepare token data for creation with defaults"
  [{:keys [name description scopes expires-in-days] :as params}]
  (let [expires-at (when expires-in-days
                     (.toString
                      (.plus (java.time.Instant/now)
                             expires-in-days
                             java.time.temporal.ChronoUnit/DAYS)))]
    {:name (or name "API Token")
     :description description
     :scopes (or scopes ["read"])
     :expires-at expires-at}))

(defn format-token-response
  "Format token data for API response (remove sensitive fields)"
  [token-data]
  (dissoc token-data :token-hash :user-id))

;; Rate limiting helpers

(defn can-create-token?
  "Check if user can create more tokens (rate limiting)"
  [current-token-count]
  (< current-token-count MAX_TOKENS_PER_USER))