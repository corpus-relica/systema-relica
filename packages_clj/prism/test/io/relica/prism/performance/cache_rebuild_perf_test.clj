(ns io.relica.prism.performance.cache-rebuild-perf-test
  (:require [midje.sweet :refer [fact facts contains anything => provided before after roughly]]
            [clojure.core.async :refer [go <! >! <!! chan timeout]]
            [io.relica.common.test.midje-helpers :as helpers]
            [io.relica.prism.services.cache-rebuild :as cache-rebuild]
            [io.relica.prism.services.cache :as cache]
            [io.relica.prism.io.ws-server :as ws-server]
            [io.relica.common.services.cache-service :as common-cache]
            [io.relica.common.io.archivist-client :as archivist]))

;; Test data generators
(defn generate-test-facts [count]
  (vec (for [i (range count)]
         {:lh_object_uid (str "uid" i)
          :rh_object_uid (str "uid" (inc i))
          :fact_uid (str "fact" i)})))

(defn generate-test-lineage [count]
  (into {} (for [i (range count)]
             [(str "uid" i)
              (vec (for [j (range (inc i) (min (+ i 3) count))]
                     (str "uid" j)))])))

;; Performance measurement helpers
(defn measure-time [f]
  (let [start-time (System/currentTimeMillis)
        result (f)
        end-time (System/currentTimeMillis)]
    {:result result
     :time (- end-time start-time)}))

(defn measure-memory []
  (let [runtime (Runtime/getRuntime)
        mb (/ 1024.0 1024.0)]
    {:total (* (.totalMemory runtime) mb)
     :free (* (.freeMemory runtime) mb)
     :used (* (- (.totalMemory runtime) (.freeMemory runtime)) mb)}))

;; Setup and teardown
(before :facts
        (do
          (common-cache/start "test-cache")
          (cache-rebuild/reset-rebuild-status!)))

(after :facts
       (do
         (common-cache/clear-entity-facts-cache-complete @common-cache/cache-service-comp)
         (common-cache/clear-entity-lineage-cache-complete @common-cache/cache-service-comp)
         (common-cache/clear-descendants @common-cache/cache-service-comp)))

;; Access pattern generators
(defn generate-sequential-access-pattern [size]
  "Sequential access pattern - common in batch processing"
  (vec (range size)))

