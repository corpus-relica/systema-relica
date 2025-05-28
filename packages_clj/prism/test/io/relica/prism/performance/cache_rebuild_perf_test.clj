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
                 memory-used => (roughly 1000 200))))) ; Should use ~1GB (±200MB)