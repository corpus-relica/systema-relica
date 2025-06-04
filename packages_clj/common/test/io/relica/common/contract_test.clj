(ns io.relica.common.contract-test
  "Contract tests for cross-language compatibility ensuring consistent
   message formats, API responses, and error handling across Clojure,
   Python, and TypeScript services."
  (:require [clojure.test :refer [deftest testing is]]
            [io.relica.common.websocket.format :as format]
            [io.relica.common.utils.response :as response]
            [clojure.data.json :as json]
            [clojure.spec.alpha :as s]))

;; Define contracts for cross-language message formats
(s/def ::type (s/or :keyword keyword? :string string?)) ; Allow both keywords and strings
(s/def ::request-id string?)
(s/def ::timestamp string?)
(s/def ::payload map?)

(s/def ::websocket-message
  (s/keys :req-un [::type ::payload]
          :opt-un [::request-id ::timestamp]))

(s/def ::success boolean?)
(s/def ::data any?) ; Allow any data type, not just maps
(s/def ::error-code number?)
(s/def ::error-type string?)
(s/def ::error-message string?)
(s/def ::error-details (s/nilable map?))

(s/def ::error-object
  (s/keys :req-un [::error-code ::error-type ::error-message]
          :opt-un [::error-details]))

(s/def ::api-response
  (s/keys :req-un [::success]
          :opt-un [::data ::error-code ::error-type ::error-message ::error-details ::request-id ::timestamp])) ; Error fields can be merged directly

;; Separate spec for nested error responses (like TypeScript)
(s/def ::error map?) ; Allow any error structure for compatibility
(s/def ::nested-error-response
  (s/keys :req-un [::success]
          :opt-un [::data ::error ::request-id ::timestamp]))

(deftest websocket-message-format-contracts-test
  (testing "About WebSocket message format contracts"
    
    (testing "Clojure messages conform to standard format"
      (let [message {:type :archivist.fact/list
                     :payload {:filters {:kind "730000"}
                               :limit 50}
                     :request-id "req-123"}]
        (is (s/valid? ::websocket-message message))))
    
    (testing "Python-style messages are parseable"
      (let [python-json "{\"type\":\"nous.user.input\",\"payload\":{\"user_id\":\"123\",\"message\":\"hello\"},\"request_id\":\"req-456\"}"
            parsed (json/read-str python-json :key-fn keyword)]
        ;; Should be valid after key conversion
        (is (s/valid? ::websocket-message parsed))
        (is (= "nous.user.input" (:type parsed))) ; JSON creates strings, not keywords
        (is (= "123" (get-in parsed [:payload :user_id])))))
    
    (testing "TypeScript-style messages are parseable"
      (let [ts-json "{\"type\":\"clarity.model.get\",\"payload\":{\"modelId\":\"model-123\",\"includeMetadata\":true},\"requestId\":\"req-789\"}"
            parsed (json/read-str ts-json :key-fn keyword)]
        (is (s/valid? ::websocket-message parsed))
        (is (= "clarity.model.get" (:type parsed))) ; JSON creates strings, not keywords
        (is (= "model-123" (get-in parsed [:payload :modelId])))))))

(deftest api-response-format-contracts-test
  (testing "About API response format contracts"
    
    (testing "Success responses follow contract"
      (let [response (response/success-response {:entities [{:uid "123" :name "Test"}]
                                                 :count 1}
                                                "req-123")]
        (is (s/valid? ::api-response response))
        (is (= true (:success response)))
        (is (contains? response :entities)) ; Data is merged, not wrapped in :data
        (is (contains? response :count))))
    
    (testing "Error responses follow contract"
      (let [response (response/error-response :validation-error "Invalid input"
                                              {:field "user-id" :value nil}
                                              "req-456")]
        ;; Response has nested error structure
        (is (s/valid? ::nested-error-response response))
        (is (= false (:success response)))
        (is (contains? response :error))))
    
    (testing "Python service responses are compatible"
      (let [python-response-json "{\"success\":true,\"data\":{\"agent_response\":\"Hello!\",\"metadata\":{\"model\":\"gpt-4\"}},\"timestamp\":\"2024-01-01T00:00:00.000Z\",\"request_id\":\"req-789\"}"
            parsed (json/read-str python-response-json :key-fn keyword)]
        (is (s/valid? ::api-response parsed))
        (is (= true (:success parsed)))
        (is (= "Hello!" (get-in parsed [:data :agent_response])))))
    
    (testing "TypeScript service responses are compatible"
      (let [ts-response-json "{\"success\":false,\"error\":{\"code\":1001,\"type\":\"service-unavailable\",\"message\":\"Service temporarily down\"},\"timestamp\":\"2024-01-01T00:00:00.000Z\"}"
            parsed (json/read-str ts-response-json :key-fn keyword)]
        ;; TypeScript uses nested error structure
        (is (s/valid? ::nested-error-response parsed))
        (is (= false (:success parsed)))
        (is (contains? parsed :error))))))

