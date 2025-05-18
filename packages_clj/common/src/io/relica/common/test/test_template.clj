(ns io.relica.common.test.test-template
  "Template for creating Midje tests in Relica modules.
   This file serves as a reference and should be copied and adapted for specific tests."
  (:require [midje.sweet :refer :all]
            [io.relica.common.test.midje-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]))

;; ===== Basic Fact Examples =====

(fact "Basic equality test"
      (+ 1 1) => 2)

(fact "Testing with a predicate"
      [1 2 3] => (contains 2))

(fact "Testing with checkers"
      {:name "Test" :value 42} => (contains {:name "Test"})
      [1 2 3 4] => (has every? number?)
      "Hello, World!" => #"Hello")

;; ===== Tabular Examples =====

(tabular "Arithmetic operations"
         (fact "Testing basic arithmetic"
               (?operation ?a ?b) => ?result)

         ?operation  ?a  ?b  ?result
         +           1   2   3
         -           5   2   3
         *           2   3   6
         /           6   2   3)

;; ===== Prerequisite Examples =====

(fact "Testing with prerequisites"
      (let [test-fn (fn [x] (inc x))]
        (test-fn 1) => 2
        (provided
         (test-fn 1) => 2)))

;; ===== Async Testing Examples =====

(fact "Testing async operations"
      (let [result-chan (go
                          (<! (timeout 100))
                          42)]
        (helpers/wait-for #(= 42 (deref result-chan 10 nil))) => 42))

(helpers/async-fact "Using the async-fact helper"
                    (go
                      (<! (timeout 100))
                      true))

;; ===== WebSocket Testing Examples =====

(fact "Testing a WebSocket handler"
      (let [mock-msg (helpers/mock-ws-message :test/message {:data "test"})]
        ;; Replace with actual handler function
        (comment "handler-fn mock-msg")
        ;; Assert on the result
        true => true))

;; ===== Database Testing Examples =====

(fact "Testing database operations"
      ;; Setup mock database
      (let [mock-db {}]
        ;; Test database operations
        (helpers/with-test-db mock-db
          ;; Replace with actual database operations
          (comment "db-operation mock-db")
          ;; Assert on the result
          true => true)))

;; ===== HTTP Testing Examples =====

(fact "Testing HTTP requests"
      (let [mock-req (helpers/mock-request :get "/api/test")
            ;; Replace with actual handler function
            response (comment "handler-fn mock-req")]
        ;; Assert on the response
        true => true))

;; ===== Mocking Examples =====

(fact "Testing with mocks"
      (let [result (+ 1 1)]
        result => 2
        (provided
         ;; No mocks needed for this simple example
         )))

;; ===== Exception Testing Examples =====

(fact "Testing exceptions"
      (throw (Exception. "Test exception")) => (throws Exception #"Test exception"))