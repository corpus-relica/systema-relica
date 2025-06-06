(ns io.relica.clarity.test-fixtures
  "Test fixtures for the clarity module - provides mock Archivist data and semantic model fixtures."
  (:require [clojure.test :refer :all]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]))

;; Mock Archivist response data (raw semantic facts)
(def mock-archivist-facts
  "Sample semantic facts as returned by Archivist"
  {:facts [{:uid "123" :subject "456" :predicate "is-a-subtype-of" :object "physical-object"}
           {:uid "124" :subject "456" :predicate "has-name" :object "Test Physical Object"}
           {:uid "125" :subject "456" :predicate "has-aspect" :object "789"}
           {:uid "126" :subject "789" :predicate "is-a-subtype-of" :object "aspect"}
           {:uid "127" :subject "789" :predicate "has-name" :object "Test Aspect"}
           {:uid "128" :subject "456" :predicate "plays-role" :object "101112"}
           {:uid "129" :subject "101112" :predicate "is-a-subtype-of" :object "role"}
           {:uid "130" :subject "101112" :predicate "has-name" :object "Test Role"}]})

(def mock-archivist-relations
  "Sample relation facts"
  {:facts [{:uid "200" :subject "rel1" :predicate "is-a-subtype-of" :object "relation"}
           {:uid "201" :subject "rel1" :predicate "has-name" :object "Test Relation"}
           {:uid "202" :subject "rel1" :predicate "relates" :object "456"}
           {:uid "203" :subject "rel1" :predicate "relates" :object "789"}]})

(def mock-archivist-occurrences
  "Sample occurrence facts"
  {:facts [{:uid "300" :subject "occ1" :predicate "is-a-subtype-of" :object "occurrence"}
           {:uid "301" :subject "occ1" :predicate "has-name" :object "Test Occurrence"}
           {:uid "302" :subject "occ1" :predicate "involves" :object "456"}]})

;; Expected semantic model outputs (transformed by Clarity OSM)
(def expected-physical-object-model
  "Expected physical object model after semantic transformation"
  {:uid "456"
   :type :physical-object
   :name "Test Physical Object"
   :attributes {:aspects ["789"]
                :roles ["101112"]}
   :relations []
   :occurrences []})

(def expected-aspect-model
  "Expected aspect model after semantic transformation"
  {:uid "789"
   :type :aspect
   :name "Test Aspect"
   :attributes {}
   :related-objects ["456"]
   :relations []})

(def expected-role-model
  "Expected role model after semantic transformation"
  {:uid "101112"
   :type :role
   :name "Test Role"
   :attributes {}
   :played-by ["456"]
   :relations []})

(def expected-relation-model
  "Expected relation model after semantic transformation"
  {:uid "rel1"
   :type :relation
   :name "Test Relation"
   :attributes {}
   :relates ["456" "789"]
   :participants []})

(def expected-occurrence-model
  "Expected occurrence model after semantic transformation"
  {:uid "occ1"
   :type :occurrence
   :name "Test Occurrence"
   :attributes {}
   :involves ["456"]
   :relations []})

;; Mock Archivist client for testing
(defn mock-archivist-client
  "Creates a mock Archivist client that returns predetermined responses"
  [response-map]
  (reify
    Object
    (toString [_] "MockArchivistClient")
    
    clojure.lang.IFn
    (invoke [this query-params]
      (go
        (let [uid (:uid query-params)]
          (case uid
            "456" mock-archivist-facts
            "789" {:facts (filter #(= (:subject %) "789") (:facts mock-archivist-facts))}
            "101112" {:facts (filter #(= (:subject %) "101112") (:facts mock-archivist-facts))}
            "rel1" mock-archivist-relations
            "occ1" mock-archivist-occurrences
            nil))))))

;; Mock WebSocket message utilities
(defn mock-clarity-ws-message
  "Creates a mock WebSocket message for Clarity operations"
  [operation data reply-fn]
  {:id (str "test-msg-" (System/currentTimeMillis))
   :operation operation
   :data data
   :reply reply-fn
   :timestamp (System/currentTimeMillis)})

;; Test data generators
(defn generate-test-fact
  "Generates a test semantic fact"
  [& {:keys [uid subject predicate object]
      :or {uid (str "test-" (rand-int 10000))
           subject "test-subject"
           predicate "test-predicate"
           object "test-object"}}]
  {:uid uid
   :subject subject
   :predicate predicate
   :object object})

(defn generate-test-model
  "Generates a test semantic model"
  [& {:keys [uid type name attributes relations]
      :or {uid (str "test-model-" (rand-int 10000))
           type :physical-object
           name "Test Model"
           attributes {}
           relations []}}]
  {:uid uid
   :type type
   :name name
   :attributes attributes
   :relations relations})

;; Performance test data
(def large-archivist-response
  "Large dataset for performance testing"
  {:facts (vec (for [i (range 1000)]
                 (generate-test-fact 
                   :uid (str "perf-test-" i)
                   :subject (str "subject-" (mod i 100))
                   :predicate "test-predicate"
                   :object (str "object-" (mod i 50)))))})

;; Error simulation utilities
(defn failing-archivist-client
  "Mock client that simulates Archivist failures"
  [error-type]
  (reify
    clojure.lang.IFn
    (invoke [this query-params]
      (go
        (case error-type
          :timeout (async/<! (async/timeout 5000))
          :connection-error (throw (ex-info "Connection failed" {:type :connection-error}))
          :invalid-response {:error "Invalid response format"}
          :empty-response nil
          (throw (ex-info "Unknown error" {:type :unknown-error})))))))

;; Test fixture setup/teardown utilities
(defn with-mock-archivist
  "Test fixture that provides a mock Archivist client"
  [test-fn & [response-data]]
  (let [original-client @io.relica.clarity.io.client-instances/archivist-client]
    (try
      (reset! io.relica.clarity.io.client-instances/archivist-client 
              (mock-archivist-client (or response-data mock-archivist-facts)))
      (test-fn)
      (finally
        (reset! io.relica.clarity.io.client-instances/archivist-client original-client)))))

(defn with-performance-data
  "Test fixture that provides large datasets for performance testing"
  [test-fn]
  (with-mock-archivist test-fn large-archivist-response))

(defn with-failing-archivist
  "Test fixture that simulates Archivist failures"
  [error-type test-fn]
  (let [original-client @io.relica.clarity.io.client-instances/archivist-client]
    (try
      (reset! io.relica.clarity.io.client-instances/archivist-client 
              (failing-archivist-client error-type))
      (test-fn)
      (finally
        (reset! io.relica.clarity.io.client-instances/archivist-client original-client)))))