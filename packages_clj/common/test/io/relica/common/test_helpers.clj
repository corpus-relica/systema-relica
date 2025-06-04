(ns io.relica.common.test-helpers
  "Common test helpers for the common module."
  (:require [clojure.test :refer [is]]
            [clojure.core.async :as async :refer [go <! >! chan timeout alts! <!!]]))

;; Async test helpers
(defn wait-for
  "Wait for a condition to become truthy, with timeout"
  ([pred] (wait-for pred 1000))
  ([pred timeout-ms]
   (let [end-time (+ (System/currentTimeMillis) timeout-ms)]
     (loop []
       (cond
         (pred) true
         (> (System/currentTimeMillis) end-time) false
         :else (do (Thread/sleep 10)
                   (recur)))))))

(defmacro async-test
  "Run an async test with a timeout"
  [timeout-ms & body]
  `(let [result-ch# (chan)
         timeout-ch# (timeout ~timeout-ms)]
     (go
       (try
         ~@body
         (>! result-ch# :success)
         (catch Exception e#
           (>! result-ch# {:error e#}))))
     (let [[result# ch#] (alts! [result-ch# timeout-ch#])]
       (cond
         (= ch# timeout-ch#) (is false "Test timed out")
         (and (map? result#) (:error result#)) (throw (:error result#))
         :else (is true)))))

;; Mock helpers
(defn mock-ws-message
  "Create a mock WebSocket message"
  [type payload & {:keys [request-id] :or {request-id "test-req"}}]
  {:type type
   :payload payload
   :request_id request-id})

(defn capture-reply
  "Create an atom and a reply function that captures responses"
  []
  (let [responses (atom [])]
    {:responses responses
     :reply-fn (fn [response]
                 (swap! responses conj response))}))

;; Test data helpers
(defn mock-request
  "Create a mock HTTP request"
  [method uri & {:keys [params headers body]}]
  {:request-method method
   :uri uri
   :params params
   :headers headers
   :body body})

(defn mock-response
  "Create a mock HTTP response"
  [status body & {:keys [headers]}]
  {:status status
   :body body
   :headers (merge {"Content-Type" "application/json"} headers)})