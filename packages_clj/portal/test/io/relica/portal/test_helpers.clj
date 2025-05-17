(ns io.relica.portal.test-helpers
  "Test helpers for the portal module."
  (:require [midje.sweet :refer :all]
            [io.relica.common.test.midje-helpers :as midje-helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]))

;; Re-export common helpers
(def wait-for midje-helpers/wait-for)
(def async-fact midje-helpers/async-fact)
(def mock-ws-message midje-helpers/mock-ws-message)
(def capture-reply midje-helpers/capture-reply)
(def ws-handler-test midje-helpers/ws-handler-test)
(def with-test-db midje-helpers/with-test-db)
(def mock-request midje-helpers/mock-request)
(def mock-response midje-helpers/mock-response)

;; Portal-specific test helpers

(defn mock-http-request
  "Creates a mock HTTP request for testing."
  [& {:keys [method uri headers body params]
      :or {method :get
           uri "/"
           headers {}
           body nil
           params {}}}]
  {:request-method method
   :uri uri
   :headers headers
   :body body
   :params params})

(defn mock-http-response
  "Creates a mock HTTP response for testing."
  [& {:keys [status headers body]
      :or {status 200
           headers {"Content-Type" "application/json"}
           body nil}}]
  {:status status
   :headers headers
   :body body})

(defn mock-user
  "Creates a mock user for testing."
  [& {:keys [id username email]
      :or {id "test-user-id"
           username "test-user"
           email "test@example.com"}}]
  {:id id
   :username username
   :email email})

(defn mock-auth-token
  "Creates a mock authentication token for testing."
  [& {:keys [user-id token]
      :or {user-id "test-user-id"
           token "test-token"}}]
  {:user_id user-id
   :token token
   :created_at (java.util.Date.)
   :expires_at (java.util.Date. (+ (System/currentTimeMillis) (* 24 60 60 1000)))})

(defn with-mock-auth
  "Macro to run tests with mock authentication.
   Takes a user map and a body of code to run with that user."
  [user & body]
  `(binding [*current-user* ~user]
     ~@body))