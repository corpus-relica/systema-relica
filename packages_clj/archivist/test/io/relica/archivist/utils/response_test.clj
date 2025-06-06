(ns io.relica.archivist.utils.response-test
  (:require [clojure.test :refer [deftest testing is]]
            [io.relica.archivist.utils.response :as response]
            [io.relica.archivist.test-helpers :as helpers]))

;; ==========================================================================
;; Response format tests
;; ==========================================================================

(deftest success-response-test
  (testing "creates a standardized success response with data"
    (let [response (response/success-response {:test "data"})]
      (is (= {:success true
              :request_id nil
              :data {:test "data"}
              :timestamp (:timestamp response)}
             response))
      (is (number? (:timestamp response)))))
  
  (testing "creates a standardized success response with data and request-id"
    (is (= {:success true
            :request_id "req-123"
            :data {:test "data"}}
           (response/success-response {:test "data"} "req-123")))))

(deftest error-response-test
  (testing "creates a standardized error response with default params"
    (is (= {:success false
            :request_id nil
            :error {:code 1002
                    :type "internal-error"
                    :message "Something went wrong"
                    :details nil}}
           (response/error-response :internal-error "Something went wrong"))))
  
  (testing "creates a standardized error response with details"
    (let [response (response/error-response :validation-error "Invalid input" {:field "name"})]
      (is (= {:success false
              :request_id nil
              :error {:code 1101
                      :type "validation-error"
                      :message "Invalid input"
                      :details {:field "name"}}
              :timestamp (:timestamp response)}
             response))
      (is (number? (:timestamp response)))))

  (testing "creates a standardized error response with details and request-id"
    (is (= {:success false
            :request_id "req-456"
            :error {:code 1206
                    :type "database-error"
                    :message "DB query failed"
                    :details {:table "users"}}}
           (response/error-response :database-error "DB query failed" {:table "users"} "req-456"))))
  
  (testing "uses default code for unknown error types"
    (is (= {:success false
            :request_id nil
            :error {:code 1002  ; Default internal error code
                    :type "unknown-error-type"
                    :message "Unknown error occurred"
                    :details nil}}
           (response/error-response :unknown-error-type "Unknown error occurred")))))

;; ==========================================================================
;; Handler wrapper tests
;; ==========================================================================

(deftest with-standard-response-wrapper-test
  (let [mock-reply-fn (fn [response] response)
        success-handler (fn [{:keys [respond-success]}]
                          (respond-success {:status "ok"}))
        error-handler (fn [{:keys [respond-error]}]
                        (respond-error :validation-error "Invalid input"))
        wrapped-success-handler (response/with-standard-response success-handler)
        wrapped-error-handler (response/with-standard-response error-handler)]
    
    (testing "wraps handler with success response"
      (is (= {:success true
              :request_id "req-789"
              :data {:status "ok"}}
             (wrapped-success-handler {:?data {:request_id "req-789"}
                                      :?reply-fn mock-reply-fn}))))
    
    (testing "wraps handler with error response"
      (is (= {:success false
              :request_id "req-890"
              :error {:code 1101
                      :type "validation-error"
                      :message "Invalid input"
                      :details nil}}
             (wrapped-error-handler {:?data {:request_id "req-890"}
                                    :?reply-fn mock-reply-fn}))))
    
    (testing "handles missing request_id gracefully"
      (is (= {:success true
              :request_id nil
              :data {:status "ok"}}
             (wrapped-success-handler {:?data {}
                                      :?reply-fn mock-reply-fn}))))
    
    (testing "handles exception in handler gracefully"
      (let [exception-handler (fn [_] (throw (ex-info "Test exception" {:code 500})))
            wrapped-exception-handler (response/with-standard-response exception-handler)]
        (is (= {:success false
                :request_id "req-error"
                :error {:code 1002
                        :type "internal-error"
                        :message "Test exception"
                        :details nil}}
               (wrapped-exception-handler {:?data {:request_id "req-error"}
                                          :?reply-fn mock-reply-fn})))))))

;; ==========================================================================
;; Error code mapping tests
;; ==========================================================================

(deftest error-code-mapping-test
  (testing "maps known error types to correct codes"
    (is (= 1001 (response/get-error-code :database-error)))
    (is (= 1101 (response/get-error-code :validation-error)))
    (is (= 1102 (response/get-error-code :missing-required-field)))
    (is (= 1201 (response/get-error-code :resource-not-found)))
    (is (= 1301 (response/get-error-code :unauthorized)))
    (is (= 1302 (response/get-error-code :forbidden))))
  
  (testing "returns default code for unknown error types"
    (is (= 1002 (response/get-error-code :unknown-error-type)))
    (is (= 1002 (response/get-error-code :completely-made-up-error))))
  
  (testing "handles nil input gracefully"
    (is (= 1002 (response/get-error-code nil)))))

;; ==========================================================================
;; Response validation tests
;; ==========================================================================

(deftest response-validation-test
  (testing "validates success response format"
    (let [valid-success {:success true :request_id "123" :data {:result "ok"}}
          invalid-success-1 {:success true} ; Missing data
          invalid-success-2 {:success "true" :data {}}] ; Wrong type for success
      (is (response/valid-success-response? valid-success))
      (is (not (response/valid-success-response? invalid-success-1)))
      (is (not (response/valid-success-response? invalid-success-2)))))
  
  (testing "validates error response format"
    (let [valid-error {:success false 
                      :request_id "123" 
                      :error {:code 1001 :type "database-error" :message "Error" :details nil}}
          invalid-error-1 {:success false} ; Missing error
          invalid-error-2 {:success false :error {:type "error"}}] ; Missing required error fields
      (is (response/valid-error-response? valid-error))
      (is (not (response/valid-error-response? invalid-error-1)))
      (is (not (response/valid-error-response? invalid-error-2)))))
  
  (testing "validates response format generally"
    (let [valid-success {:success true :data {}}
          valid-error {:success false :error {:code 1001 :type "error" :message "msg"}}
          invalid-response {:not-success true}]
      (is (response/valid-response? valid-success))
      (is (response/valid-response? valid-error))
      (is (not (response/valid-response? invalid-response))))))

;; ==========================================================================
;; Response timing tests
;; ==========================================================================

(deftest response-timing-test
  (testing "includes timestamp in response"
    (let [response (response/success-response {:test "data"} "req-123")]
      (is (contains? response :timestamp))
      (is (number? (:timestamp response)))
      (is (<= (Math/abs (- (:timestamp response) (System/currentTimeMillis))) 1000))))
  
  (testing "timestamp is consistent across response types"
    (let [success-response (response/success-response {:test "data"})
          error-response (response/error-response :validation-error "Error message")
          time-diff (Math/abs (- (:timestamp success-response) (:timestamp error-response)))]
      (is (< time-diff 100)))) ; Should be created within 100ms of each other
  
  (testing "can measure response generation time"
    (let [start-time (System/currentTimeMillis)
          response (response/success-response {:large-data (range 1000)})
          generation-time (- (:timestamp response) start-time)]
      (is (>= generation-time 0))
      (is (< generation-time 100))))) ; Should generate within 100ms
