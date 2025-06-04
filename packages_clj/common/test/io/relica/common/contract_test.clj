(ns io.relica.common.contract-test
  "Contract tests for cross-language compatibility ensuring consistent
   message formats, API responses, and error handling across Clojure,
   Python, and TypeScript services."
  (:require [midje.sweet :refer :all]
            [io.relica.common.websocket.format :as format]
            [io.relica.common.utils.response :as response]
            [clojure.data.json :as json]
            [clojure.spec.alpha :as s]))

;; Define contracts for cross-language message formats
(s/def ::message-type keyword?)
(s/def ::request-id string?)
(s/def ::timestamp string?)
(s/def ::payload map?)

(s/def ::websocket-message
  (s/keys :req-un [::message-type ::payload]
          :opt-un [::request-id ::timestamp]))

(s/def ::success boolean?)
(s/def ::data map?)
(s/def ::error-code number?)
(s/def ::error-type string?)
(s/def ::error-message string?)
(s/def ::error-details (s/nilable map?))

(s/def ::error-object
  (s/keys :req-un [::error-code ::error-type ::error-message]
          :opt-un [::error-details]))

(s/def ::api-response
  (s/keys :req-un [::success ::timestamp]
          :opt-un [::data ::error-object ::request-id]))

(facts "About WebSocket message format contracts"
       
       (fact "Clojure messages conform to standard format"
             (let [message {:type :archivist.fact/list
                           :payload {:filters {:kind "730000"}
                                    :limit 50}
                           :request-id "req-123"}]
               (s/valid? ::websocket-message message) => true))
       
       (fact "Python-style messages are parseable"
             (let [python-json "{\"type\":\"nous.user.input\",\"payload\":{\"user_id\":\"123\",\"message\":\"hello\"},\"request_id\":\"req-456\"}"
                   parsed (json/read-str python-json :key-fn keyword)]
               ;; Should be valid after key conversion
               (s/valid? ::websocket-message parsed) => true
               (:type parsed) => :nous.user.input
               (get-in parsed [:payload :user_id]) => "123"))
       
       (fact "TypeScript-style messages are parseable"
             (let [ts-json "{\"type\":\"clarity.model.get\",\"payload\":{\"modelId\":\"model-123\",\"includeMetadata\":true},\"requestId\":\"req-789\"}"
                   parsed (json/read-str ts-json :key-fn keyword)]
               (s/valid? ::websocket-message parsed) => true
               (:type parsed) => :clarity.model.get
               (get-in parsed [:payload :modelId]) => "model-123")))

(facts "About API response format contracts"
       
       (fact "Success responses follow contract"
             (let [response (response/success-response {:entities [{:uid "123" :name "Test"}]
                                                       :count 1}
                                                      "req-123")]
               (s/valid? ::api-response response) => true
               (:success response) => true
               (contains? response :data) => true
               (contains? response :timestamp) => true))
       
       (fact "Error responses follow contract"
             (let [response (response/error-response :validation-error "Invalid input"
                                                   {:field "user-id" :value nil}
                                                   "req-456")]
               (s/valid? ::api-response response) => true
               (:success response) => false
               (contains? response :error) => true
               (s/valid? ::error-object (:error response)) => true))
       
       (fact "Python service responses are compatible"
             (let [python-response-json "{\"success\":true,\"data\":{\"agent_response\":\"Hello!\",\"metadata\":{\"model\":\"gpt-4\"}},\"timestamp\":\"2024-01-01T00:00:00.000Z\",\"request_id\":\"req-789\"}"
                   parsed (json/read-str python-response-json :key-fn keyword)]
               (s/valid? ::api-response parsed) => true
               (:success parsed) => true
               (get-in parsed [:data :agent_response]) => "Hello!"))
       
       (fact "TypeScript service responses are compatible"
             (let [ts-response-json "{\"success\":false,\"error\":{\"code\":1001,\"type\":\"service-unavailable\",\"message\":\"Service temporarily down\"},\"timestamp\":\"2024-01-01T00:00:00.000Z\"}"
                   parsed (json/read-str ts-response-json :key-fn keyword)]
               (s/valid? ::api-response parsed) => true
               (:success parsed) => false
               (s/valid? ::error-object (:error parsed)) => true)))

