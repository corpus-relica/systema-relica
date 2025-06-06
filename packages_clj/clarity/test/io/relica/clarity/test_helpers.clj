(ns io.relica.clarity.test-helpers
  "Test helpers for the clarity module."
  (:require [clojure.test :refer :all]
            [io.relica.common.test-helpers :as test-helpers]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]))

;; Re-export common helpers
(def wait-for test-helpers/wait-for)
(def mock-ws-message test-helpers/mock-ws-message)
(def capture-reply test-helpers/capture-reply)
(def mock-request test-helpers/mock-request)
(def mock-response test-helpers/mock-response)

;; Additional helpers for Clarity tests
(defn wait-for-reply
  "Wait for a reply to be captured by a capture-reply function"
  [capture-data & [timeout-ms]]
  (let [timeout (or timeout-ms 1000)
        end-time (+ (System/currentTimeMillis) timeout)]
    (loop []
      (let [responses @(:responses capture-data)]
        (cond
          (seq responses) (last responses)
          (> (System/currentTimeMillis) end-time) nil
          :else (do (Thread/sleep 10)
                   (recur)))))))

;; Mock WebSocket handler test helper
(defn mock-ws-handler-test
  "Helper for testing WebSocket handlers"
  [handler-fn message expected-response]
  (let [capture (capture-reply)]
    (handler-fn (assoc message :reply (:reply-fn capture)))
    (wait-for-reply capture)))

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