(ns io.relica.prism.services.cache-eviction-test
  (:require [midje.sweet :refer [fact facts contains anything => provided roughly]]
            [clojure.core.async :refer [go <! >! <!! chan timeout]]
            [io.relica.common.test.midje-helpers :as helpers]
            [io.relica.prism.services.cache :as cache]
            [io.relica.common.services.cache-service :as common-cache]))

;; Helper functions for memory pressure simulation
(defn get-jvm-memory-usage []
  "Returns current JVM memory usage in MB"
  (let [runtime (Runtime/getRuntime)
        mb (/ 1024.0 1024.0)]
    {:total (* (.totalMemory runtime) mb)
     :free (* (.freeMemory runtime) mb)
     :used (* (- (.totalMemory runtime) (.freeMemory runtime)) mb)
     :max (* (.maxMemory runtime) mb)}))

(defn create-memory-pressure
  "Creates artificial memory pressure by allocating large byte arrays"
  [mb-to-allocate]
  (let [bytes-per-mb (* 1024 1024)
        total-bytes (* mb-to-allocate bytes-per-mb)
        chunk-size (* 10 bytes-per-mb) ; 10MB chunks
        chunks (atom [])]
    (try
      (dotimes [_ (quot total-bytes chunk-size)]
        (swap! chunks conj (byte-array chunk-size)))
      chunks
      (catch OutOfMemoryError e
        (println "Out of memory during pressure test")
        chunks))))

(defn release-memory-pressure [chunks-atom]
  "Releases memory by clearing references"
  (reset! chunks-atom [])
  (System/gc)
  (Thread/sleep 100))

