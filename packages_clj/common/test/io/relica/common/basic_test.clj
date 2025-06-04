(ns io.relica.common.basic-test
  "Basic smoke tests to verify test infrastructure works correctly."
  (:require [midje.sweet :refer :all]
            [io.relica.common.utils.response :as response]))

(facts "About basic functionality"
       (fact "response utils work correctly"
             (let [success-resp (response/success-response {:data "test"} "req-123")
                   error-resp (response/error-response :service-unavailable "Service down")]
               (:success success-resp) => true
               (:request_id success-resp) => "req-123"
               (:data success-resp) => "test"
               
               (:success error-resp) => false
               (get-in error-resp [:error :code]) => 1001
               (get-in error-resp [:error :type]) => "service-unavailable")))