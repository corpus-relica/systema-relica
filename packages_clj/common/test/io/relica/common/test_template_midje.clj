(ns io.relica.common.test-template-midje
  "Template for creating new Midje tests in Relica modules.
   Copy this file and adapt it for your specific tests."
  (:require [midje.sweet :refer :all]
            [io.relica.common.test.midje-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]))

;; ===== Basic Facts =====

(facts "About basic functionality"
       (fact "Basic equality test"
             (+ 1 1) => 2)

       (fact "Testing with a predicate"
             [1 2 3] => (contains 2))

       (fact "Testing with checkers"
             {:name "Test" :value 42} => (contains {:name "Test"})
             [1 2 3 4] => (has every? number?)
             "Hello, World!" => #"Hello"))

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

(facts "About mocking and prerequisites"
       (fact "Testing with prerequisites"
             (let [test-fn (fn [x] (inc x))]
               (test-fn 1) => 2
               (provided
                (test-fn 1) => 2))))

;; ===== Async Testing Examples =====

(facts "About async operations"
       (fact "Testing async operations"
             (let [result-chan (go
                                 (<! (timeout 100))
                                 42)]
               (helpers/wait-for #(= 42 (deref result-chan 10 nil))) => 42))

       (helpers/async-fact "Using the async-fact helper"
                           (go
                             (<! (timeout 100))
                             true)))

;; ===== WebSocket Testing Examples =====

(facts "About WebSocket handlers"
       (fact "Testing a WebSocket handler"
             (let [reply-capture (helpers/capture-reply)
                   msg (helpers/mock-ws-message :test/message {:data "test"} reply-capture)]
               ;; Replace with actual handler function
               (comment "handler-fn msg")
               ;; Assert on the result
               true => true)))

;; ===== Database Testing Examples =====

(facts "About database operations"
       (fact "Testing database operations"
             ;; Setup mock database
             (let [mock-db {}]
               ;; Test database operations
               (helpers/with-test-db mock-db
                 ;; Replace with actual database operations
                 (comment "db-operation mock-db")
                 ;; Assert on the result
                 true => true))))

;; ===== HTTP Testing Examples =====

(facts "About HTTP handlers"
       (fact "Testing HTTP requests"
             (let [mock-req (helpers/mock-request :get "/api/test")
                   ;; Replace with actual handler function
                   response (comment "handler-fn mock-req")]
               ;; Assert on the response
               true => true)))

;; ===== Exception Testing Examples =====

(facts "About exception handling"
       (fact "Testing exceptions"
             (throw (Exception. "Test exception")) => (throws Exception #"Test exception")))