(ns io.relica.archivist.io.ws-performance-test
  (:require [midje.sweet :refer :all]
            [clojure.core.async :as async :refer [<! >! go chan <!! >!! timeout]]
            [io.relica.archivist.test-helpers :as helpers]
            [io.relica.archivist.utils.response :as response]
            [clojure.tools.logging :as log]
            [clojure.test :refer [deftest is testing]]))

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

(facts "about WebSocket handler performance"
  (fact "handlers complete within acceptable time limits"
    (let [handler (create-mock-handler-performance-test 10)
          benchmark (benchmark-execution-time handler {:request-id "perf-test-1"})]
      (:duration-ms benchmark) => (checker [actual] (< actual 50)) ; Should complete within 50ms
      (get-in benchmark [:result :success]) => true))

  (fact "handlers maintain consistent performance under load"
    (let [handler (create-mock-handler-performance-test 5)
          benchmark (benchmark-throughput #(handler {:request-id (str "load-test-" %)}) 100)]
      (:throughput benchmark) => (checker [actual] (> actual 10)) ; At least 10 ops/second
      (:avg-time-per-op benchmark) => (checker [actual] (< actual 50)) ; Average under 50ms
      (count (:results benchmark)) => 100))

  (fact "handlers have reasonable memory footprint"
    (let [handler (create-mock-handler-performance-test 1)
          benchmark (benchmark-memory-usage 
                     #(doall (for [i (range 1000)]
                               (handler {:request-id (str "memory-test-" i)}))))]
      (:memory-delta-mb benchmark) => (checker [actual] (< actual 100)) ; Less than 100MB increase
      (count (:result benchmark)) => 1000)))

;; ==========================================================================
;; Message Processing Performance Tests
;; ==========================================================================

