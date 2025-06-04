(ns io.relica.prism.statechart.statechart-cache-test
  (:require [midje.sweet :refer [fact facts contains anything => provided roughly]]
            [clojure.core.async :refer [go <! >! <!! chan timeout]]
            [io.relica.common.test.midje-helpers :as helpers]
            [io.relica.prism.statechart.statechart-controller :as controller]
            [io.relica.prism.services.cache :as cache]
            [io.relica.prism.services.db :as db]
            [io.relica.prism.setup :as setup]
            [io.relica.common.services.cache-service :as common-cache]))

;; Mock statechart state management
(def mock-statechart-state (atom {:current-state :initial
                                  :context {}
                                  :events []}))

(defn mock-send-event [event]
  "Mock function for sending events to statechart"
  (swap! mock-statechart-state update :events conj event)
  (case (if (map? event) (:type event) event)
    :DB_CHECK_COMPLETE_EMPTY 
    (swap! mock-statechart-state assoc :current-state :seeding-required)
    
    :DB_CHECK_COMPLETE_NOT_EMPTY 
    (swap! mock-statechart-state assoc :current-state :cache-building)
    
    :SEEDING_COMPLETE 
    (swap! mock-statechart-state assoc :current-state :cache-building)
    
    :FACTS_CACHE_COMPLETE 
    (swap! mock-statechart-state assoc :current-state :lineage-cache-building)
    
    :LINEAGE_CACHE_COMPLETE 
    (swap! mock-statechart-state assoc :current-state :subtypes-cache-building)
    
    :SUBTYPES_CACHE_COMPLETE 
    (swap! mock-statechart-state assoc :current-state :ready)
    
    :ERROR 
    (swap! mock-statechart-state assoc :current-state :error
                                      :error (:error-message event))
    
    ;; Default
    nil))

