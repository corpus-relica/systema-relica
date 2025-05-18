(ns io.relica.prism.test-helpers
  "Test helpers for the prism module."
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

;; Prism-specific test helpers

(defn mock-db-connection
  "Creates a mock database connection for testing."
  []
  {:connection (fn [& _] nil)
   :execute! (fn [& _] nil)
   :execute-one! (fn [& _] nil)
   :plan (fn [& _] nil)})

(defn mock-xls-data
  "Creates mock XLS data for testing."
  [& {:keys [sheets] :or {sheets {"Sheet1" [["Header1" "Header2"] ["Value1" "Value2"]]}}}]
  {:sheets sheets})

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

(defn with-mock-db
  "Macro to run tests with a mock database.
   Takes a body of code to run with a mock database connection."
  [& body]
  `(let [mock-conn# (mock-db-connection)]
     (with-test-db mock-conn#
       ~@body)))

(defn with-test-xls-file
  "Creates a temporary XLS file for testing.
   Takes a filename and data, creates the file, runs the body, and then deletes the file."
  [filename data & body]
  `(let [temp-file# (java.io.File/createTempFile ~filename ".xlsx")]
     (try
       ;; Mock creating the file - in a real implementation, this would write the data to the file
       ~@body
       (finally
         (.delete temp-file#)))))