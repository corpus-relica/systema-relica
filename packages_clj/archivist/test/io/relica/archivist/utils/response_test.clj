(ns io.relica.archivist.utils.response-test
  (:require [midje.sweet :refer :all]
            [io.relica.archivist.utils.response :as response]
            [io.relica.archivist.test-helpers :as helpers]))

;; ==========================================================================
;; Response format tests
;; ==========================================================================

(facts "about success-response"
  (fact "creates a standardized success response with data"
    (response/success-response {:test "data"})
    => {:success true
        :request_id nil
        :data {:test "data"}})
  
  (fact "creates a standardized success response with data and request-id"
    (response/success-response {:test "data"} "req-123")
    => {:success true
        :request_id "req-123"
        :data {:test "data"}}))

(facts "about error-response"
  (fact "creates a standardized error response with default params"
    (response/error-response :internal-error "Something went wrong")
    => {:success false
        :request_id nil
        :error {:code 1002
                :type "internal-error"
                :message "Something went wrong"
                :details nil}})
  
  (fact "creates a standardized error response with details"
    (response/error-response :validation-error "Invalid input" {:field "name"})
    => {:success false
        :request_id nil
        :error {:code 1101
                :type "validation-error"
                :message "Invalid input"
                :details {:field "name"}}})

  (fact "creates a standardized error response with details and request-id"
    (response/error-response :database-error "DB query failed" {:table "users"} "req-456")
    => {:success false
        :request_id "req-456"
        :error {:code 1206
                :type "database-error"
                :message "DB query failed"
                :details {:table "users"}}})
  
  (fact "uses default code for unknown error types"
    (response/error-response :unknown-error-type "Unknown error occurred")
    => {:success false
        :request_id nil
        :error {:code 1002  ; Default internal error code
                :type "unknown-error-type"
                :message "Unknown error occurred"
                :details nil}}))

;; ==========================================================================
;; Handler wrapper tests
;; ==========================================================================

(facts "about with-standard-response wrapper"
  (let [mock-reply-fn (fn [response] response)
        success-handler (fn [{:keys [respond-success]}]
                          (respond-success {:status "ok"}))
        error-handler (fn [{:keys [respond-error]}]
                        (respond-error :validation-error "Invalid input"))
        wrapped-success-handler (response/with-standard-response success-handler)
        wrapped-error-handler (response/with-standard-response error-handler)]
    
    (fact "wraps handler with success response"
      (wrapped-success-handler {:?data {:request_id "req-789"}
                               :?reply-fn mock-reply-fn})
      => {:success true
          :request_id "req-789"
          :data {:status "ok"}})
    
    (fact "wraps handler with error response"
      (wrapped-error-handler {:?data {:request_id "req-789"}
                             :?reply-fn mock-reply-fn})
      => {:success false
          :request_id "req-789"
          :error {:code 1101
                  :type "validation-error"
                  :message "Invalid input"
                  :details nil}})))

;; ==========================================================================
;; Helper function validation tests
;; ==========================================================================

(facts "about response format validation helpers"
  (fact "valid-success-response? validates a success response format"
    (helpers/valid-success-response? 
      (response/success-response {:test "data"} "req-123") 
      "req-123") => true
    
    (helpers/valid-success-response? 
      {:success true :request_id "req-123"}  ; Missing data
      "req-123") => false
    
    (helpers/valid-success-response? 
      {:success true :data {:test "data"}}  ; Missing request_id
      "req-123") => false)
  
  (fact "valid-error-response? validates an error response format"
    (helpers/valid-error-response? 
      (response/error-response :internal-error "Error" nil "req-123") 
      "req-123") => true
    
    (helpers/valid-error-response? 
      {:success false :request_id "req-123"}  ; Missing error object
      "req-123") => false
    
    (helpers/valid-error-response? 
      {:success false :error {:message "Error"} :request_id "req-123"}  ; Missing code and type
      "req-123") => false))