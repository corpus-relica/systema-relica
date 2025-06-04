(ns io.relica.common.websocket.format-test
  "Comprehensive tests for WebSocket message format serialization/deserialization
   ensuring cross-language compatibility between Clojure, Python, and TypeScript."
  (:require [midje.sweet :refer :all]
            [io.relica.common.websocket.format :as format]
            [clojure.edn :as edn]
            [cheshire.core :as json]))

(facts "About EDN format serialization/deserialization"
       (let [edn-format format/edn-format]
         
         (fact "serializes simple data structures"
               (format/serialize edn-format {:message "hello" :count 42})
               => "{:message \"hello\", :count 42}")
         
         (fact "deserializes simple data structures"
               (format/deserialize edn-format "{:message \"hello\", :count 42}")
               => {:message "hello" :count 42})
         
         (fact "handles nested data structures"
               (let [data {:user {:id "123" :name "Alice"}
                           :metadata {:timestamp 1234567890
                                     :tags ["important" "urgent"]}}
                     serialized (format/serialize edn-format data)
                     deserialized (format/deserialize edn-format serialized)]
                 deserialized => data))
         
         (fact "preserves Clojure-specific types"
               (let [data {:keyword :some-keyword
                           :symbol 'some-symbol
                           :set #{1 2 3}
                           :ratio 3/4}
                     serialized (format/serialize edn-format data)
                     deserialized (format/deserialize edn-format serialized)]
                 deserialized => data
                 (type (:keyword deserialized)) => clojure.lang.Keyword
                 (type (:symbol deserialized)) => clojure.lang.Symbol
                 (type (:set deserialized)) => clojure.lang.PersistentHashSet))
         
         (fact "handles nil values"
               (format/serialize edn-format nil) => "nil"
               (format/deserialize edn-format "nil") => nil)
         
         (fact "throws on invalid EDN"
               (format/deserialize edn-format "invalid {edn") => (throws Exception))))

(facts "About JSON format serialization/deserialization"
       (let [json-format format/json-format]
         
         (fact "serializes data for TypeScript/Python compatibility"
               (let [data {:user-id "123" 
                          :environment-id "env-456"
                          :message "hello world"
                          :count 42}
                     serialized (format/serialize json-format data)]
                 ;; JSON should use camelCase for cross-language compatibility
                 serialized => (contains "\"user-id\"")
                 serialized => (contains "\"environment-id\"")
                 serialized => (contains "\"hello world\"")))
         
         (fact "deserializes JSON from TypeScript/Python services"
               (let [json-string "{\"user_id\":\"123\",\"message\":\"hello\",\"metadata\":{\"source\":\"python\"}}"
                     deserialized (format/deserialize json-format json-string)]
                 ;; Keys should be keywordized
                 deserialized => {:user_id "123"
                               :message "hello"
                               :metadata {:source "python"}}))
         
         (fact "handles arrays correctly"
               (let [data {:items ["item1" "item2" "item3"]
                          :numbers [1 2 3 4 5]}
                     serialized (format/serialize json-format data)
                     deserialized (format/deserialize json-format serialized)]
                 (:items deserialized) => ["item1" "item2" "item3"]
                 (:numbers deserialized) => [1 2 3 4 5]))
         
         (fact "handles null values"
               (let [data {:value nil :present true}
                     serialized (format/serialize json-format data)
                     deserialized (format/deserialize json-format serialized)]
                 (:value deserialized) => nil
                 (:present deserialized) => true))
         
         (fact "handles special characters"
               (let [data {:text "Line 1\nLine 2\tTabbed"
                          :unicode "Hello 世界 🌍"}
                     serialized (format/serialize json-format data)
                     deserialized (format/deserialize json-format serialized)]
                 (:text deserialized) => "Line 1\nLine 2\tTabbed"
                 (:unicode deserialized) => "Hello 世界 🌍"))
         
         (fact "throws on invalid JSON"
               (format/deserialize json-format "invalid json {") => (throws Exception))))

