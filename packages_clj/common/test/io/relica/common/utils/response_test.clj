(ns io.relica.common.utils.response-test
  "Comprehensive tests for response utilities including error handling, serialization,
   cross-language compatibility, and response format validation."
  (:require [midje.sweet :refer [fact facts contains throws]]
            [io.relica.common.utils.response :as response]
            [clojure.data.json :as json]))

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

(facts "About response format validation"
       (fact "success responses have required fields"
             (let [resp (response/success-response {:result "data"})]
               (:success resp) => true
               (contains? resp :data) => true
               (contains? resp :timestamp) => true))

       (fact "error responses have required error structure"
             (let [resp (response/error-response :validation-error "Invalid input")]
               (:success resp) => false
               (contains? resp :error) => true
               (get-in resp [:error :code]) => (every-pred number? pos?)
               (get-in resp [:error :type]) => string?
               (get-in resp [:error :message]) => string?
               (contains? resp :timestamp) => true))

       (fact "responses include ISO timestamp format"
             (let [resp (response/success-response {:data "test"})]
               (:timestamp resp) => #(re-matches #"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z" %))))

(facts "About cross-language serialization compatibility"
       (fact "success responses serialize to valid JSON"
             (let [resp (response/success-response {:entities [{:uid "123" :name "Entity"}]
                                                   :count 1})
                   json-str (json/write-str resp)
                   parsed (json/read-str json-str :key-fn keyword)]
               (:success parsed) => true
               (get-in parsed [:data :count]) => 1
               (get-in parsed [:data :entities 0 :uid]) => "123"))

       (fact "error responses serialize to valid JSON"
             (let [resp (response/error-response :database-error "Connection failed" 
                                               {:connection-string "neo4j://localhost"
                                                :retry-count 3})
                   json-str (json/write-str resp)
                   parsed (json/read-str json-str :key-fn keyword)]
               (:success parsed) => false
               (get-in parsed [:error :type]) => "database-error"
               (get-in parsed [:error :details :retry-count]) => 3))

       (fact "handles nested data structures in responses"
             (let [complex-data {:users [{:id 1 :profile {:name "John" :preferences {:theme "dark"}}}]
                                :metadata {:total 1 :filters {:active true}}}
                   resp (response/success-response complex-data)
                   json-str (json/write-str resp)
                   parsed (json/read-str json-str :key-fn keyword)]
               (get-in parsed [:data :users 0 :profile :preferences :theme]) => "dark"
               (get-in parsed [:data :metadata :filters :active]) => true)))

(facts "About error code mapping"
       (fact "maps known error types to specific codes"
             (get-in (response/error-response :validation-error "Invalid") [:error :code]) => 1002
             (get-in (response/error-response :database-error "Failed") [:error :code]) => 1003
             (get-in (response/error-response :authentication-error "Denied") [:error :code]) => 1004
             (get-in (response/error-response :authorization-error "Forbidden") [:error :code]) => 1005)

       (fact "handles unknown error types with default code"
             (get-in (response/error-response :unknown-custom-error "Something") [:error :code]) => 1000)

       (fact "preserves original error type in response"
             (get-in (response/error-response :custom-business-error "Custom") [:error :type]) => "custom-business-error"))

(facts "About response metadata handling"
       (fact "includes processing metadata in responses"
             (let [resp (response/success-response {:data "test"} "req-123" {:processing-time-ms 150
                                                                            :service "archivist"
                                                                            :version "1.0.0"})]
               (:request_id resp) => "req-123"
               (get-in resp [:metadata :processing-time-ms]) => 150
               (get-in resp [:metadata :service]) => "archivist"))

       (fact "merges metadata with existing response data"
             (let [resp (response/error-response :timeout "Request timeout" 
                                               {:query "MATCH (n) RETURN n"} 
                                               "req-456"
                                               {:timeout-ms 5000 :retries 2})]
               (:request_id resp) => "req-456"
               (get-in resp [:metadata :timeout-ms]) => 5000
               (get-in resp [:error :details :query]) => "MATCH (n) RETURN n")))

(facts "About response data validation"
       (fact "validates success response data is not nil"
             (response/success-response nil) => (contains {:success true :data nil}))

       (fact "validates error message is required"
             (response/error-response :test-error nil) => (throws Exception))

       (fact "handles empty details gracefully"
             (let [resp (response/error-response :test-error "Message" {})]
               (get-in resp [:error :details]) => {}))

       (fact "preserves data types in responses"
             (let [data {:string "text"
                        :number 42
                        :boolean true
                        :vector [1 2 3]
                        :map {:nested "value"}}
                   resp (response/success-response data)]
               (get-in resp [:data :string]) => string?
               (get-in resp [:data :number]) => number?
               (get-in resp [:data :boolean]) => boolean?
               (get-in resp [:data :vector]) => vector?
               (get-in resp [:data :map]) => map?)))

(facts "About performance and memory efficiency"
       (fact "handles large response data efficiently"
             (let [large-data {:items (vec (for [i (range 1000)]
                                           {:id i :data (str "item-" i)}))}
                   resp (response/success-response large-data)]
               (:success resp) => true
               (count (get-in resp [:data :items])) => 1000
               (get-in resp [:data :items 999 :id]) => 999))

       (fact "handles deeply nested structures"
             (let [deep-data (reduce (fn [acc i] {:level i :nested acc})
                                   {:bottom "value"}
                                   (range 10))
                   resp (response/success-response deep-data)]
               (:success resp) => true
               (get-in resp [:data :level]) => 9
               ;; Navigate to bottom level
               (get-in resp [:data :nested :nested :nested :nested :nested 
                            :nested :nested :nested :nested :nested :bottom]) => "value")))

(facts "About response format consistency"
       (fact "success responses follow consistent structure"
             (let [resp1 (response/success-response {:type "user"})
                   resp2 (response/success-response {:type "entity"} "req-123")
                   resp3 (response/success-response {:type "fact"} "req-456" {:source "test"})]
               ;; All should have same top-level keys
               (keys resp1) => (contains [:success :data :timestamp] :in-any-order)
               (keys resp2) => (contains [:success :data :timestamp :request_id] :in-any-order)
               (keys resp3) => (contains [:success :data :timestamp :request_id :metadata] :in-any-order)))

       (fact "error responses follow consistent structure"
             (let [resp1 (response/error-response :error1 "Message1")
                   resp2 (response/error-response :error2 "Message2" {:detail "info"})
                   resp3 (response/error-response :error3 "Message3" nil "req-789")]
               ;; All should have same top-level keys for errors
               (keys resp1) => (contains [:success :error :timestamp] :in-any-order)
               (keys resp2) => (contains [:success :error :timestamp] :in-any-order)
               (keys resp3) => (contains [:success :error :timestamp :request_id] :in-any-order)
               ;; All error objects should have same structure
               (keys (:error resp1)) => (contains [:code :type :message] :in-any-order)
               (keys (:error resp2)) => (contains [:code :type :message :details] :in-any-order)
               (keys (:error resp3)) => (contains [:code :type :message] :in-any-order))))

(facts "About cross-service response compatibility"
       (fact "responses are compatible with Python service format"
             (let [resp (response/success-response {:results [{:uid "entity-123" 
                                                             :properties {:name "Test Entity"}}]
                                                   :total_count 1})
                   json-str (json/write-str resp :key-fn name)
                   ;; Simulate Python service parsing (snake_case)
                   parsed (json/read-str json-str)]
               (get parsed "success") => true
               (get-in parsed ["data" "total_count"]) => 1
               (get-in parsed ["data" "results" 0 "uid"]) => "entity-123"))

       (fact "error responses include stack trace compatibility"
             (let [resp (response/error-response :python-service-error "LangChain error"
                                               {:python_traceback "Traceback (most recent call last)..."
                                                :error_class "ValueError"
                                                :line_number 42})]
               (get-in resp [:error :details :python_traceback]) => (contains "Traceback")
               (get-in resp [:error :details :error_class]) => "ValueError"))

       (fact "handles TypeScript service response format"
             (let [ts-style-data {:camelCaseField "value"
                                 :nestedObject {:anotherField true}
                                 :arrayData [1 2 3]}
                   resp (response/success-response ts-style-data)]
               ;; Should preserve TypeScript naming conventions
               (get-in resp [:data :camelCaseField]) => "value"
               (get-in resp [:data :nestedObject :anotherField]) => true)))