(deftest message-serialization-contracts-test
  (testing "About message serialization contracts"
    
    (testing "Clojure to Python serialization"
      (let [clojure-data {:user-id "123"
                          :environment-id "env-456"
                          :query "Find all entities"
                          :options {:limit 10 :include-metadata true}}
            json-str (format/serialize format/json-format clojure-data)
            python-parsed (json/read-str json-str)]
        ;; Python expects snake_case or kebab-case preserved
        (is (= "123" (get python-parsed "user-id")))
        (is (= "env-456" (get python-parsed "environment-id")))
        (is (= 10 (get-in python-parsed ["options" "limit"])))))
    
    (testing "Python to Clojure deserialization"
      (let [python-json "{\"user_id\":\"789\",\"query_result\":{\"entities\":[{\"uid\":\"e1\",\"name\":\"Entity 1\"}],\"total_count\":1}}"
            clojure-data (format/deserialize format/json-format python-json)]
        ;; Clojure preserves original key format
        (is (= "789" (:user_id clojure-data)))
        (is (= 1 (get-in clojure-data [:query_result :total_count])))))
    
    (testing "TypeScript camelCase compatibility"
      (let [ts-data {:requestId "req-123"
                     :messageType "fact-query"
                     :queryParams {:maxResults 50
                                   :includeDefinitions true}}
            json-str (format/serialize format/json-format ts-data)
            parsed (json/read-str json-str :key-fn keyword)]
        ;; Should preserve TypeScript naming
        (is (= "req-123" (:requestId parsed)))
        (is (= "fact-query" (:messageType parsed)))
        (is (= 50 (get-in parsed [:queryParams :maxResults])))))))

(deftest error-format-contracts-across-languages-test
  (testing "About error format contracts across languages"
    
    (testing "Clojure error format is consumable by Python"
      (let [clojure-error (response/error-response :database-error "Neo4j connection failed"
                                                   {:connection-string "neo4j://localhost:7687"
                                                    :retry-count 3}
                                                   "req-123")
            json-str (json/write-str clojure-error :key-fn name)
            python-parsed (json/read-str json-str)]
        (is (= false (get python-parsed "success")))
        (is (number? (get-in python-parsed ["error" "code"])))
        (is (= "database-error" (get-in python-parsed ["error" "type"])))
        (is (= 3 (get-in python-parsed ["error" "details" "retry-count"])))))
    
    (testing "Python error format is consumable by Clojure"
      (let [python-error-json "{\"success\":false,\"error\":{\"code\":2001,\"type\":\"langchain_error\",\"message\":\"Agent execution failed\",\"details\":{\"python_traceback\":\"Traceback...\",\"error_class\":\"ValueError\"}},\"timestamp\":\"2024-01-01T12:00:00.000Z\"}"
            clojure-parsed (json/read-str python-error-json :key-fn keyword)]
        (is (= false (:success clojure-parsed)))
        (is (= "langchain_error" (get-in clojure-parsed [:error :type])))
        (is (= "ValueError" (get-in clojure-parsed [:error :details :error_class])))))
    
    (testing "TypeScript error format is consumable by Clojure"
      (let [ts-error-json "{\"success\":false,\"error\":{\"code\":3001,\"type\":\"validationError\",\"message\":\"Invalid model configuration\",\"details\":{\"fieldErrors\":[{\"field\":\"modelType\",\"message\":\"Required field missing\"}]}},\"timestamp\":\"2024-01-01T12:00:00.000Z\"}"
            clojure-parsed (json/read-str ts-error-json :key-fn keyword)]
        (is (= false (:success clojure-parsed)))
        (is (= "validationError" (get-in clojure-parsed [:error :type])))
        (is (= 1 (count (get-in clojure-parsed [:error :details :fieldErrors]))))))))

(deftest data-type-preservation-contracts-test
  (testing "About data type preservation contracts"
    
    (testing "Numbers are preserved across languages"
      (let [data {:integers [1 2 3 42 1000]
                  :floats [3.14 2.718 0.5]
                  :large-number 1234567890123456789}
            json-str (format/serialize format/json-format data)
            parsed (format/deserialize format/json-format json-str)]
        (is (= [1 2 3 42 1000] (:integers parsed)))
        (is (= [3.14 2.718 0.5] (:floats parsed)))
        (is (= 1234567890123456789 (:large-number parsed)))))
    
    (testing "Booleans are preserved across languages"
      (let [data {:flags {:active true
                          :deprecated false
                          :experimental true}}
            json-str (format/serialize format/json-format data)
            parsed (format/deserialize format/json-format json-str)]
        (is (= true (get-in parsed [:flags :active])))
        (is (= false (get-in parsed [:flags :deprecated])))))
    
    (testing "Null/nil values are handled consistently"
      (let [data {:optional-field nil
                  :required-field "value"
                  :nested {:nullable nil :present "data"}}
            json-str (format/serialize format/json-format data)
            parsed (format/deserialize format/json-format json-str)]
        (is (nil? (:optional-field parsed)))
        (is (= "value" (:required-field parsed)))
        (is (nil? (get-in parsed [:nested :nullable])))
        (is (= "data" (get-in parsed [:nested :present])))))
    
    (testing "Arrays are preserved across languages"
      (let [data {:simple-array [1 2 3]
                  :string-array ["a" "b" "c"]
                  :nested-array [{:id 1 :name "first"}
                                 {:id 2 :name "second"}]
                  :empty-array []}
            json-str (format/serialize format/json-format data)
            parsed (format/deserialize format/json-format json-str)]
        (is (= [1 2 3] (:simple-array parsed)))
        (is (= ["a" "b" "c"] (:string-array parsed)))
        (is (= 2 (count (:nested-array parsed))))
        (is (= "first" (get-in parsed [:nested-array 0 :name])))
        (is (= [] (:empty-array parsed)))))))