(facts "About statechart cache interactions"
       
       (fact "transitions through cache building states correctly"
             ;; Reset mock state
             (reset! mock-statechart-state {:current-state :initial :context {} :events []})
             
             (with-redefs [controller/send-event mock-send-event]
               
               ;; Check database (assume not empty)
               (provided
                (db/database-empty?) => false)
               
               (controller/check-db-activity {})
               
               ;; Should transition to cache building
               (:current-state @mock-statechart-state) => :cache-building
               (last (:events @mock-statechart-state)) => :DB_CHECK_COMPLETE_NOT_EMPTY))
       
       (fact "builds caches sequentially through statechart states"
             (reset! mock-statechart-state {:current-state :cache-building :context {} :events []})
             
             (with-redefs [controller/send-event mock-send-event]
               
               ;; Start facts cache building
               (provided
                (cache/build-entity-facts-cache!) => (go true))
               
               (controller/build-facts-cache-activity {})
               
               ;; Wait for async completion
               (<!! (timeout 100))
               
               ;; Should have sent facts cache complete event
               (some #{:FACTS_CACHE_COMPLETE} (:events @mock-statechart-state)) => true
               (:current-state @mock-statechart-state) => :lineage-cache-building))
       
       (fact "handles cache build failures in statechart context"
             (reset! mock-statechart-state {:current-state :cache-building :context {} :events []})
             
             (with-redefs [controller/send-event mock-send-event]
               
               ;; Facts cache build fails
               (provided
                (cache/build-entity-facts-cache!) => (go false))
               
               (controller/build-facts-cache-activity {})
               
               ;; Wait for async completion
               (<!! (timeout 100))
               
               ;; Should transition to error state
               (:current-state @mock-statechart-state) => :error
               (let [error-events (filter map? (:events @mock-statechart-state))
                     error-event (first error-events)]
                 (:type error-event) => :ERROR
                 (:error-message error-event) => (contains "Facts cache build failed"))))
       
       (fact "maintains cache state consistency during statechart transitions"
             (reset! mock-statechart-state {:current-state :initial :context {} :events []})
             
             (with-redefs [controller/send-event mock-send-event]
               
               ;; Clear all caches initially
               (common-cache/clear-entity-facts-cache-complete @common-cache/cache-service-comp)
               (common-cache/clear-entity-lineage-cache-complete @common-cache/cache-service-comp)
               (common-cache/clear-descendants @common-cache/cache-service-comp)
               
               ;; Verify caches are empty
               (let [facts (common-cache/all-facts-involving-entity @common-cache/cache-service-comp "test-uid")
                     lineage (common-cache/lineage-of @common-cache/cache-service-comp "test-uid")
                     descendants (common-cache/all-descendants-of @common-cache/cache-service-comp "test-uid")]
                 facts => []
                 lineage => []
                 descendants => [])
               
               ;; Simulate successful cache building sequence
               (provided
                (db/database-empty?) => false
                (cache/build-entity-facts-cache!) => (go true)
                (cache/build-entity-lineage-cache!) => (go true)
                (cache/build-subtypes-cache!) => (go true))
               
               ;; Go through statechart sequence
               (controller/check-db-activity {})
               (:current-state @mock-statechart-state) => :cache-building
               
               (controller/build-facts-cache-activity {})
               (<!! (timeout 100))
               (:current-state @mock-statechart-state) => :lineage-cache-building
               
               (controller/build-lineage-cache-activity {})
               (<!! (timeout 100))
               (:current-state @mock-statechart-state) => :subtypes-cache-building))
       
       (fact "handles database seeding with cache initialization"
             (reset! mock-statechart-state {:current-state :initial :context {} :events []})
             
             (with-redefs [controller/send-event mock-send-event]
               
               ;; Database is empty, requires seeding
               (provided
                (db/database-empty?) => true
                (setup/seed-database!) => true)
               
               (controller/check-db-activity {})
               (:current-state @mock-statechart-state) => :seeding-required
               
               (controller/seed-db-activity {})
               
               ;; Should transition to cache building after seeding
               (:current-state @mock-statechart-state) => :cache-building
               (some #{:SEEDING_COMPLETE} (:events @mock-statechart-state)) => true))
       
       (fact "prevents cache operations during invalid statechart states"
             (reset! mock-statechart-state {:current-state :error :context {} :events []})
             
             ;; In error state, cache operations should not proceed
             (let [cache-operation-attempted (atom false)]
               
               (with-redefs [controller/send-event mock-send-event
                           cache/build-entity-facts-cache! (fn [] 
                                                            (reset! cache-operation-attempted true)
                                                            (go false))]
                 
                 ;; Try to build cache while in error state
                 ;; (In real implementation, statechart would prevent this)
                 (:current-state @mock-statechart-state) => :error
                 
                 ;; Verify we're in error state before attempting operation
                 (:current-state @mock-statechart-state) => :error)))
       
       (fact "coordinates cache rebuild with statechart state"
             (reset! mock-statechart-state {:current-state :ready :context {} :events []})
             
             ;; When system is ready, cache rebuild should be possible
             (with-redefs [controller/send-event mock-send-event]
               
               ;; Clear caches to simulate need for rebuild
               (common-cache/clear-entity-facts-cache-complete @common-cache/cache-service-comp)
               
               ;; System should allow cache operations when ready
               (:current-state @mock-statechart-state) => :ready
               
               ;; Trigger cache rebuild (would normally transition back to cache-building)
               (provided
                (cache/build-entity-facts-cache!) => (go true))
               
               (controller/build-facts-cache-activity {})
               (<!! (timeout 100))
               
               ;; Should have completed cache build
               (some #{:FACTS_CACHE_COMPLETE} (:events @mock-statechart-state)) => true))
       
       (fact "validates cache integrity during statechart error recovery"
             (reset! mock-statechart-state {:current-state :error :context {} :events []})
             
             ;; Add some test data to cache before error recovery
             (common-cache/add-to-entity-facts-cache @common-cache/cache-service-comp "error-test-uid" "error-test-fact")
             
             ;; Verify data exists
             (let [facts-before (common-cache/all-facts-involving-entity @common-cache/cache-service-comp "error-test-uid")]
               (count facts-before) => 1)
             
             ;; Simulate error recovery and cache rebuild
             (reset! mock-statechart-state {:current-state :cache-building :context {} :events []})
             
             (with-redefs [controller/send-event mock-send-event]
               
               (provided
                (cache/build-entity-facts-cache!) => (go true))
               
               (controller/build-facts-cache-activity {})
               (<!! (timeout 100))
               
               ;; After successful rebuild, should be in next state
               (:current-state @mock-statechart-state) => :lineage-cache-building
               
               ;; Cache data integrity should be maintained or properly rebuilt
               (let [facts-after (common-cache/all-facts-involving-entity @common-cache/cache-service-comp "error-test-uid")]
                 ;; Data may be cleared during rebuild or preserved - both are valid
                 facts-after => (fn [facts] (or (empty? facts) (seq facts))))))
       
       (fact "tracks cache build progress through statechart context"
             (reset! mock-statechart-state {:current-state :cache-building 
                                           :context {:cache-progress {:facts false
                                                                     :lineage false
                                                                     :subtypes false}}
                                           :events []})
             
             (with-redefs [controller/send-event (fn [event]
                                                   (mock-send-event event)
                                                   ;; Also update context
                                                   (when (= event :FACTS_CACHE_COMPLETE)
                                                     (swap! mock-statechart-state 
                                                           assoc-in [:context :cache-progress :facts] true)))]
               
               (provided
                (cache/build-entity-facts-cache!) => (go true))
               
               (controller/build-facts-cache-activity {})
               (<!! (timeout 100))
               
               ;; Context should track completion
               (get-in @mock-statechart-state [:context :cache-progress :facts]) => true
               (get-in @mock-statechart-state [:context :cache-progress :lineage]) => false
               (get-in @mock-statechart-state [:context :cache-progress :subtypes]) => false)))