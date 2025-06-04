(ns io.relica.prism.services.cache-concurrency-test
  (:require [midje.sweet :refer [fact facts contains anything => provided roughly]]
            [clojure.core.async :refer [go go-loop <! >! <!! >!! chan timeout close! alts!]]
            [io.relica.common.test.midje-helpers :as helpers]
            [io.relica.prism.services.cache :as cache]
            [io.relica.prism.services.cache-rebuild :as cache-rebuild]
            [io.relica.common.services.cache-service :as common-cache]
            [io.relica.prism.io.ws-server :as ws-server]))

(defn concurrent-writer
  "Simulates concurrent write operations to cache"
  [writer-id num-operations result-chan]
  (go
    (let [start-time (System/currentTimeMillis)
          successful-ops (atom 0)
          failed-ops (atom 0)]
      (dotimes [i num-operations]
        (try
          (let [entity-uid (str "concurrent-entity-" writer-id "-" i)
                fact-uid (str "concurrent-fact-" writer-id "-" i)]
            (common-cache/add-to-entity-facts-cache 
             @common-cache/cache-service-comp 
             entity-uid 
             fact-uid)
            (swap! successful-ops inc))
          (catch Exception e
            (swap! failed-ops inc))))
      (>! result-chan {:writer-id writer-id
                       :successful @successful-ops
                       :failed @failed-ops
                       :duration (- (System/currentTimeMillis) start-time)}))))

(defn concurrent-reader
  "Simulates concurrent read operations from cache"
  [reader-id entity-uids num-reads result-chan]
  (go
    (let [start-time (System/currentTimeMillis)
          successful-reads (atom 0)
          failed-reads (atom 0)
          empty-reads (atom 0)]
      (dotimes [_ num-reads]
        (try
          (let [entity-uid (rand-nth entity-uids)
                facts (common-cache/all-facts-involving-entity 
                      @common-cache/cache-service-comp 
                      entity-uid)]
            (if (empty? facts)
              (swap! empty-reads inc)
              (swap! successful-reads inc)))
          (catch Exception e
            (swap! failed-reads inc))))
      (>! result-chan {:reader-id reader-id
                       :successful @successful-reads
                       :empty @empty-reads
                       :failed @failed-reads
                       :duration (- (System/currentTimeMillis) start-time)}))))

