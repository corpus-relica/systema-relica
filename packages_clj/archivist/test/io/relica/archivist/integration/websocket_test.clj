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
      response => expected)))