(deftest timestamp-format-contracts-test
  (testing "About timestamp format contracts"
    
    (testing "ISO 8601 timestamps can be validated when present"
      (let [test-timestamp "2024-01-01T12:00:00.000Z"]
        (is (re-matches #"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z" test-timestamp))))
    
    (testing "Timestamps are preserved in serialization"
      (let [data {:created-at "2024-01-01T12:00:00.000Z"
                  :updated-at "2024-01-01T12:30:00.500Z"}
            json-str (format/serialize format/json-format data)
            parsed (format/deserialize format/json-format json-str)]
        (is (= "2024-01-01T12:00:00.000Z" (:created-at parsed)))
        (is (= "2024-01-01T12:30:00.500Z" (:updated-at parsed)))))))

(deftest nested-structure-contracts-test
  (testing "About nested structure contracts"
    
    (testing "Deep nesting is supported consistently"
      (let [deep-data {:level-1 {:level-2 {:level-3 {:level-4 {:value "deep"}}}}}
            json-str (format/serialize format/json-format deep-data)
            parsed (format/deserialize format/json-format json-str)]
        (is (= "deep" (get-in parsed [:level-1 :level-2 :level-3 :level-4 :value])))))
    
    (testing "Mixed data types in nested structures"
      (let [complex-data {:metadata {:count 42
                                     :active true
                                     :tags ["tag1" "tag2"]
                                     :config {:timeout nil
                                              :retries 3
                                              :endpoints ["url1" "url2"]}}}
            json-str (format/serialize format/json-format complex-data)
            parsed (format/deserialize format/json-format json-str)]
        (is (= 42 (get-in parsed [:metadata :count])))
        (is (= true (get-in parsed [:metadata :active])))
        (is (= 3 (get-in parsed [:metadata :config :retries])))
        (is (nil? (get-in parsed [:metadata :config :timeout])))))))

(deftest service-specific-message-contracts-test
  (testing "About service-specific message contracts"
    
    (testing "Archivist fact query format is consistent"
      (let [archivist-query {:type :archivist.fact/list
                             :payload {:filters {:lh-object-uid "123"
                                                 :rel-type-uid "1146"}
                                       :pagination {:skip 0 :limit 50}}}
            json-str (json/write-str archivist-query)
            parsed (json/read-str json-str :key-fn keyword)]
        ;; Keywords serialize as name only (namespace is dropped)
        (is (= "list" (:type parsed))) ; JSON serializes keyword name only
        (is (= "123" (get-in parsed [:payload :filters :lh-object-uid])))))
    
    (testing "NOUS chat message format is consistent"
      (let [nous-message {:type :nous.user/input
                          :payload {:user-id "user-123"
                                    :environment-id "env-456"
                                    :input "Find all physical objects"
                                    :metadata {:session-id "sess-789"}}}
            json-str (json/write-str nous-message)
            parsed (json/read-str json-str :key-fn keyword)]
        ;; Keywords serialize as name only (namespace is dropped)
        (is (= "input" (:type parsed))) ; JSON serializes keyword name only
        (is (= "user-123" (get-in parsed [:payload :user-id])))
        (is (= "sess-789" (get-in parsed [:payload :metadata :session-id])))))
    
    (testing "Clarity model request format is consistent"
      (let [clarity-request {:type :clarity.model/get
                             :payload {:model-id "model-123"
                                       :include-metadata true
                                       :format "json"}}
            json-str (json/write-str clarity-request)
            parsed (json/read-str json-str :key-fn keyword)]
        ;; Keywords serialize as name only (namespace is dropped)
        (is (= "get" (:type parsed))) ; JSON serializes keyword name only
        (is (= "model-123" (get-in parsed [:payload :model-id])))
        (is (= true (get-in parsed [:payload :include-metadata])))))))

(deftest error-recovery-contracts-test
  (testing "About error recovery contracts"
    
    (testing "Malformed messages are handled gracefully"
      (let [malformed-json "{\"type\":\"test\",\"payload\":\"invalid\""
            result (try
                     (format/deserialize format/json-format malformed-json)
                     (catch Exception e
                       {:error (str e)}))]
        (is (contains? result :error))))
    
    (testing "Missing required fields are detected"
      (let [incomplete-message {:payload {:data "test"}}] ; Missing :type
        (is (= false (s/valid? ::websocket-message incomplete-message)))))
    
    (testing "Invalid response format is detected"
      (let [invalid-response {:success "true"}] ; Should be boolean
        (is (= false (s/valid? ::api-response invalid-response)))))))