(facts "About concurrent cache access patterns"
       
       (fact "handles multiple concurrent writers without data loss"
             (let [num-writers 10
                   ops-per-writer 100
                   result-chan (chan num-writers)]
               
               ;; Launch concurrent writers
               (dotimes [writer-id num-writers]
                 (concurrent-writer writer-id ops-per-writer result-chan))
               
               ;; Collect results
               (let [results (atom [])]
                 (dotimes [_ num-writers]
                   (swap! results conj (<!! result-chan)))
                 
                 ;; Verify all operations completed
                 (let [total-successful (reduce + (map :successful @results))
                       total-failed (reduce + (map :failed @results))]
                   
                   total-successful => (* num-writers ops-per-writer)
                   total-failed => 0
                   
                   ;; Verify data integrity
                   (dotimes [writer-id num-writers]
                     (dotimes [i ops-per-writer]
                       (let [entity-uid (str "concurrent-entity-" writer-id "-" i)
                             facts (common-cache/all-facts-involving-entity 
                                   @common-cache/cache-service-comp 
                                   entity-uid)]
                         (count facts) => 1)))))))
       
       (fact "handles concurrent reads and writes without conflicts"
             (let [shared-entities (vec (map #(str "shared-entity-" %) (range 100)))
                   num-writers 5
                   num-readers 10
                   ops-per-thread 50
                   writer-chan (chan num-writers)
                   reader-chan (chan num-readers)]
               
               ;; Pre-populate some data
               (doseq [entity shared-entities]
                 (common-cache/add-to-entity-facts-cache 
                  @common-cache/cache-service-comp 
                  entity 
                  (str "initial-fact-" entity)))
               
               ;; Launch writers
               (dotimes [writer-id num-writers]
                 (go
                   (let [results (atom {:successful 0 :failed 0})]
                     (dotimes [i ops-per-thread]
                       (try
                         (let [entity (rand-nth shared-entities)
                               fact-uid (str "writer-" writer-id "-fact-" i)]
                           (common-cache/add-to-entity-facts-cache 
                            @common-cache/cache-service-comp 
                            entity 
                            fact-uid)
                           (swap! results update :successful inc))
                         (catch Exception e
                           (swap! results update :failed inc))))
                     (>! writer-chan @results))))
               
               ;; Launch readers
               (dotimes [reader-id num-readers]
                 (concurrent-reader reader-id shared-entities ops-per-thread reader-chan))
               
               ;; Collect results
               (let [writer-results (atom [])
                     reader-results (atom [])]
                 
                 (dotimes [_ num-writers]
                   (swap! writer-results conj (<!! writer-chan)))
                 (dotimes [_ num-readers]
                   (swap! reader-results conj (<!! reader-chan)))
                 
                 ;; Verify no failures
                 (let [total-write-failures (reduce + (map :failed @writer-results))
                       total-read-failures (reduce + (map :failed @reader-results))]
                   
                   total-write-failures => 0
                   total-read-failures => 0))))
       
       (fact "prevents race conditions during cache rebuild"
             (let [rebuild-attempts (atom 0)
                   successful-rebuilds (atom 0)
                   rejected-rebuilds (atom 0)
                   result-chans (vec (repeatedly 5 #(chan)))]
               
               (provided
                (ws-server/broadcast! anything) => nil
                (cache/build-entity-facts-cache!) => (go true)
                (cache/build-entity-lineage-cache!) => (go true)
                (cache/build-subtypes-cache!) => (go true))
               
               ;; Launch multiple concurrent rebuild attempts
               (dotimes [i 5]
                 (go
                   (swap! rebuild-attempts inc)
                   (let [result (<! (cache-rebuild/rebuild-all-caches!))]
                     (if result
                       (swap! successful-rebuilds inc)
                       (swap! rejected-rebuilds inc))
                     (>! (nth result-chans i) result))))
               
               ;; Wait for all attempts to complete
               (doseq [result-chan result-chans]
                 (<!! result-chan))
               
               ;; Verify only one rebuild succeeded
               @rebuild-attempts => 5
               @successful-rebuilds => 1
               @rejected-rebuilds => 4))
       
       (fact "maintains consistency during concurrent updates to same entity"
             (let [entity-uid "highly-contended-entity"
                   num-threads 20
                   facts-per-thread 10
                   result-chan (chan num-threads)]
               
               ;; Multiple threads updating same entity
               (dotimes [thread-id num-threads]
                 (go
                   (let [successful (atom 0)]
                     (dotimes [i facts-per-thread]
                       (try
                         (common-cache/add-to-entity-facts-cache 
                          @common-cache/cache-service-comp 
                          entity-uid 
                          (str "thread-" thread-id "-fact-" i))
                         (swap! successful inc)
                         (catch Exception e
                           (println "Failed to add fact:" (.getMessage e)))))
                     (>! result-chan @successful))))
               
               ;; Collect results
               (let [results (atom [])]
                 (dotimes [_ num-threads]
                   (swap! results conj (<!! result-chan)))
                 
                 ;; Verify all facts were added
                 (let [total-successful (reduce + @results)
                       actual-facts (common-cache/all-facts-involving-entity 
                                   @common-cache/cache-service-comp 
                                   entity-uid)]
                   
                   total-successful => (* num-threads facts-per-thread)
                   (count actual-facts) => (* num-threads facts-per-thread)))))
       
       (fact "handles concurrent access to different cache types"
             (let [num-operations 100
                   entity-uid "multi-cache-entity"
                   results (atom {:facts-success 0
                                 :lineage-success 0
                                 :descendants-success 0
                                 :failures 0})]
               
               ;; Concurrent operations on different cache types
               (let [fact-chan (go-loop [i 0]
                               (when (< i num-operations)
                                 (try
                                   (common-cache/add-to-entity-facts-cache 
                                    @common-cache/cache-service-comp 
                                    entity-uid 
                                    (str "fact-" i))
                                   (swap! results update :facts-success inc)
                                   (catch Exception e
                                     (swap! results update :failures inc)))
                                 (recur (inc i))))
                     
                     lineage-chan (go-loop [i 0]
                                   (when (< i num-operations)
                                     (try
                                       (common-cache/add-to-entity-lineage-cache 
                                        @common-cache/cache-service-comp 
                                        (str entity-uid "-" i)
                                        [(str "ancestor-" i)])
                                       (swap! results update :lineage-success inc)
                                       (catch Exception e
                                         (swap! results update :failures inc)))
                                     (recur (inc i))))
                     
                     descendants-chan (go-loop [i 0]
                                       (when (< i num-operations)
                                         (try
                                           (common-cache/add-descendant-to 
                                            @common-cache/cache-service-comp 
                                            entity-uid 
                                            (str "descendant-" i))
                                           (swap! results update :descendants-success inc)
                                           (catch Exception e
                                             (swap! results update :failures inc)))
                                         (recur (inc i))))]
                 
                 ;; Wait for all operations to complete
                 (<!! fact-chan)
                 (<!! lineage-chan)
                 (<!! descendants-chan)
                 
                 ;; Verify all operations succeeded
                 (:facts-success @results) => num-operations
                 (:lineage-success @results) => num-operations
                 (:descendants-success @results) => num-operations
                 (:failures @results) => 0)))
       
       (fact "performance remains stable under high concurrency"
             (let [num-threads 50
                   ops-per-thread 20
                   timing-results (atom [])]
               
               ;; Launch many concurrent operations
               (let [result-chan (chan num-threads)]
                 (dotimes [thread-id num-threads]
                   (go
                     (let [start-time (System/currentTimeMillis)]
                       (dotimes [i ops-per-thread]
                         (common-cache/add-to-entity-facts-cache 
                          @common-cache/cache-service-comp 
                          (str "perf-entity-" thread-id "-" i)
                          (str "perf-fact-" thread-id "-" i)))
                       (let [duration (- (System/currentTimeMillis) start-time)]
                         (>! result-chan duration)))))
                 
                 ;; Collect timing results
                 (dotimes [_ num-threads]
                   (swap! timing-results conj (<!! result-chan)))
                 
                 ;; Analyze performance
                 (let [avg-time (/ (reduce + @timing-results) num-threads)
                       max-time (apply max @timing-results)
                       min-time (apply min @timing-results)]
                   
                   ;; Average time should be reasonable
                   avg-time => (roughly 100 50) ; ~100ms ± 50ms
                   
                   ;; Max time shouldn't be too high
                   max-time => (fn [t] (< t 500)) ; Less than 500ms
                   
                   ;; Variance shouldn't be too high
                   (- max-time min-time) => (fn [diff] (< diff 300)))))))