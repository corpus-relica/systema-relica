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

;; WebSocket testing helpers

(def ^:dynamic *event-handlers-called* (atom {}))
(def ^:dynamic *channel-messages* (atom {}))

(defn mock-events-channel
  "Creates a mock events channel for testing."
  []
  (reset! *event-handlers-called* {})
  (chan 100))

(defn publish-test-event
  "Publishes a test event to the event system."
  [event-type payload]
  (io.relica.common.events.core/publish-event {:type event-type
                                               :payload payload}))

(defn event-handler-called?
  "Checks if an event handler was called."
  [handler-fn]
  (get @*event-handlers-called* handler-fn false))

(defn record-handler-call
  "Records that a handler was called."
  [handler-fn]
  (swap! *event-handlers-called* assoc handler-fn true))

(defn mock-ws-channel
  "Creates a mock WebSocket channel for testing."
  []
  (let [channel-id (str (gensym "channel-"))]
    (swap! *channel-messages* assoc channel-id [])
    channel-id))

(defn channel-received-message?
  "Checks if a channel received a message."
  [channel-id]
  (not (empty? (get @*channel-messages* channel-id []))))

(defn last-channel-message
  "Gets the last message sent to a channel."
  [channel-id]
  (last (get @*channel-messages* channel-id [])))

(defn record-channel-message
  "Records a message sent to a channel."
  [channel-id message]
  (swap! *channel-messages* update channel-id (fnil conj []) message))