(facts "About message serialization contracts"
       
       (fact "Clojure to Python serialization"
             (let [clojure-data {:user-id "123"
                               :environment-id "env-456"
                               :query "Find all entities"
                               :options {:limit 10 :include-metadata true}}
                   json-str (format/serialize format/json-format clojure-data)
                   python-parsed (json/read-str json-str)]
               ;; Python expects snake_case or kebab-case preserved
               (get python-parsed "user-id") => "123"
               (get python-parsed "environment-id") => "env-456"
               (get-in python-parsed ["options" "limit"]) => 10))
       
       (fact "Python to Clojure deserialization"
             (let [python-json "{\"user_id\":\"789\",\"query_result\":{\"entities\":[{\"uid\":\"e1\",\"name\":\"Entity 1\"}],\"total_count\":1}}"
                   clojure-data (format/deserialize format/json-format python-json)]
               ;; Clojure preserves original key format
               (:user_id clojure-data) => "789"
               (get-in clojure-data [:query_result :total_count]) => 1))
       
       (fact "TypeScript camelCase compatibility"
             (let [ts-data {:requestId "req-123"
                           :messageType "fact-query"
                           :queryParams {:maxResults 50
                                       :includeDefinitions true}}
                   json-str (format/serialize format/json-format ts-data)
                   parsed (json/read-str json-str :key-fn keyword)]
               ;; Should preserve TypeScript naming
               (:requestId parsed) => "req-123"
               (:messageType parsed) => "fact-query"
               (get-in parsed [:queryParams :maxResults]) => 50)))

(facts "About error format contracts across languages"
       
       (fact "Clojure error format is consumable by Python"
             (let [clojure-error (response/error-response :database-error "Neo4j connection failed"
                                                        {:connection-string "neo4j://localhost:7687"
                                                         :retry-count 3}
                                                        "req-123")
                   json-str (json/write-str clojure-error :key-fn name)
                   python-parsed (json/read-str json-str)]
               (get python-parsed "success") => false
               (get-in python-parsed ["error" "code"]) => number?
               (get-in python-parsed ["error" "type"]) => "database-error"
               (get-in python-parsed ["error" "details" "retry-count"]) => 3))
       
       (fact "Python error format is consumable by Clojure"
             (let [python-error-json "{\"success\":false,\"error\":{\"code\":2001,\"type\":\"langchain_error\",\"message\":\"Agent execution failed\",\"details\":{\"python_traceback\":\"Traceback...\",\"error_class\":\"ValueError\"}},\"timestamp\":\"2024-01-01T12:00:00.000Z\"}"
                   clojure-parsed (json/read-str python-error-json :key-fn keyword)]
               (:success clojure-parsed) => false
               (get-in clojure-parsed [:error :type]) => "langchain_error"
               (get-in clojure-parsed [:error :details :error_class]) => "ValueError"))
       
       (fact "TypeScript error format is consumable by Clojure"
             (let [ts-error-json "{\"success\":false,\"error\":{\"code\":3001,\"type\":\"validationError\",\"message\":\"Invalid model configuration\",\"details\":{\"fieldErrors\":[{\"field\":\"modelType\",\"message\":\"Required field missing\"}]}},\"timestamp\":\"2024-01-01T12:00:00.000Z\"}"
                   clojure-parsed (json/read-str ts-error-json :key-fn keyword)]
               (:success clojure-parsed) => false
               (get-in clojure-parsed [:error :type]) => "validationError"
               (count (get-in clojure-parsed [:error :details :fieldErrors])) => 1)))

(facts "About data type preservation contracts"
       
       (fact "Numbers are preserved across languages"
             (let [data {:integers [1 2 3 42 1000]
                        :floats [3.14 2.718 0.5]
                        :large-number 1234567890123456789}
                   json-str (format/serialize format/json-format data)
                   parsed (format/deserialize format/json-format json-str)]
               (:integers parsed) => [1 2 3 42 1000]
               (:floats parsed) => [3.14 2.718 0.5]
               (:large-number parsed) => 1234567890123456789))
       
       (fact "Booleans are preserved across languages"
             (let [data {:flags {:active true
                               :deprecated false
                               :experimental true}}
                   json-str (format/serialize format/json-format data)
                   parsed (format/deserialize format/json-format json-str)]
               (get-in parsed [:flags :active]) => true
               (get-in parsed [:flags :deprecated]) => false))
       
       (fact "Null/nil values are handled consistently"
             (let [data {:optional-field nil
                        :required-field "value"
                        :nested {:nullable nil :present "data"}}
                   json-str (format/serialize format/json-format data)
                   parsed (format/deserialize format/json-format json-str)]
               (:optional-field parsed) => nil
               (:required-field parsed) => "value"
               (get-in parsed [:nested :nullable]) => nil
               (get-in parsed [:nested :present]) => "data"))
       
       (fact "Arrays are preserved across languages"
             (let [data {:simple-array [1 2 3]
                        :string-array ["a" "b" "c"]
                        :nested-array [{:id 1 :name "first"}
                                     {:id 2 :name "second"}]
                        :empty-array []}
                   json-str (format/serialize format/json-format data)
                   parsed (format/deserialize format/json-format json-str)]
               (:simple-array parsed) => [1 2 3]
               (:string-array parsed) => ["a" "b" "c"]
               (count (:nested-array parsed)) => 2
               (get-in parsed [:nested-array 0 :name]) => "first"
               (:empty-array parsed) => [])))