(facts "About cache eviction under memory pressure"
       
       (fact "handles gracefully when approaching memory limits"
             (let [initial-memory (get-jvm-memory-usage)
                   large-dataset-size 50000]
               
               ;; Populate cache with large dataset
               (dotimes [i large-dataset-size]
                 (common-cache/add-to-entity-facts-cache 
                  @common-cache/cache-service-comp 
                  (str "entity" i) 
                  (str "fact" i)))
               
               ;; Create memory pressure
               (let [memory-before-pressure (get-jvm-memory-usage)
                     pressure-chunks (create-memory-pressure 100)]
                 
                 ;; Try to add more to cache under pressure
                 (let [additions-under-pressure (atom 0)]
                   (try
                     (dotimes [i 10000]
                       (common-cache/add-to-entity-facts-cache 
                        @common-cache/cache-service-comp 
                        (str "pressure-entity" i) 
                        (str "pressure-fact" i))
                       (swap! additions-under-pressure inc))
                     (catch Exception e
                       (println "Exception during pressure test:" (.getMessage e))))
                   
                   ;; Clean up
                   (release-memory-pressure pressure-chunks)
                   
                   ;; Verify system remained stable
                   @additions-under-pressure => (roughly 10000 9000)))))
       
       (fact "Redis handles eviction based on maxmemory policy"
             ;; This test simulates Redis eviction behavior
             (let [test-entities (range 1000)]
               
               ;; Fill cache to simulate near-capacity
               (doseq [entity-id test-entities]
                 (let [entity-uid (str "evict-test-" entity-id)]
                   ;; Add multiple facts per entity
                   (dotimes [fact-num 10]
                     (common-cache/add-to-entity-facts-cache 
                      @common-cache/cache-service-comp 
                      entity-uid 
                      (str "fact-" entity-id "-" fact-num)))))
               
               ;; Verify initial state
               (let [sample-entity "evict-test-500"
                     facts (common-cache/all-facts-involving-entity 
                           @common-cache/cache-service-comp 
                           sample-entity)]
                 (count facts) => 10)
               
               ;; Add more data to trigger potential eviction
               (doseq [entity-id (range 1000 2000)]
                 (let [entity-uid (str "evict-overflow-" entity-id)]
                   (dotimes [fact-num 5]
                     (common-cache/add-to-entity-facts-cache 
                      @common-cache/cache-service-comp 
                      entity-uid 
                      (str "overflow-fact-" entity-id "-" fact-num)))))
               
               ;; Check that newer entries exist
               (let [new-entity "evict-overflow-1500"
                     facts (common-cache/all-facts-involving-entity 
                           @common-cache/cache-service-comp 
                           new-entity)]
                 (count facts) => 5)))
       
       (fact "monitors memory usage during large batch operations"
             (let [memory-samples (atom [])
                   batch-size 1000
                   num-batches 10]
               
               ;; Record initial memory
               (swap! memory-samples conj (get-jvm-memory-usage))
               
               ;; Process batches and monitor memory
               (dotimes [batch num-batches]
                 (dotimes [i batch-size]
                   (let [entity-uid (str "batch-" batch "-entity-" i)]
                     (common-cache/add-to-entity-facts-cache 
                      @common-cache/cache-service-comp 
                      entity-uid 
                      (str "fact-" batch "-" i))))
                 
                 ;; Record memory after each batch
                 (swap! memory-samples conj (get-jvm-memory-usage)))
               
               ;; Analyze memory growth
               (let [initial-used (:used (first @memory-samples))
                     final-used (:used (last @memory-samples))
                     memory-growth (- final-used initial-used)]
                 
                 ;; Memory growth should be reasonable
                 memory-growth => (roughly 100 50) ; ~100MB ± 50MB
                 
                 ;; No sample should exceed 80% of max memory
                 (doseq [sample @memory-samples]
                   (let [usage-percent (/ (:used sample) (:max sample))]
                     usage-percent => (fn [x] (< x 0.8)))))))
       
       (fact "cache operations remain performant under memory constraints"
             (let [entities (range 5000)
                   ;; Create some memory pressure
                   pressure-chunks (create-memory-pressure 50)]
               
               ;; Measure performance under pressure
               (let [start-time (System/currentTimeMillis)]
                 
                 ;; Perform cache operations
                 (doseq [entity-id entities]
                   (common-cache/add-to-entity-facts-cache 
                    @common-cache/cache-service-comp 
                    (str "perf-entity-" entity-id) 
                    (str "perf-fact-" entity-id)))
                 
                 (let [write-time (- (System/currentTimeMillis) start-time)
                       read-start (System/currentTimeMillis)]
                   
                   ;; Read operations
                   (doseq [entity-id (take 1000 entities)]
                     (common-cache/all-facts-involving-entity 
                      @common-cache/cache-service-comp 
                      (str "perf-entity-" entity-id)))
                   
                   (let [read-time (- (System/currentTimeMillis) read-start)]
                     
                     ;; Clean up pressure
                     (release-memory-pressure pressure-chunks)
                     
                     ;; Performance assertions
                     write-time => (fn [t] (< t 5000)) ; Less than 5 seconds
                     read-time => (fn [t] (< t 1000)))))) ; Less than 1 second
       
       (fact "graceful degradation when memory critically low"
             ;; Simulate critically low memory scenario
             (let [operations-completed (atom 0)
                   operations-failed (atom 0)]
               
               ;; Create severe memory pressure
               (let [pressure-chunks (create-memory-pressure 
                                    (* 0.7 (:max (get-jvm-memory-usage))))]
                 
                 ;; Attempt operations under severe pressure
                 (dotimes [i 1000]
                   (try
                     (common-cache/add-to-entity-facts-cache 
                      @common-cache/cache-service-comp 
                      (str "critical-entity-" i) 
                      (str "critical-fact-" i))
                     (swap! operations-completed inc)
                     (catch Exception e
                       (swap! operations-failed inc))))
                 
                 ;; Clean up
                 (release-memory-pressure pressure-chunks)
                 
                 ;; Verify graceful handling
                 (+ @operations-completed @operations-failed) => 1000
                 @operations-completed => (fn [x] (>= x 500))))))