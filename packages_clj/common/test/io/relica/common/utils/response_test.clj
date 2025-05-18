(ns io.relica.common.utils.response-test
  (:require [midje.sweet :refer [fact facts contains]]
            [io.relica.common.utils.response :as response]))

(fact "success-response creates a response with success flag"
      (response/success-response {:data "test"})
      => (contains {:success true
                    :data "test"}))

(fact "success-response includes request_id when provided"
      (response/success-response {:data "test"} "123")
      => (contains {:success true
                    :request_id "123"
                    :data "test"}))

(fact "error-response creates a response with error information"
      (response/error-response :service-unavailable "Service not available")
      => (contains {:success false
                    :error (contains {:code 1001
                                      :type "service-unavailable"
                                      :message "Service not available"})}))

(fact "error-response includes details when provided"
      (response/error-response :service-unavailable "Service not available" {:reason "maintenance"})
      => (contains {:success false
                    :error (contains {:code 1001
                                      :type "service-unavailable"
                                      :message "Service not available"
                                      :details {:reason "maintenance"}})}))

(fact "error-response includes request_id when provided"
      (response/error-response :service-unavailable "Service not available" nil "123")
      => (contains {:success false
                    :request_id "123"
                    :error (contains {:code 1001
                                      :type "service-unavailable"
                                      :message "Service not available"})}))