(ns io.relica.archivist.io.ws-performance-test
  (:require [clojure.test :refer [deftest testing is]]
            [clojure.core.async :as async :refer [<! >! go chan <!! >!! timeout]]
            [io.relica.archivist.test-helpers :as helpers]
            [io.relica.archivist.utils.response :as response]
            [clojure.tools.logging :as log]))

;; ==========================================================================
;; Performance Benchmarking Infrastructure
;; ==========================================================================

(defn benchmark-execution-time
  "Measure execution time of a function"
  [f & args]
  (let [start-time (System/nanoTime)
        result (apply f args)
        end-time (System/nanoTime)
        duration-ms (/ (- end-time start-time) 1000000.0)]
    {:result result
     :duration-ms duration-ms
     :start-time start-time
     :end-time end-time}))

(defn benchmark-throughput
  "Measure throughput of repeated operations"
  [operation num-iterations]
  (let [start-time (System/currentTimeMillis)
        results (doall (for [i (range num-iterations)]
                         (operation i)))
        end-time (System/currentTimeMillis)
        duration-ms (- end-time start-time)
        throughput (if (> duration-ms 0)
                     (/ num-iterations (/ duration-ms 1000.0))
                     0)]
    {:results results
     :num-iterations num-iterations
     :duration-ms duration-ms
     :throughput throughput
     :avg-time-per-op (if (> num-iterations 0) (/ duration-ms num-iterations) 0)}))

(defn benchmark-memory-usage
  "Measure memory usage during operation"
  [operation]
  (let [runtime (Runtime/getRuntime)
        _ (System/gc) ; Suggest garbage collection before measurement
        initial-memory (.totalMemory runtime)
        initial-free (.freeMemory runtime)
        initial-used (- initial-memory initial-free)
        
        result (operation)
        
        _ (System/gc) ; Suggest garbage collection after operation
        final-memory (.totalMemory runtime)
        final-free (.freeMemory runtime)
        final-used (- final-memory final-free)
        
        memory-delta (- final-used initial-used)]
    {:result result
     :initial-used-mb (/ initial-used 1024 1024)
     :final-used-mb (/ final-used 1024 1024)
     :memory-delta-mb (/ memory-delta 1024 1024)
     :max-memory-mb (/ (.maxMemory runtime) 1024 1024)}))

;; ==========================================================================
;; WebSocket Handler Performance Tests
;; ==========================================================================

(defn create-mock-handler-performance-test
  "Create a mock handler for performance testing"
  [processing-delay-ms]
  (fn [request]
    (let [start-time (System/currentTimeMillis)]
      (Thread/sleep processing-delay-ms) ; Simulate processing time
      {:success true
       :data {:processed-at (System/currentTimeMillis)
              :processing-time-ms processing-delay-ms
              :request-id (:request-id request)
              :start-time start-time}})))

(deftest ^:performance handler-response-time-test
  (testing "handler response time under normal load"
    (let [handler (create-mock-handler-performance-test 10)
          benchmark-result (benchmark-execution-time handler {:request-id "perf-test-1"})]
      (is (< (:duration-ms benchmark-result) 50)) ; Should complete within 50ms
      (is (true? (get-in benchmark-result [:result :success])))))
  
  (testing "handler response time under high processing load"
    (let [handler (create-mock-handler-performance-test 100)
          benchmark-result (benchmark-execution-time handler {:request-id "perf-test-2"})]
      (is (< (:duration-ms benchmark-result) 200)) ; Should complete within 200ms
      (is (true? (get-in benchmark-result [:result :success])))))
  
  (testing "handler throughput measurement"
    (let [handler (create-mock-handler-performance-test 5)
          num-requests 10
          throughput-result (benchmark-throughput 
                           (fn [i] (handler {:request-id (str "perf-test-" i)}))
                           num-requests)]
      (is (= num-requests (:num-iterations throughput-result)))
      (is (> (:throughput throughput-result) 5)) ; At least 5 requests per second
      (is (< (:avg-time-per-op throughput-result) 100))))) ; Average less than 100ms

