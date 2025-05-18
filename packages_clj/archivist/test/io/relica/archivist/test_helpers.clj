(ns io.relica.archivist.test-helpers
  "Test helpers for the archivist module."
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

;; Archivist-specific test helpers

(defn mock-neo4j-connection
  "Creates a mock Neo4j connection for testing."
  []
  {:session (fn [& _] nil)
   :transaction (fn [& _] nil)})

(defn mock-entity
  "Creates a mock entity for testing."
  [& {:keys [uid name kind] :or {uid "test-entity-uid" name "Test Entity" kind "test-kind"}}]
  {:uid uid
   :name name
   :kind kind})

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

(defn mock-kind
  "Creates a mock kind for testing."
  [& {:keys [uid name] :or {uid "test-kind-uid" name "Test Kind"}}]
  {:uid uid
   :name name})

(defn with-mock-db
  "Macro to run tests with a mock database.
   Takes a body of code to run with a mock database connection."
  [& body]
  `(let [mock-conn# (mock-neo4j-connection)]
     (with-test-db mock-conn#
       ~@body)))