(ns io.relica.archivist.integration.websocket-test
  (:require [clojure.test :refer [deftest testing is]]
            [clojure.core.async :as async :refer [<! >! go chan <!! >!!]]
            [io.relica.archivist.utils.response :as response]
            [io.relica.archivist.test-helpers :as helpers]))

(deftest response-format-interoperability-test
  (testing "success response format is JSON-serializable and matches expected structure"
    (let [response (response/success-response {:key "value"} "req-123")
          ; This represents what client code in Python/TypeScript would expect
          expected {:success true
                    :request_id "req-123"
                    :data {:key "value"}}]
      (is (= expected response))))
  
  (testing "error response format is JSON-serializable and matches expected structure"
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
      (is (= expected response))))

  (testing "response format handles complex nested data structures"
    (let [complex-data {:entities [{:uid 1001 :name "Entity 1" :relations [{:type "subtype" :target 2001}]}
                                   {:uid 2001 :name "Entity 2" :properties {:definition "A test entity"}}]
                        :metadata {:total 2 :page 1 :page-size 10}}
          response (response/success-response complex-data "req-456")]
      (is (:success response))
      (is (= "req-456" (:request_id response)))
      (is (= 1001 (get-in response [:data :entities 0 :uid])))
      (is (= 2 (get-in response [:data :metadata :total])))))

  (testing "error response format handles different error types with proper codes"
    (let [database-error (response/error-response :database-error "Connection failed" {} "req-789")
          missing-field-error (response/error-response :missing-required-field "Field required" {:field "uid"} "req-790")
          not-found-error (response/error-response :resource-not-found "Entity not found" {:uid 99999} "req-791")]
      
      (is (false? (:success database-error)))
      (is (= 1001 (get-in database-error [:error :code])))
      (is (= "database-error" (get-in database-error [:error :type])))
      
      (is (false? (:success missing-field-error)))
      (is (= 1102 (get-in missing-field-error [:error :code])))
      (is (= "missing-required-field" (get-in missing-field-error [:error :type])))
      
      (is (false? (:success not-found-error)))
      (is (= 1201 (get-in not-found-error [:error :code])))
      (is (= "resource-not-found" (get-in not-found-error [:error :type])))))

  (testing "response format handles empty data gracefully"
    (let [empty-response (response/success-response {} "req-empty")
          null-response (response/success-response nil "req-null")]
      (is (:success empty-response))
      (is (= {} (:data empty-response)))
      (is (:success null-response))
      (is (nil? (:data null-response)))))

  (testing "response format includes proper timestamp for debugging"
    (let [response (response/success-response {:test "data"} "req-time")]
      (is (<= (Math/abs (- (:timestamp response) (System/currentTimeMillis))) 1000)))))