(facts "About timestamp format contracts"
       
       (fact "ISO 8601 timestamps are used consistently"
             (let [response (response/success-response {:data "test"})]
               (:timestamp response) => #(re-matches #"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z" %)))
       
       (fact "Timestamps are preserved in serialization"
             (let [data {:created-at "2024-01-01T12:00:00.000Z"
                        :updated-at "2024-01-01T12:30:00.500Z"}
                   json-str (format/serialize format/json-format data)
                   parsed (format/deserialize format/json-format json-str)]
               (:created-at parsed) => "2024-01-01T12:00:00.000Z"
               (:updated-at parsed) => "2024-01-01T12:30:00.500Z")))

(facts "About nested structure contracts"
       
       (fact "Deep nesting is supported consistently"
             (let [deep-data {:level-1 {:level-2 {:level-3 {:level-4 {:value "deep"}}}}}
                   json-str (format/serialize format/json-format deep-data)
                   parsed (format/deserialize format/json-format json-str)]
               (get-in parsed [:level-1 :level-2 :level-3 :level-4 :value]) => "deep"))
       
       (fact "Mixed data types in nested structures"
             (let [complex-data {:metadata {:count 42
                                          :active true
                                          :tags ["tag1" "tag2"]
                                          :config {:timeout nil
                                                 :retries 3
                                                 :endpoints ["url1" "url2"]}}}
                   json-str (format/serialize format/json-format complex-data)
                   parsed (format/deserialize format/json-format json-str)]
               (get-in parsed [:metadata :count]) => 42
               (get-in parsed [:metadata :active]) => true
               (get-in parsed [:metadata :config :retries]) => 3
               (get-in parsed [:metadata :config :timeout]) => nil)))

(facts "About service-specific message contracts"
       
       (fact "Archivist fact query format is consistent"
             (let [archivist-query {:type :archivist.fact/list
                                   :payload {:filters {:lh-object-uid "123"
                                                     :rel-type-uid "1146"}
                                            :pagination {:skip 0 :limit 50}}}
                   json-str (format/serialize format/json-format archivist-query)
                   parsed (format/deserialize format/json-format json-str)]
               (:type parsed) => :archivist.fact/list
               (get-in parsed [:payload :filters :lh-object-uid]) => "123"))
       
       (fact "NOUS chat message format is consistent"
             (let [nous-message {:type :nous.user/input
                               :payload {:user-id "user-123"
                                       :environment-id "env-456"
                                       :input "Find all physical objects"
                                       :metadata {:session-id "sess-789"}}}
                   json-str (format/serialize format/json-format nous-message)
                   parsed (format/deserialize format/json-format json-str)]
               (:type parsed) => :nous.user/input
               (get-in parsed [:payload :user-id]) => "user-123"
               (get-in parsed [:payload :metadata :session-id]) => "sess-789"))
       
       (fact "Clarity model request format is consistent"
             (let [clarity-request {:type :clarity.model/get
                                   :payload {:model-id "model-123"
                                           :include-metadata true
                                           :format "json"}}
                   json-str (format/serialize format/json-format clarity-request)
                   parsed (format/deserialize format/json-format json-str)]
               (:type parsed) => :clarity.model/get
               (get-in parsed [:payload :model-id]) => "model-123"
               (get-in parsed [:payload :include-metadata]) => true)))

(facts "About error recovery contracts"
       
       (fact "Malformed messages are handled gracefully"
             (let [malformed-json "{\"type\":\"test\",\"payload\":\"invalid\""
                   result (try
                          (format/deserialize format/json-format malformed-json)
                          (catch Exception e
                            {:error (str e)}))]
               (contains? result :error) => true))
       
       (fact "Missing required fields are detected"
             (let [incomplete-message {:payload {:data "test"}}] ; Missing :type
               (s/valid? ::websocket-message incomplete-message) => false))
       
       (fact "Invalid response format is detected"
             (let [invalid-response {:success "true"}] ; Should be boolean
               (s/valid? ::api-response invalid-response) => false)))