(deftest ^:performance memory-usage-test
  (testing "memory usage during handler execution"
    (let [handler (create-mock-handler-performance-test 10)
          memory-benchmark (benchmark-memory-usage 
                          #(doall (repeatedly 100 (fn [] (handler {:request-id "mem-test"})))))]
      (is (< (:memory-delta-mb memory-benchmark) 10)) ; Should use less than 10MB
      (is (> (:max-memory-mb memory-benchmark) 0))))
  
  (testing "memory cleanup after batch operations"
    (let [handler (create-mock-handler-performance-test 1)
          before-gc (benchmark-memory-usage #(doall (repeatedly 50 (fn [] (handler {:request-id "gc-test"})))))
          _ (System/gc)
          after-gc-mem (let [runtime (Runtime/getRuntime)]
                        (/ (- (.totalMemory runtime) (.freeMemory runtime)) 1024 1024))]
      (is (> (:final-used-mb before-gc) 0))
      (is (< after-gc-mem (:final-used-mb before-gc))))) ; Memory should be reduced after GC

(deftest ^:performance concurrent-request-handling-test
  (testing "concurrent request handling performance"
    (let [handler (create-mock-handler-performance-test 20)
          num-concurrent 5
          start-time (System/currentTimeMillis)
          futures (repeatedly num-concurrent 
                            #(future (handler {:request-id (str "concurrent-" (System/currentTimeMillis))})))
          results (map deref futures)
          end-time (System/currentTimeMillis)
          total-duration (- end-time start-time)]
      (is (= num-concurrent (count results)))
      (is (every? #(true? (:success %)) results))
      (is (< total-duration 1000)))) ; Should complete within 1 second
  
  (testing "request queue performance under load"
    (let [handler (create-mock-handler-performance-test 5)
          queue-capacity 20
          processed-count (atom 0)
          queue-chan (chan queue-capacity)
          
          ; Producer - enqueue requests
          producer (go
                    (dotimes [i 15]
                      (>! queue-chan {:request-id (str "queue-test-" i)
                                     :enqueue-time (System/currentTimeMillis)})))
          
          ; Consumer - process requests
          consumer (go-loop []
                    (when-let [request (<! queue-chan)]
                      (handler request)
                      (swap! processed-count inc)
                      (recur)))
          
          _ (<!! producer) ; Wait for producer to complete
          _ (async/close! queue-chan)
          _ (<!! consumer)] ; Wait for consumer to complete
      
      (is (= 15 @processed-count))))

(deftest ^:performance data-serialization-performance-test
  (testing "response serialization performance"
    (let [large-data (into {} (for [i (range 1000)]
                               [(keyword (str "key-" i)) (str "value-" i)]))
          response-data {:success true :data large-data}
          benchmark-result (benchmark-execution-time pr-str response-data)]
      (is (< (:duration-ms benchmark-result) 100)) ; Should serialize within 100ms
      (is (string? (:result benchmark-result)))))
  
  (testing "large payload handling"
    (let [large-payload {:entities (repeatedly 500 #(hash-map :uid (rand-int 10000)
                                                             :name (str "Entity " (rand-int 1000))
                                                             :properties {:description (apply str (repeat 100 "x"))}))}
          handler (fn [_] {:success true :data large-payload})
          benchmark-result (benchmark-execution-time handler {:request-id "large-payload-test"})]
      (is (< (:duration-ms benchmark-result) 500)) ; Should complete within 500ms
      (is (true? (get-in benchmark-result [:result :success])))))
  
  (testing "nested data structure performance"
    (let [nested-data {:level1 {:level2 {:level3 {:level4 {:data (range 100)}}}}}
          handler (fn [_] {:success true :data nested-data})
          benchmark-result (benchmark-execution-time handler {:request-id "nested-data-test"})]
      (is (< (:duration-ms benchmark-result) 50)) ; Should complete within 50ms
      (is (true? (get-in benchmark-result [:result :success]))))))

(deftest ^:performance error-handling-performance-test
  (testing "error response generation performance"
    (let [error-handler (fn [_] (throw (ex-info "Test error" {:code 500})))
          safe-handler (fn [request]
                        (try
                          (error-handler request)
                          (catch Exception e
                            {:success false
                             :error {:code 500
                                    :type "internal-error"
                                    :message (.getMessage e)}})))
          benchmark-result (benchmark-execution-time safe-handler {:request-id "error-test"})]
      (is (< (:duration-ms benchmark-result) 10)) ; Should handle error within 10ms
      (is (false? (get-in benchmark-result [:result :success])))))
  
  (testing "validation error performance"
    (let [validation-handler (fn [request]
                              (if (nil? (:required-field request))
                                {:success false
                                 :error {:code 1102
                                        :type "missing-required-field"
                                        :message "Required field missing"
                                        :details {:field "required-field"}}}
                                {:success true :data "Valid request"}))
          benchmark-result (benchmark-execution-time validation-handler {:request-id "validation-test"})]
      (is (< (:duration-ms benchmark-result) 5)) ; Should validate within 5ms
      (is (false? (get-in benchmark-result [:result :success]))))))

(deftest ^:performance websocket-message-processing-test
  (testing "message parsing performance"
    (let [message-data {:type :archivist.fact/create
                       :payload {:lh_object_uid 1001
                                :rh_object_uid 2001
                                :rel_type_uid 1225}
                       :request_id "parse-test"}
          parser (fn [msg] (assoc msg :parsed true :parse-time (System/currentTimeMillis)))
          benchmark-result (benchmark-execution-time parser message-data)]
      (is (< (:duration-ms benchmark-result) 5)) ; Should parse within 5ms
      (is (true? (get-in benchmark-result [:result :parsed])))))
  
  (testing "message routing performance"
    (let [router {"archivist.fact/create" (fn [_] {:routed-to :fact-create})
                  "archivist.fact/update" (fn [_] {:routed-to :fact-update})
                  "archivist.fact/delete" (fn [_] {:routed-to :fact-delete})}
          route-message (fn [msg-type] (get router msg-type (fn [_] {:routed-to :unknown})))
          benchmark-result (benchmark-execution-time route-message "archivist.fact/create")]
      (is (< (:duration-ms benchmark-result) 1)) ; Should route within 1ms
      (is (fn? (:result benchmark-result)))))
  
  (testing "end-to-end message processing performance"
    (let [process-message (fn [msg]
                           (let [parsed (assoc msg :parsed true)
                                 validated (if (:payload parsed)
                                            (assoc parsed :valid true)
                                            (assoc parsed :valid false))
                                 processed (if (:valid validated)
                                            {:success true :data (:payload validated)}
                                            {:success false :error "Invalid payload"})]
                             processed))
          test-message {:type :test :payload {:data "test"}}
          benchmark-result (benchmark-execution-time process-message test-message)]
      (is (< (:duration-ms benchmark-result) 10)) ; Should process within 10ms
      (is (true? (get-in benchmark-result [:result :success]))))))

(deftest ^:performance stress-test
  (testing "sustained load performance"
    (let [handler (create-mock-handler-performance-test 1)
          num-requests 100
          start-time (System/currentTimeMillis)
          results (doall (pmap (fn [i] (handler {:request-id (str "stress-" i)}))
                              (range num-requests)))
          end-time (System/currentTimeMillis)
          duration (- end-time start-time)]
      (is (= num-requests (count results)))
      (is (every? #(true? (:success %)) results))
      (is (< duration 5000)))) ; Should complete within 5 seconds
  
  (testing "memory stability under sustained load"
    (let [handler (create-mock-handler-performance-test 1)
          initial-memory (let [runtime (Runtime/getRuntime)]
                          (/ (- (.totalMemory runtime) (.freeMemory runtime)) 1024 1024))
          _ (doall (repeatedly 200 #(handler {:request-id "memory-stress"})))
          _ (System/gc)
          final-memory (let [runtime (Runtime/getRuntime)]
                        (/ (- (.totalMemory runtime) (.freeMemory runtime)) 1024 1024))
          memory-growth (- final-memory initial-memory)]
      (is (< memory-growth 50))))) ; Memory growth should be less than 50MB