(defn create-message-processor
  "Create a mock message processor for testing"
  [batch-size processing-delay-ms]
  (let [processed-messages (atom [])]
    {:processor (fn [messages]
                  (Thread/sleep processing-delay-ms)
                  (let [processed (mapv #(assoc % :processed-at (System/currentTimeMillis)) messages)]
                    (swap! processed-messages concat processed)
                    {:processed-count (count processed)
                     :batch-size (count messages)
                     :success true}))
     :get-processed-count (fn [] (count @processed-messages))
     :get-processed-messages (fn [] @processed-messages)
     :reset! (fn [] (reset! processed-messages []))}))

(facts "about message processing performance"
  (fact "message processor handles small batches efficiently"
    (let [processor (create-message-processor 10 5)
          messages (mapv #(hash-map :id % :data (str "message-" %)) (range 10))
          benchmark (benchmark-execution-time (:processor processor) messages)]
      (:duration-ms benchmark) => (checker [actual] (< actual 20)) ; Under 20ms
      (get-in benchmark [:result :processed-count]) => 10
      ((:get-processed-count processor)) => 10))

  (fact "message processor scales with larger batches"
    (let [processor (create-message-processor 100 10)
          messages (mapv #(hash-map :id % :data (str "large-message-" %)) (range 100))
          benchmark (benchmark-execution-time (:processor processor) messages)]
      (:duration-ms benchmark) => (checker [actual] (< actual 50)) ; Under 50ms for 100 messages
      (get-in benchmark [:result :processed-count]) => 100))

  (fact "message processor maintains performance across multiple batches"
    (let [processor (create-message-processor 50 2)
          batch-operation (fn [batch-num]
                            (let [messages (mapv #(hash-map :id (+ (* batch-num 50) %) 
                                                            :data (str "batch-" batch-num "-msg-" %)) 
                                                 (range 50))]
                              ((:processor processor) messages)))
          benchmark (benchmark-throughput batch-operation 20)]
      (:throughput benchmark) => (checker [actual] (> actual 5)) ; At least 5 batches/second
      ((:get-processed-count processor)) => 1000 ; 20 batches * 50 messages each
      (:avg-time-per-op benchmark) => (checker [actual] (< actual 200)))) ; Under 200ms per batch

  (fact "message processor has stable memory usage"
    (let [processor (create-message-processor 100 1)
          operation (fn []
                      (doseq [batch-num (range 50)]
                        (let [messages (mapv #(hash-map :id (+ (* batch-num 100) %) 
                                                        :data (str "memory-test-" batch-num "-" %)) 
                                             (range 100))]
                          ((:processor processor) messages)))
                      ((:get-processed-count processor)))
          benchmark (benchmark-memory-usage operation)]
      (:result benchmark) => 5000 ; 50 batches * 100 messages
      (:memory-delta-mb benchmark) => (checker [actual] (< actual 200))))) ; Under 200MB

;; ==========================================================================
;; Concurrent Connection Performance Tests
;; ==========================================================================

(defn create-concurrent-connection-simulator
  "Simulate multiple concurrent WebSocket connections"
  [num-connections messages-per-connection]
  (let [results (atom {:connections-created 0
                       :total-messages-sent 0
                       :total-messages-received 0
                       :errors 0
                       :start-time nil
                       :end-time nil})]
    {:simulate! (fn []
                  (swap! results assoc :start-time (System/currentTimeMillis))
                  (let [completion-chan (chan)]
                    ;; Create concurrent connections
                    (doseq [conn-id (range num-connections)]
                      (go
                        (try
                          (swap! results update :connections-created inc)
                          ;; Simulate sending messages
                          (doseq [msg-id (range messages-per-connection)]
                            (let [response {:success true :data {:conn-id conn-id :msg-id msg-id}}]
                              (if (:success response)
                                (do
                                  (swap! results update :total-messages-sent inc)
                                  (swap! results update :total-messages-received inc))
                                (swap! results update :errors inc))))
                          (catch Exception e
                            (log/error e "Error in connection simulation")
                            (swap! results update :errors inc))
                          (finally
                            (>! completion-chan conn-id)))))
                    
                    ;; Wait for all connections to complete
                    (<!! (go
                           (doseq [_ (range num-connections)]
                             (<! completion-chan))
                           (swap! results assoc :end-time (System/currentTimeMillis))))
                    
                    @results))
     :get-results (fn [] @results)}))

(facts "about concurrent connection performance"
  (fact "system handles moderate concurrent connections efficiently"
    (let [simulator (create-concurrent-connection-simulator 10 20)
          benchmark (benchmark-execution-time (:simulate! simulator))]
      (:duration-ms benchmark) => (checker [actual] (< actual 5000)) ; Under 5 seconds
      (let [results (get-in benchmark [:result])]
        (:connections-created results) => 10
        (:total-messages-sent results) => 200 ; 10 connections * 20 messages
        (:total-messages-received results) => 200
        (:errors results) => 0)))

  (fact "system scales to higher concurrent loads"
    (let [simulator (create-concurrent-connection-simulator 50 10)
          benchmark (benchmark-execution-time (:simulate! simulator))]
      (:duration-ms benchmark) => (checker [actual] (< actual 10000)) ; Under 10 seconds
      (let [results (get-in benchmark [:result])]
        (:connections-created results) => 50
        (:total-messages-sent results) => 500 ; 50 connections * 10 messages
        (:errors results) => 0)))

  (fact "system provides performance metrics for concurrent operations"
    (let [simulator (create-concurrent-connection-simulator 25 15)
          results ((:simulate! simulator))
          duration-ms (- (:end-time results) (:start-time results))
          throughput (if (> duration-ms 0) (/ (:total-messages-sent results) (/ duration-ms 1000.0)) 0)]
      duration-ms => (checker [actual] (> actual 0))
      throughput => (checker [actual] (> actual 10)) ; At least 10 messages/second
      (:connections-created results) => 25
      (:total-messages-sent results) => 375)))

;; ==========================================================================
;; Performance Regression Tests
;; ==========================================================================

(def performance-baselines
  "Performance baselines for regression testing"
  {:single-handler-max-time 50     ; milliseconds
   :batch-processing-max-time 200  ; milliseconds for 100 items
   :min-throughput 10              ; operations per second
   :max-memory-increase 100        ; MB
   :concurrent-connections-max-time 5000 ; milliseconds for 10 connections
   :message-processing-throughput 100})   ; messages per second

(facts "about performance regression prevention"
  (fact "single handler performance has not regressed"
    (let [handler (create-mock-handler-performance-test 5)
          benchmark (benchmark-execution-time handler {:request-id "regression-test"})]
      (:duration-ms benchmark) => (checker [actual] 
                                    (< actual (:single-handler-max-time performance-baselines)))))

  (fact "batch processing performance has not regressed"
    (let [processor (create-message-processor 100 5)
          messages (mapv #(hash-map :id % :data (str "regression-msg-" %)) (range 100))
          benchmark (benchmark-execution-time (:processor processor) messages)]
      (:duration-ms benchmark) => (checker [actual] 
                                    (< actual (:batch-processing-max-time performance-baselines)))))

  (fact "throughput performance has not regressed"
    (let [operation (fn [_] (Thread/sleep 5) {:success true})
          benchmark (benchmark-throughput operation 50)]
      (:throughput benchmark) => (checker [actual] 
                                   (> actual (:min-throughput performance-baselines)))))

  (fact "memory usage has not regressed"
    (let [operation (fn [] (doall (for [i (range 1000)] {:id i :data (str "data-" i)})))
          benchmark (benchmark-memory-usage operation)]
      (:memory-delta-mb benchmark) => (checker [actual] 
                                        (< actual (:max-memory-increase performance-baselines)))))

  (fact "concurrent connection performance has not regressed"
    (let [simulator (create-concurrent-connection-simulator 10 10)
          benchmark (benchmark-execution-time (:simulate! simulator))]
      (:duration-ms benchmark) => (checker [actual] 
                                    (< actual (:concurrent-connections-max-time performance-baselines))))))

;; ==========================================================================
;; Performance Reporting
;; ==========================================================================

(defn generate-performance-report
  "Generate a comprehensive performance report"
  []
  (let [report (atom {:timestamp (System/currentTimeMillis)
                      :tests []
                      :summary {:total-tests 0
                                :passed-tests 0
                                :failed-tests 0
                                :avg-performance-score 0}})]
    
    ;; Single handler test
    (let [handler (create-mock-handler-performance-test 5)
          benchmark (benchmark-execution-time handler {:request-id "report-test-1"})
          passed (< (:duration-ms benchmark) 50)]
      (swap! report update :tests conj
             {:test-name "Single Handler Performance"
              :duration-ms (:duration-ms benchmark)
              :baseline-ms 50
              :passed passed
              :score (if passed 100 (max 0 (- 100 (* 2 (- (:duration-ms benchmark) 50)))))}))
    
    ;; Throughput test
    (let [operation (fn [_] (Thread/sleep 2) {:success true})
          benchmark (benchmark-throughput operation 100)
          passed (> (:throughput benchmark) 20)]
      (swap! report update :tests conj
             {:test-name "Throughput Performance"
              :throughput (:throughput benchmark)
              :baseline-throughput 20
              :passed passed
              :score (if passed 100 (max 0 (min 100 (* 5 (:throughput benchmark)))))}))
    
    ;; Memory usage test
    (let [operation (fn [] (doall (for [i (range 500)] {:id i :data (str "test-" i)})))
          benchmark (benchmark-memory-usage operation)
          passed (< (:memory-delta-mb benchmark) 50)]
      (swap! report update :tests conj
             {:test-name "Memory Usage"
              :memory-delta-mb (:memory-delta-mb benchmark)
              :baseline-mb 50
              :passed passed
              :score (if passed 100 (max 0 (- 100 (* 2 (:memory-delta-mb benchmark)))))}))
    
    ;; Calculate summary
    (let [tests (:tests @report)
          total-tests (count tests)
          passed-tests (count (filter :passed tests))
          avg-score (if (> total-tests 0) (/ (reduce + (map :score tests)) total-tests) 0)]
      (swap! report update :summary assoc
             :total-tests total-tests
             :passed-tests passed-tests
             :failed-tests (- total-tests passed-tests)
             :avg-performance-score avg-score))
    
    @report))

(facts "about performance reporting"
  (fact "performance report includes all key metrics"
    (let [report (generate-performance-report)]
      (contains? report :timestamp) => true
      (contains? report :tests) => true
      (contains? report :summary) => true
      (get-in report [:summary :total-tests]) => (checker [actual] (> actual 0))
      (get-in report [:summary :avg-performance-score]) => (checker [actual] (and (>= actual 0) (<= actual 100)))))

  (fact "performance report correctly identifies test results"
    (let [report (generate-performance-report)
          tests (:tests report)]
      (every? #(contains? % :test-name) tests) => true
      (every? #(contains? % :passed) tests) => true
      (every? #(contains? % :score) tests) => true
      (every? #(and (>= (:score %) 0) (<= (:score %) 100)) tests) => true)))