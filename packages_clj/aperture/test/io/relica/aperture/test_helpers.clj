(ns io.relica.aperture.test-helpers
  "Test helpers for the aperture module."
  (:require [clojure.test :refer :all]
            [io.relica.common.test-helpers :as test-helpers]
            [io.relica.common.websocket.server :as ws-server]
            [io.relica.aperture.io.ws-handlers :as ws-handlers]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]))

;; Re-export common helpers
(def wait-for test-helpers/wait-for)
(def mock-ws-message test-helpers/mock-ws-message)
(def capture-reply test-helpers/capture-reply)
(def mock-request test-helpers/mock-request)
(def mock-response test-helpers/mock-response)

;; Additional helpers for Aperture tests
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

;; Aperture-specific test helpers

(defn test-ws-handler
  "Tests a WebSocket handler with the given message type and data.
   Returns the captured reply."
  [msg-type data]
  (let [capture (capture-reply)
        msg (mock-ws-message msg-type data (:reply-fn capture))]
    (ws-server/handle-ws-message msg)
    (wait-for-reply capture 1000)))

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