(facts "About Nippy format serialization/deserialization"
       (let [nippy-format format/nippy-format]
         
         (fact "serializes complex Clojure data efficiently"
               (let [data {:large-vector (vec (range 1000))
                          :nested-map {:a {:b {:c {:d "deep"}}}}
                          :mixed-types [1 :keyword "string" 'symbol #{:set}]}
                     serialized (format/serialize nippy-format data)
                     deserialized (format/deserialize nippy-format serialized)]
                 deserialized => data))
         
         (fact "preserves type information"
               (let [data {:date (java.util.Date.)
                          :uuid (java.util.UUID/randomUUID)
                          :bigint 12345678901234567890N
                          :bigdec 123.456789012345678901234567890M}
                     serialized (format/serialize nippy-format data)
                     deserialized (format/deserialize nippy-format serialized)]
                 (type (:date deserialized)) => java.util.Date
                 (type (:uuid deserialized)) => java.util.UUID
                 (type (:bigint deserialized)) => clojure.lang.BigInt
                 (type (:bigdec deserialized)) => java.math.BigDecimal))
         
         (fact "handles circular references gracefully"
               ;; Nippy should handle this without infinite loops
               (let [a (atom {})
                     _ (reset! a {:self a :value 42})
                     serialized (format/serialize nippy-format {:atom a})]
                 serialized => truthy))))

(facts "About format selection based on client info"
       
       (fact "selects JSON format for TypeScript clients"
             (format/format-for-client {:language "typescript" :format nil})
             => format/json-format)
       
       (fact "selects JSON format for Python clients"
             (format/format-for-client {:language "python" :format nil})
             => format/json-format)
       
       (fact "selects Nippy format for Clojure clients by default"
             (format/format-for-client {:language "clojure" :format nil})
             => format/nippy-format)
       
       (fact "respects explicit format preference"
             (format/format-for-client {:language "clojure" :format "json"})
             => format/json-format
             
             (format/format-for-client {:language "python" :format "edn"})
             => format/edn-format
             
             (format/format-for-client {:language "typescript" :format "nippy"})
             => format/nippy-format))

(facts "About cross-format compatibility"
       
       (fact "JSON and EDN can represent similar data"
               (let [data {:message "hello" :count 42 :active true}
                     json-serialized (format/serialize format/json-format data)
                     edn-serialized (format/serialize format/edn-format data)
                     
                     from-json (format/deserialize format/json-format json-serialized)
                     from-edn (format/deserialize format/edn-format edn-serialized)]
                 ;; Both should represent the same data
                 from-json => from-edn))
       
       (fact "handles format conversion for cross-language communication"
               (let [;; Python sends JSON
                     python-message "{\"user_id\":\"123\",\"query\":\"Find all facts\",\"options\":{\"limit\":10}}"
                     ;; Clojure receives and processes
                     clojure-data (format/deserialize format/json-format python-message)
                     ;; Clojure responds
                     response {:success true
                              :results [{:uid "1" :name "Thing"}]
                              :count 1}
                     ;; Convert back to JSON for Python
                     json-response (format/serialize format/json-format response)]
                 
                 clojure-data => {:user_id "123"
                                 :query "Find all facts"
                                 :options {:limit 10}}
                 json-response => (contains "\"success\":true")
                 json-response => (contains "\"count\":1"))))

(facts "About message serialization helpers"
       
       (fact "serialize-message uses correct format"
               (let [clojure-client {:language "clojure" :format nil}
                     python-client {:language "python" :format nil}
                     message {:type :test :data "hello"}]
                 
                 ;; Clojure client gets Nippy
                 (format/serialize-message clojure-client message)
                 => (format/serialize format/nippy-format message)
                 
                 ;; Python client gets JSON
                 (format/serialize-message python-client message)
                 => (format/serialize format/json-format message)))
       
       (fact "deserialize-message uses correct format"
               (let [clojure-client {:language "clojure" :format "edn"}
                     typescript-client {:language "typescript" :format nil}
                     edn-message "{:type :test, :data \"hello\"}"
                     json-message "{\"type\":\"test\",\"data\":\"hello\"}"]
                 
                 ;; Clojure client with EDN
                 (format/deserialize-message clojure-client edn-message)
                 => {:type :test :data "hello"}
                 
                 ;; TypeScript client with JSON
                 (format/deserialize-message typescript-client json-message)
                 => {:type "test" :data "hello"})))

(facts "About error handling in serialization"
       
       (fact "provides meaningful errors for serialization failures"
               (let [unserializable (Object.)] ;; Random Java object
                 (format/serialize format/json-format {:obj unserializable})
                 => (throws Exception)))
       
       (fact "provides meaningful errors for deserialization failures"
               (format/deserialize format/edn-format "{{invalid edn")
               => (throws Exception)
               
               (format/deserialize format/json-format "{invalid json")
               => (throws Exception)
               
               (format/deserialize format/nippy-format "not nippy data")
               => (throws Exception)))

(facts "About performance characteristics"
       
       (fact "Nippy is efficient for large data"
               (let [large-data {:matrix (vec (repeatedly 100 #(vec (range 100))))
                                :strings (vec (repeatedly 1000 #(str "string-" (rand-int 1000))))}
                     
                     nippy-start (System/currentTimeMillis)
                     nippy-serialized (format/serialize format/nippy-format large-data)
                     nippy-time (- (System/currentTimeMillis) nippy-start)
                     
                     json-start (System/currentTimeMillis)
                     json-serialized (format/serialize format/json-format large-data)
                     json-time (- (System/currentTimeMillis) json-start)]
                 
                 ;; Nippy should be more compact
                 (count nippy-serialized) => (fn [n] (< n (count json-serialized)))
                 
                 ;; Both should complete reasonably quickly
                 nippy-time => (fn [t] (< t 1000))
                 json-time => (fn [t] (< t 1000)))))