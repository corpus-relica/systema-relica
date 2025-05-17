(ns io.relica.common.test.midje-helpers
  "Common testing utilities and helpers for Midje tests across all Relica modules."
  (:require [midje.sweet :refer [fact facts contains anything]]
            [clojure.core.async :as async :refer [chan go <! >! timeout]]
            [clojure.test :as test]))

;; ===== Async Testing Helpers =====

(defn wait-for
  "Waits for a predicate to become true, with timeout.
   Returns the result of the predicate if it becomes true within the timeout,
   or throws an exception if the timeout is reached."
  ([pred] (wait-for pred 1000))
  ([pred timeout-ms]
   (let [start-time (System/currentTimeMillis)
         result (atom nil)]
     (while (and (not @result)
                 (< (- (System/currentTimeMillis) start-time) timeout-ms))
       (when (pred)
         (reset! result (pred)))
       (Thread/sleep 10))
     (or @result
         (throw (ex-info "Timed out waiting for condition"
                         {:timeout-ms timeout-ms}))))))

(defn async-fact
  "Runs a Midje fact in a way that supports async testing.
   Takes a body of code that returns a channel, and tests the value that comes out of the channel."
  [description & body]
  `(fact ~description
         (let [result# (async/<!! (do ~@body))]
           result# => truthy)))

;; ===== WebSocket Testing Helpers =====

(defn mock-ws-message
  "Creates a mock WebSocket message map for testing handlers."
  ([type data]
   (mock-ws-message type data (fn [_])))
  ([type data reply-fn]
   {:?data (assoc data :type type)
    :?reply-fn reply-fn}))

(defn capture-reply
  "Returns a function that captures the reply from a WebSocket handler."
  []
  (let [captured (atom nil)]
    (fn
      ([reply]
       (reset! captured reply)
       @captured)
      ([]
       @captured))))

(defn ws-handler-test
  "Tests a WebSocket handler with the given message type and data.
   Returns the captured reply."
  [handler-fn msg-type data]
  (let [reply-capture (capture-reply)
        msg (mock-ws-message msg-type data reply-capture)]
    (handler-fn msg)
    (wait-for reply-capture 1000)))

;; ===== Database Testing Helpers =====

(defn with-test-db
  "Macro to run tests with a test database.
   Takes a database connection and a body of code to run with that connection."
  [conn & body]
  `(try
     ~@body
     (finally
       (when ~conn
         (comment "Clean up database connection if needed")))))

;; ===== HTTP Testing Helpers =====

(defn mock-request
  "Creates a mock HTTP request for testing."
  [method uri & {:as options}]
  (merge {:request-method method
          :uri uri}
         options))

(defn mock-response
  "Creates a mock HTTP response for testing."
  [& {:as options}]
  (merge {:status 200
          :headers {}
          :body nil}
         options))