(defn generate-random-access-pattern [size num-accesses]
  "Random access pattern - simulates real-world usage"
  (vec (repeatedly num-accesses #(rand-int size))))

(defn generate-hot-spot-access-pattern [size num-accesses hot-spot-ratio]
  "Hot spot pattern - 80/20 rule where 20% of data gets 80% of accesses"
  (let [hot-spot-size (int (* size hot-spot-ratio))
        hot-accesses (int (* num-accesses 0.8))
        cold-accesses (- num-accesses hot-accesses)]
    (vec (concat
          (repeatedly hot-accesses #(rand-int hot-spot-size))
          (repeatedly cold-accesses #(+ hot-spot-size (rand-int (- size hot-spot-size))))))))

(defn generate-burst-access-pattern [size num-bursts burst-size]
  "Burst pattern - simulates periodic high-load scenarios"
  (vec (mapcat (fn [_]
                 (let [start (rand-int (- size burst-size))]
                   (range start (+ start burst-size))))
               (range num-bursts))))

(facts "About cache rebuild performance"
       (fact "handles small dataset (~1000 records) efficiently"
             (let [test-facts (generate-test-facts 1000)
                   test-lineage (generate-test-lineage 1000)
                   memory-before (measure-memory)]

               (provided
                (ws-server/broadcast! anything) => nil
                (archivist/get-batch-facts anything anything) => (go {:facts test-facts})
                (archivist/get-facts-count anything) => (go (count test-facts))
                (cache/request-lineage anything) => (go {:success true
                                                         :data (get test-lineage anything [])}))

               (let [{:keys [result time]} (measure-time #(<!! (cache-rebuild/rebuild-all-caches!)))
                     memory-after (measure-memory)
                     memory-used (- (:used memory-after) (:used memory-before))]

                 ;; Verify performance metrics
                 result => true
                 time => (roughly 5000 1000)  ; Should complete within 5 seconds (±1s)
                 memory-used => (roughly 50 20)))) ; Should use ~50MB (±20MB)

       (fact "handles medium dataset (~10,000 records) efficiently"
             (let [test-facts (generate-test-facts 10000)
                   test-lineage (generate-test-lineage 10000)
                   memory-before (measure-memory)]

               (provided
                (ws-server/broadcast! anything) => nil
                (archivist/get-batch-facts anything anything) => (go {:facts test-facts})
                (archivist/get-facts-count anything) => (go (count test-facts))
                (cache/request-lineage anything) => (go {:success true
                                                         :data (get test-lineage anything [])}))

               (let [{:keys [result time]} (measure-time #(<!! (cache-rebuild/rebuild-all-caches!)))
                     memory-after (measure-memory)
                     memory-used (- (:used memory-after) (:used memory-before))]

                 ;; Verify performance metrics
                 result => true
                 time => (roughly 15000 3000)  ; Should complete within 15 seconds (±3s)
                 memory-used => (roughly 200 50)))) ; Should use ~200MB (±50MB)

       (fact "handles large dataset (~100,000 records) efficiently"
             (let [test-facts (generate-test-facts 100000)
                   test-lineage (generate-test-lineage 100000)
                   memory-before (measure-memory)]

               (provided
                (ws-server/broadcast! anything) => nil
                (archivist/get-batch-facts anything anything) => (go {:facts test-facts})
                (archivist/get-facts-count anything) => (go (count test-facts))
                (cache/request-lineage anything) => (go {:success true
                                                         :data (get test-lineage anything [])}))

               (let [{:keys [result time]} (measure-time #(<!! (cache-rebuild/rebuild-all-caches!)))
                     memory-after (measure-memory)
                     memory-used (- (:used memory-after) (:used memory-before))]

                 ;; Verify performance metrics
                 result => true
                 time => (roughly 60000 15000)  ; Should complete within 60 seconds (±15s)
                 memory-used => (roughly 1000 200)))) ; Should use ~1GB (±200MB)
       
       (fact "performs well with sequential access pattern"
             (let [dataset-size 5000
                   access-pattern (generate-sequential-access-pattern dataset-size)]
               
               ;; Populate cache
               (doseq [i (range dataset-size)]
                 (common-cache/add-to-entity-facts-cache 
                  @common-cache/cache-service-comp 
                  (str "seq-entity-" i) 
                  (str "seq-fact-" i)))
               
               ;; Measure sequential access performance
               (let [{:keys [time]} (measure-time 
                                    (fn []
                                      (doseq [idx access-pattern]
                                        (common-cache/all-facts-involving-entity 
                                         @common-cache/cache-service-comp 
                                         (str "seq-entity-" idx)))))]
                 
                 ;; Sequential access should be very fast
                 time => (roughly 500 200)))) ; ~500ms ± 200ms
       
       (fact "handles random access pattern efficiently"
             (let [dataset-size 5000
                   num-accesses 10000
                   access-pattern (generate-random-access-pattern dataset-size num-accesses)]
               
               ;; Populate cache
               (doseq [i (range dataset-size)]
                 (common-cache/add-to-entity-facts-cache 
                  @common-cache/cache-service-comp 
                  (str "rand-entity-" i) 
                  (str "rand-fact-" i)))
               
               ;; Measure random access performance
               (let [{:keys [time]} (measure-time 
                                    (fn []
                                      (doseq [idx access-pattern]
                                        (common-cache/all-facts-involving-entity 
                                         @common-cache/cache-service-comp 
                                         (str "rand-entity-" idx)))))]
                 
                 ;; Random access should still be performant
                 time => (roughly 1000 300)))) ; ~1000ms ± 300ms
       
       (fact "optimizes for hot-spot access pattern"
             (let [dataset-size 5000
                   num-accesses 10000
                   hot-spot-ratio 0.2
                   access-pattern (generate-hot-spot-access-pattern dataset-size num-accesses hot-spot-ratio)]
               
               ;; Populate cache
               (doseq [i (range dataset-size)]
                 (common-cache/add-to-entity-facts-cache 
                  @common-cache/cache-service-comp 
                  (str "hot-entity-" i) 
                  (str "hot-fact-" i)))
               
               ;; Measure hot-spot access performance
               (let [{:keys [time]} (measure-time 
                                    (fn []
                                      (doseq [idx access-pattern]
                                        (common-cache/all-facts-involving-entity 
                                         @common-cache/cache-service-comp 
                                         (str "hot-entity-" idx)))))]
                 
                 ;; Hot-spot pattern should benefit from cache locality
                 time => (roughly 800 250)))) ; ~800ms ± 250ms
       
       (fact "handles burst access pattern gracefully"
             (let [dataset-size 5000
                   num-bursts 10
                   burst-size 100
                   access-pattern (generate-burst-access-pattern dataset-size num-bursts burst-size)]
               
               ;; Populate cache
               (doseq [i (range dataset-size)]
                 (common-cache/add-to-entity-facts-cache 
                  @common-cache/cache-service-comp 
                  (str "burst-entity-" i) 
                  (str "burst-fact-" i)))
               
               ;; Measure burst access performance
               (let [burst-times (atom [])]
                 (doseq [burst (partition burst-size access-pattern)]
                   (let [{:keys [time]} (measure-time 
                                        (fn []
                                          (doseq [idx burst]
                                            (common-cache/all-facts-involving-entity 
                                             @common-cache/cache-service-comp 
                                             (str "burst-entity-" idx)))))]
                     (swap! burst-times conj time)))
                 
                 ;; All bursts should complete quickly
                 (doseq [burst-time @burst-times]
                   burst-time => (roughly 50 25))))) ; ~50ms ± 25ms per burst
       
       (fact "scales linearly with data size"
             (let [sizes [1000 2000 5000 10000]
                   time-ratios (atom [])]
               
               (doseq [size sizes]
                 ;; Populate cache
                 (let [start-populate (System/currentTimeMillis)]
                   (doseq [i (range size)]
                     (common-cache/add-to-entity-facts-cache 
                      @common-cache/cache-service-comp 
                      (str "scale-entity-" size "-" i) 
                      (str "scale-fact-" size "-" i)))
                   
                   (let [populate-time (- (System/currentTimeMillis) start-populate)
                         time-per-item (/ populate-time (double size))]
                     (swap! time-ratios conj {:size size :time-per-item time-per-item}))))
               
               ;; Verify approximately linear scaling
               (let [ratios (map :time-per-item @time-ratios)
                     avg-ratio (/ (reduce + ratios) (count ratios))
                     max-deviation (apply max (map #(Math/abs (- % avg-ratio)) ratios))]
                 
                 ;; Time per item should be consistent (linear scaling)
                 max-deviation => (roughly 0.5 0.3))))