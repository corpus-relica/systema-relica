(ns io.relica.archivist.integration.websocket-test
  (:require [midje.sweet :refer :all]
            [clojure.core.async :as async :refer [<! >! go chan <!! >!!]]
            [io.relica.archivist.utils.response :as response]
            [io.relica.archivist.test-helpers :as helpers]))

(fact "about response format interoperability"
  (fact "success response format is JSON-serializable and matches expected structure"
    (let [response (response/success-response {:key "value"} "req-123")
          ; This represents what client code in Python/TypeScript would expect
          expected {:success true
                    :request_id "req-123"
                    :data {:key "value"}}]
      response => expected))
  
  (fact "error response format is JSON-serializable and matches expected structure"
    (let [response (response/error-response :validation-error 
                                           "Invalid input" 
                                           {:field "username"}
                                           "req-123")
          ; This represents what client code in Python/TypeScript would expect  
          expected {:success false
                    :request_id "req-123"
                    :error {:code 1101
                            :type "validation-error"
                            :message "Invalid input"
                            :details {:field "username"}}}]
      response => expected))

  (fact "response format handles complex nested data structures"
    (let [complex-data {:entities [{:uid 1001 :name "Entity 1" :relations [{:type "subtype" :target 2001}]}
                                   {:uid 2001 :name "Entity 2" :properties {:definition "A test entity"}}]
                        :metadata {:total 2 :page 1 :page-size 10}}
          response (response/success-response complex-data "req-456")]
      (:success response) => true
      (:request_id response) => "req-456"
      (get-in response [:data :entities 0 :uid]) => 1001
      (get-in response [:data :metadata :total]) => 2))

  (fact "error response format handles different error types with proper codes"
    (let [database-error (response/error-response :database-error "Connection failed" {} "req-789")
          missing-field-error (response/error-response :missing-required-field "Field required" {:field "uid"} "req-790")
          not-found-error (response/error-response :resource-not-found "Entity not found" {:uid 99999} "req-791")]
      
      (:success database-error) => false
      (get-in database-error [:error :code]) => 1001
      (get-in database-error [:error :type]) => "database-error"
      
      (:success missing-field-error) => false
      (get-in missing-field-error [:error :code]) => 1102
      (get-in missing-field-error [:error :type]) => "missing-required-field"
      
      (:success not-found-error) => false
      (get-in not-found-error [:error :code]) => 1201
      (get-in not-found-error [:error :type]) => "resource-not-found"))

  (fact "response format handles empty data gracefully"
    (let [empty-response (response/success-response {} "req-empty")
          null-response (response/success-response nil "req-null")]
      (:success empty-response) => true
      (:data empty-response) => {}
      (:success null-response) => true
      (:data null-response) => nil))

  (fact "response format includes proper timestamp for debugging"
    (let [response (response/success-response {:test "data"} "req-time")]
      (:timestamp response) => (roughly (System/currentTimeMillis) 1000)))))