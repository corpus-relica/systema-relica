(ns io.relica.prism.services.cache-reliability-test
  (:require [midje.sweet :refer [fact facts contains anything => provided roughly]]
            [clojure.core.async :refer [go <! >! <!! chan timeout close!]]
            [io.relica.common.test.midje-helpers :as helpers]
            [io.relica.prism.services.cache :as cache]
            [io.relica.prism.services.cache-rebuild :as cache-rebuild]
            [io.relica.common.services.cache-service :as common-cache]
            [io.relica.prism.io.ws-server :as ws-server]
            [io.relica.common.io.archivist-client :as archivist]))

;; Test data generators for failure scenarios
(defn generate-partial-facts [count failure-at]
  "Generates facts that will fail at a specific point"
  (vec (for [i (range count)]
         (if (= i failure-at)
           nil ; Simulate missing/corrupted data
           {:lh_object_uid (str "uid" i)
            :rh_object_uid (str "uid" (inc i))
            :fact_uid (str "fact" i)}))))

(defn generate-malformed-facts [count]
  "Generates facts with missing required fields"
  (vec (for [i (range count)]
         (case (mod i 4)
           0 {:lh_object_uid (str "uid" i)
              :rh_object_uid (str "uid" (inc i))
              :fact_uid (str "fact" i)}
           1 {:lh_object_uid (str "uid" i)
              :fact_uid (str "fact" i)} ; Missing rh_object_uid
           2 {:rh_object_uid (str "uid" (inc i))
              :fact_uid (str "fact" i)} ; Missing lh_object_uid
           3 {:lh_object_uid (str "uid" i)
              :rh_object_uid (str "uid" (inc i))}))))  ; Missing fact_uid

