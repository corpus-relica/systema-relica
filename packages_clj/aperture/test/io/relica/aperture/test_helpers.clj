(ns io.relica.aperture.test-helpers
  "Test helpers for the aperture module."
  (:require [midje.sweet :refer [fact facts contains anything]]
            [io.relica.common.test.midje-helpers :as midje-helpers]
            [io.relica.common.websocket.server :as ws-server]
            [io.relica.aperture.io.ws-handlers :as ws-handlers]
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

;; Aperture-specific test helpers

(defn test-ws-handler
  "Tests a WebSocket handler with the given message type and data.
   Returns the captured reply."
  [msg-type data]
  (let [reply-capture (capture-reply)
        msg (mock-ws-message msg-type data reply-capture)]
    (ws-server/handle-ws-message msg)
    (wait-for reply-capture 1000)))

(defn mock-environment
  "Creates a mock environment for testing."
  [& {:keys [id user-id name] :or {id "test-env-id" user-id "test-user" name "Test Environment"}}]
  {:id id
   :user_id user-id
   :name name
   :created_at (java.util.Date.)
   :updated_at (java.util.Date.)})

(defn mock-entity
  "Creates a mock entity for testing."
  [& {:keys [uid name] :or {uid "test-entity-uid" name "Test Entity"}}]
  {:uid uid
   :name name})

(defn mock-fact
  "Creates a mock fact for testing."
  [& {:keys [uid subject predicate object]
      :or {uid "test-fact-uid"
           subject "test-subject-uid"
           predicate "test-predicate-uid"
           object "test-object-uid"}}]
  {:uid uid
   :subject subject
   :predicate predicate
   :object object})