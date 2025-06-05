(ns io.relica.archivist.test-helpers
  "Test helpers for the archivist module."
  (:require [clojure.test :refer [is]]
            [io.relica.common.test-helpers :as common-helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]))

;; Re-export common helpers
(def wait-for common-helpers/wait-for)
(defmacro async-test [timeout-ms & body]
  `(common-helpers/async-test ~timeout-ms ~@body))
(def mock-ws-message common-helpers/mock-ws-message)
(def capture-reply common-helpers/capture-reply)
(def mock-request common-helpers/mock-request)
(def mock-response common-helpers/mock-response)

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
  "Creates a mock database connection for testing."
  []
  (mock-neo4j-connection))