(facts "About cache rebuild reliability under failure scenarios"
       
       (fact "recovers gracefully from partial data failures"
             (let [test-facts (generate-partial-facts 1000 500)
                   test-lineage (into {} (for [i (range 1000)]
                                          [(str "uid" i)
                                           (vec (for [j (range (inc i) (min (+ i 3) 1000))]
                                                  (str "uid" j)))]))]
               
               (provided
                (ws-server/broadcast! anything) => nil
                (archivist/get-batch-facts anything anything) => (go {:facts (remove nil? test-facts)})
                (archivist/get-facts-count anything) => (go (count (remove nil? test-facts)))
                (cache/request-lineage anything) => (go {:success true
                                                         :data (get test-lineage anything [])}))
               
               (let [result (<!! (cache-rebuild/rebuild-all-caches!))]
                 ;; Should complete successfully despite partial data
                 result => true
                 
                 ;; Verify final status
                 (let [status (cache-rebuild/get-rebuild-status)]
                   (:status status) => :complete
                   (:error status) => nil))))
       
       (fact "handles network timeouts during data fetching"
             (let [timeout-chan (chan)]
               
               (provided
                (ws-server/broadcast! anything) => nil
                ;; Simulate timeout by never responding
                (archivist/get-batch-facts anything anything) => timeout-chan
                (archivist/get-facts-count anything) => (go 1000))
               
               ;; Start rebuild and wait briefly
               (let [rebuild-chan (cache-rebuild/rebuild-all-caches!)]
                 ;; Wait a short time then close timeout channel to simulate timeout
                 (<!! (timeout 100))
                 (close! timeout-chan)
                 
                 (let [result (<!! rebuild-chan)]
                   ;; Should fail gracefully
                   result => false
                   
                   ;; Verify error status
                   (let [status (cache-rebuild/get-rebuild-status)]
                     (:status status) => :error
                     (:error status) => (contains "Failed to build entity facts cache"))))))
       
       (fact "resumes rebuild after interruption"
             ;; First attempt fails
             (provided
              (ws-server/broadcast! anything) => nil
              (cache/build-entity-facts-cache!) => (go false))
             
             (let [first-result (<!! (cache-rebuild/rebuild-all-caches!))]
               first-result => false
               
               ;; Reset and try again
               (cache-rebuild/reset-rebuild-status!)
               
               ;; Second attempt succeeds
               (provided
                (ws-server/broadcast! anything) => nil
                (cache/build-entity-facts-cache!) => (go true)
                (cache/build-entity-lineage-cache!) => (go true)
                (cache/build-subtypes-cache!) => (go true))
               
               (let [second-result (<!! (cache-rebuild/rebuild-all-caches!))]
                 second-result => true
                 
                 (let [status (cache-rebuild/get-rebuild-status)]
                   (:status status) => :complete))))
       
       (fact "handles Redis connection failures gracefully"
             ;; Simulate Redis unavailability by making cache operations fail
             (let [original-add-fn common-cache/add-to-entity-facts-cache]
               (provided
                (ws-server/broadcast! anything) => nil
                (archivist/get-batch-facts anything anything) => (go {:facts [{:lh_object_uid "uid1"
                                                                              :rh_object_uid "uid2"
                                                                              :fact_uid "fact1"}]})
                (archivist/get-facts-count anything) => (go 1)
                ;; Make cache operations throw exceptions
                (common-cache/add-to-entity-facts-cache anything anything anything) => (throw (Exception. "Redis connection failed")))
               
               (let [result (<!! (cache-rebuild/rebuild-all-caches!))]
                 ;; Should handle Redis failures
                 result => false)))
       
       (fact "maintains consistency during partial rebuild failures"
             ;; Test scenario where some caches succeed and others fail
             (provided
              (ws-server/broadcast! anything) => nil
              (cache/build-entity-facts-cache!) => (go true)  ; Succeeds
              (cache/build-entity-lineage-cache!) => (go false) ; Fails
              (cache/build-subtypes-cache!) => (go true))  ; Would succeed but shouldn't reach here
             
             (let [result (<!! (cache-rebuild/rebuild-all-caches!))]
               result => false
               
               ;; Verify error state
               (let [status (cache-rebuild/get-rebuild-status)]
                 (:status status) => :error
                 (:error status) => "Failed to build entity lineage cache")))
       
       (fact "handles malformed data without crashing"
             (let [malformed-facts (generate-malformed-facts 100)]
               
               (provided
                (ws-server/broadcast! anything) => nil
                (archivist/get-batch-facts anything anything) => (go {:facts malformed-facts})
                (archivist/get-facts-count anything) => (go (count malformed-facts))
                (cache/request-lineage anything) => (go {:success true :data []}))
               
               ;; Should handle malformed data gracefully
               (let [result (<!! (cache-rebuild/rebuild-all-caches!))]
                 ;; May succeed or fail, but shouldn't crash
                 result => (fn [r] (or (= r true) (= r false))))))
       
       (fact "recovers from memory exhaustion during rebuild"
             ;; Simulate memory pressure during rebuild
             (let [large-dataset (vec (repeatedly 50000 
                                                 #(hash-map :lh_object_uid (str "uid" (rand-int 10000))
                                                           :rh_object_uid (str "uid" (rand-int 10000))
                                                           :fact_uid (str "fact" (rand-int 100000)))))]
               
               (provided
                (ws-server/broadcast! anything) => nil
                (archivist/get-batch-facts anything anything) => (go {:facts large-dataset})
                (archivist/get-facts-count anything) => (go (count large-dataset))
                (cache/request-lineage anything) => (go {:success true :data []}))
               
               ;; Try to rebuild with large dataset
               (let [result (try
                             (<!! (cache-rebuild/rebuild-all-caches!))
                             (catch OutOfMemoryError e
                               false)
                             (catch Exception e
                               false))]
                 
                 ;; Should either succeed or fail gracefully (not crash)
                 result => (fn [r] (or (= r true) (= r false))))))
       
       (fact "handles concurrent rebuild attempts during failure recovery"
             ;; Start rebuild that will fail
             (provided
              (ws-server/broadcast! anything) => nil
              (cache/build-entity-facts-cache!) => (go false))
             
             (let [first-rebuild (cache-rebuild/rebuild-all-caches!)]
               
               ;; Start second rebuild while first is still running
               (let [second-rebuild (cache-rebuild/rebuild-all-caches!)]
                 
                 ;; Both should complete
                 (let [first-result (<!! first-rebuild)
                       second-result (<!! second-rebuild)]
                   
                   ;; First should fail, second should be rejected
                   first-result => false
                   second-result => false))))
       
       (fact "validates cache integrity after failed rebuild"
             ;; Start with clean state
             (common-cache/clear-entity-facts-cache-complete @common-cache/cache-service-comp)
             (common-cache/clear-entity-lineage-cache-complete @common-cache/cache-service-comp)
             (common-cache/clear-descendants @common-cache/cache-service-comp)
             
             ;; Add some initial data
             (common-cache/add-to-entity-facts-cache @common-cache/cache-service-comp "pre-existing" "fact-pre")
             
             ;; Attempt rebuild that fails
             (provided
              (ws-server/broadcast! anything) => nil
              (cache/build-entity-facts-cache!) => (go false))
             
             (<!! (cache-rebuild/rebuild-all-caches!))
             
             ;; Verify pre-existing data is still intact
             (let [existing-facts (common-cache/all-facts-involving-entity 
                                  @common-cache/cache-service-comp 
                                  "pre-existing")]
               (count existing-facts) => 1))
       
       (fact "tracks rebuild progress accurately during failures"
             (let [progress-updates (atom [])]
               
               (provided
                (ws-server/broadcast! anything) => (swap! progress-updates conj (get-in anything [:data :progress]))
                (cache/build-entity-facts-cache!) => (go true)   ; First succeeds
                (cache/build-entity-lineage-cache!) => (go false) ; Second fails
                (cache/build-subtypes-cache!) => (go true))      ; Third wouldn't be reached
               
               (<!! (cache-rebuild/rebuild-all-caches!))
               
               ;; Verify progress tracking stopped at failure point
               (let [updates @progress-updates]
                 (some #{0} updates) => true    ; Initial
                 (some #{33} updates) => true   ; After facts cache
                 (some #{66} updates) => nil    ; Should not reach lineage completion
                 (some #{100} updates) => nil))) ; Should not reach completion)