(ns io.relica.prism.performance.cache-memory-test
  (:require [midje.sweet :refer [fact facts contains anything => provided roughly]]
            [clojure.core.async :refer [go <! >! <!! chan timeout]]
            [io.relica.common.test.midje-helpers :as helpers]
            [io.relica.prism.services.cache :as cache]
            [io.relica.prism.services.cache-rebuild :as cache-rebuild]
            [io.relica.common.services.cache-service :as common-cache]
            [io.relica.prism.io.ws-server :as ws-server]
            [io.relica.common.io.archivist-client :as archivist]))

;; Memory measurement utilities
(defn get-detailed-memory-stats []
  "Returns detailed JVM memory statistics"
  (let [runtime (Runtime/getRuntime)
        memory-bean (java.lang.management.ManagementFactory/getMemoryMXBean)
        heap-usage (.getHeapMemoryUsage memory-bean)
        non-heap-usage (.getNonHeapMemoryUsage memory-bean)
        mb (/ 1024.0 1024.0)]
    {:jvm {:total (* (.totalMemory runtime) mb)
           :free (* (.freeMemory runtime) mb)
           :used (* (- (.totalMemory runtime) (.freeMemory runtime)) mb)
           :max (* (.maxMemory runtime) mb)}
     :heap {:init (* (.getInit heap-usage) mb)
            :used (* (.getUsed heap-usage) mb)
            :committed (* (.getCommitted heap-usage) mb)
            :max (* (.getMax heap-usage) mb)}
     :non-heap {:init (* (.getInit non-heap-usage) mb)
                :used (* (.getUsed non-heap-usage) mb)
                :committed (* (.getCommitted non-heap-usage) mb)
                :max (* (.getMax non-heap-usage) mb)}}))

(defn force-gc-and-measure []
  "Forces garbage collection and returns memory stats"
  (System/gc)
  (Thread/sleep 100) ; Allow GC to complete
  (System/gc) ; GC twice to be thorough
  (Thread/sleep 100)
  (get-detailed-memory-stats))

(defn monitor-memory-during [operation-fn sample-interval-ms]
  "Monitors memory usage during an operation"
  (let [samples (atom [])
        monitoring (atom true)
        monitor-chan (chan)]
    
    ;; Start monitoring thread
    (future
      (while @monitoring
        (swap! samples conj (get-detailed-memory-stats))
        (Thread/sleep sample-interval-ms))
      (>!! monitor-chan :done))
    
    ;; Run operation
    (let [result (operation-fn)]
      (reset! monitoring false)
      (<!! monitor-chan)
      {:result result
       :memory-samples @samples})))

