(ns io.relica.clarity.test-helpers
  "Test helpers for the clarity module."
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

;; Clarity-specific test helpers

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

(defn with-mock-session
  "Macro to run tests with a mock session.
   Takes a session map and a body of code to run with that session."
  [session & body]
  `(binding [*session* ~session]
     ~@body))