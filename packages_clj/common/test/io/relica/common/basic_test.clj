(ns io.relica.common.basic-test
  "Basic smoke tests to verify test infrastructure works correctly."
  (:require [clojure.test :refer [deftest testing is]]
            [io.relica.common.utils.response :as response]))

(deftest response-utils-test
  (testing "response utils work correctly"
    (testing "success response"
      (let [success-resp (response/success-response {:data "test"} "req-123")]
        (is (= true (:success success-resp)))
        (is (= "req-123" (:request_id success-resp)))
        (is (= "test" (:data success-resp)))))
    
    (testing "error response"
      (let [error-resp (response/error-response :service-unavailable "Service down")]
        (is (= false (:success error-resp)))
        (is (= 1001 (get-in error-resp [:error :code])))
        (is (= "service-unavailable" (get-in error-resp [:error :type])))))))