(defn calculate-memory-growth [samples]
  "Calculates memory growth from samples"
  (when (seq samples)
    (let [initial (first samples)
          final (last samples)
          peak (apply max (map #(get-in % [:jvm :used]) samples))]
      {:initial-used (get-in initial [:jvm :used])
       :final-used (get-in final [:jvm :used])
       :peak-used peak
       :net-growth (- (get-in final [:jvm :used]) (get-in initial [:jvm :used]))
       :peak-growth (- peak (get-in initial [:jvm :used]))})))

;; Test data generators
(defn generate-memory-test-facts [count entity-prefix]
  (vec (for [i (range count)]
         {:lh_object_uid (str entity-prefix "-entity-" i)
          :rh_object_uid (str entity-prefix "-entity-" (inc i))
          :fact_uid (str entity-prefix "-fact-" i)})))

(facts "About cache memory usage patterns"
       
       (fact "memory usage stays within bounds for small datasets"
             (let [dataset-size 1000
                   test-facts (generate-memory-test-facts dataset-size "small")
                   memory-before (force-gc-and-measure)]
               
               (provided
                (ws-server/broadcast! anything) => nil
                (archivist/get-batch-facts anything anything) => (go {:facts test-facts})
                (archivist/get-facts-count anything) => (go (count test-facts))
                (cache/request-lineage anything) => (go {:success true :data []}))
               
               (let [{:keys [result memory-samples]} 
                     (monitor-memory-during 
                      #(<!! (cache-rebuild/rebuild-all-caches!))
                      50)
                     memory-after (force-gc-and-measure)
                     growth (calculate-memory-growth memory-samples)]
                 
                 ;; Operation should succeed
                 result => true
                 
                 ;; Memory growth should be reasonable for small dataset
                 (:peak-growth growth) => (roughly 30 15) ; ~30MB ± 15MB peak growth
                 (:net-growth growth) => (roughly 10 8)   ; ~10MB ± 8MB net growth
                 
                 ;; Should not exceed 20% of available heap
                 (let [heap-usage-percent (/ (:peak-used growth) 
                                           (get-in memory-before [:heap :max]))]
                   heap-usage-percent => (fn [x] (< x 0.2))))))
       
       (fact "memory usage scales predictably with dataset size"
             (let [sizes [1000 5000 10000]
                   memory-growths (atom {})]
               
               (doseq [size sizes]
                 (let [test-facts (generate-memory-test-facts size (str "scale-" size))
                       memory-before (force-gc-and-measure)]
                   
                   (provided
                    (ws-server/broadcast! anything) => nil
                    (archivist/get-batch-facts anything anything) => (go {:facts test-facts})
                    (archivist/get-facts-count anything) => (go (count test-facts))
                    (cache/request-lineage anything) => (go {:success true :data []}))
                   
                   (let [{:keys [memory-samples]} 
                         (monitor-memory-during 
                          #(<!! (cache-rebuild/rebuild-all-caches!))
                          100)
                         growth (calculate-memory-growth memory-samples)]
                     (swap! memory-growths assoc size growth))))
               
               ;; Verify scaling is roughly linear
               (let [growth-1k (:peak-growth (@memory-growths 1000))
                     growth-5k (:peak-growth (@memory-growths 5000))
                     growth-10k (:peak-growth (@memory-growths 10000))]
                 
                 ;; 5k should use roughly 5x memory of 1k
                 growth-5k => (roughly (* growth-1k 5) (* growth-1k 2))
                 
                 ;; 10k should use roughly 10x memory of 1k
                 growth-10k => (roughly (* growth-1k 10) (* growth-1k 4)))))
       
       (fact "detects memory leaks during repeated operations"
             (let [num-iterations 10
                   memory-measurements (atom [])]
               
               (dotimes [i num-iterations]
                 ;; Clear cache before each iteration
                 (common-cache/clear-entity-facts-cache-complete @common-cache/cache-service-comp)
                 (common-cache/clear-entity-lineage-cache-complete @common-cache/cache-service-comp)
                 (common-cache/clear-descendants @common-cache/cache-service-comp)
                 
                 ;; Force GC and measure baseline
                 (let [memory-before (force-gc-and-measure)]
                   
                   ;; Perform cache operations
                   (dotimes [j 100]
                     (common-cache/add-to-entity-facts-cache 
                      @common-cache/cache-service-comp 
                      (str "leak-test-" i "-entity-" j)
                      (str "leak-test-" i "-fact-" j)))
                   
                   ;; Clear cache again
                   (common-cache/clear-entity-facts-cache-complete @common-cache/cache-service-comp)
                   
                   ;; Measure after clearing
                   (let [memory-after (force-gc-and-measure)
                         memory-diff (- (get-in memory-after [:jvm :used])
                                       (get-in memory-before [:jvm :used]))]
                     (swap! memory-measurements conj memory-diff))))
               
               ;; Check for consistent memory usage (no significant growth trend)
               (let [measurements @memory-measurements
                     first-half (take (/ num-iterations 2) measurements)
                     second-half (drop (/ num-iterations 2) measurements)
                     first-avg (/ (reduce + first-half) (count first-half))
                     second-avg (/ (reduce + second-half) (count second-half))
                     growth-rate (- second-avg first-avg)]
                 
                 ;; Memory usage should not increase significantly over iterations
                 growth-rate => (roughly 0 5)))) ; Within 5MB variation
       
       (fact "manages memory efficiently during concurrent operations"
             (let [num-threads 10
                   ops-per-thread 100
                   memory-before (force-gc-and-measure)]
               
               (let [{:keys [memory-samples]} 
                     (monitor-memory-during
                      (fn []
                        ;; Launch concurrent operations
                        (let [result-chans (vec (repeatedly num-threads #(chan)))]
                          (dotimes [thread-id num-threads]
                            (future
                              (dotimes [i ops-per-thread]
                                (common-cache/add-to-entity-facts-cache 
                                 @common-cache/cache-service-comp 
                                 (str "concurrent-" thread-id "-entity-" i)
                                 (str "concurrent-" thread-id "-fact-" i)))
                              (>!! (nth result-chans thread-id) :done)))
                          
                          ;; Wait for all threads to complete
                          (doseq [result-chan result-chans]
                            (<!! result-chan))
                          :completed))
                      100)
                     growth (calculate-memory-growth memory-samples)]
                 
                 ;; Concurrent operations should not cause excessive memory usage
                 (:peak-growth growth) => (roughly 50 25) ; ~50MB ± 25MB
                 
                 ;; Memory usage should be stable (not constantly growing)
                 (let [usage-trend (map #(get-in % [:jvm :used]) memory-samples)
                       max-usage (apply max usage-trend)
                       min-usage (apply min usage-trend)
                       usage-variance (- max-usage min-usage)]
                   usage-variance => (fn [x] (< x 100))))) ; Less than 100MB variance
       
       (fact "handles memory pressure gracefully"
             ;; Create initial memory pressure
             (let [pressure-data (atom (vec (repeatedly 1000 #(byte-array (* 1024 1024))))) ; 1GB
                   memory-before (get-detailed-memory-stats)]
               
               ;; Try cache operations under pressure
               (let [successful-ops (atom 0)
                     failed-ops (atom 0)]
                 
                 (dotimes [i 1000]
                   (try
                     (common-cache/add-to-entity-facts-cache 
                      @common-cache/cache-service-comp 
                      (str "pressure-entity-" i)
                      (str "pressure-fact-" i))
                     (swap! successful-ops inc)
                     (catch Exception e
                       (swap! failed-ops inc))))
                 
                 ;; Release pressure
                 (reset! pressure-data nil)
                 (force-gc-and-measure)
                 
                 ;; Should handle some operations even under pressure
                 @successful-ops => (fn [x] (> x 500)) ; At least 50% should succeed
                 
                 ;; System should remain responsive
                 (+ @successful-ops @failed-ops) => 1000)))
       
       (fact "monitors heap vs non-heap memory usage"
             (let [dataset-size 5000
                   test-facts (generate-memory-test-facts dataset-size "heap-test")]
               
               (provided
                (ws-server/broadcast! anything) => nil
                (archivist/get-batch-facts anything anything) => (go {:facts test-facts})
                (archivist/get-facts-count anything) => (go (count test-facts))
                (cache/request-lineage anything) => (go {:success true :data []}))
               
               (let [memory-before (get-detailed-memory-stats)
                     _ (<!! (cache-rebuild/rebuild-all-caches!))
                     memory-after (get-detailed-memory-stats)
                     heap-growth (- (get-in memory-after [:heap :used])
                                   (get-in memory-before [:heap :used]))
                     non-heap-growth (- (get-in memory-after [:non-heap :used])
                                       (get-in memory-before [:non-heap :used]))]
                 
                 ;; Most memory should be allocated on heap
                 heap-growth => (fn [x] (> x (* non-heap-growth 2)))
                 
                 ;; Heap usage should be reasonable
                 heap-growth => (roughly 50 30) ; ~50MB ± 30MB
                 
                 ;; Non-heap growth should be minimal
                 non-heap-growth => (fn [x] (< x 20))))) ; Less than 20MB
       
       (fact "validates memory cleanup after cache clearing"
             (let [memory-baseline (force-gc-and-measure)]
               
               ;; Populate cache with significant data
               (dotimes [i 10000]
                 (common-cache/add-to-entity-facts-cache 
                  @common-cache/cache-service-comp 
                  (str "cleanup-entity-" i)
                  (str "cleanup-fact-" i))
                 (common-cache/add-to-entity-lineage-cache 
                  @common-cache/cache-service-comp 
                  (str "cleanup-entity-" i)
                  [(str "ancestor-" i)])
                 (common-cache/add-descendant-to 
                  @common-cache/cache-service-comp 
                  (str "cleanup-entity-" i)
                  (str "descendant-" i)))
               
               (let [memory-populated (get-detailed-memory-stats)
                     memory-growth (- (get-in memory-populated [:jvm :used])
                                     (get-in memory-baseline [:jvm :used]))]
                 
                 ;; Clear all caches
                 (common-cache/clear-entity-facts-cache-complete @common-cache/cache-service-comp)
                 (common-cache/clear-entity-lineage-cache-complete @common-cache/cache-service-comp)
                 (common-cache/clear-descendants @common-cache/cache-service-comp)
                 
                 (let [memory-cleared (force-gc-and-measure)
                       memory-remaining (- (get-in memory-cleared [:jvm :used])
                                          (get-in memory-baseline [:jvm :used]))]
                   
                   ;; Memory usage should return close to baseline
                   memory-remaining => (roughly 0 10) ; Within 10MB of baseline
                   
                   ;; Should have freed most of the allocated memory
                   (/ memory-remaining memory-growth) => (fn [ratio] (< ratio 0.2)))))))