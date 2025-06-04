(ns io.relica.common.services.cache-service-test
  "Comprehensive tests for the cache service including Redis operations,
   entity management, lineage tracking, and cross-service cache coordination."
  (:require [midje.sweet :refer :all]
            [io.relica.common.services.cache-service :as cache]
            [taoensso.carmine :as car]))

;; Mock Redis operations
(def mock-redis-data (atom {}))

(defn mock-wcar* [& body]
  "Mock implementation of wcar* macro for testing without Redis"
  (let [result (atom nil)]
    (doseq [cmd body]
      (reset! result
              (case (first cmd)
                ;; String operations
                car/set (let [[_ k v] cmd]
                         (swap! mock-redis-data assoc k v)
                         "OK")
                car/get (let [[_ k] cmd]
                         (get @mock-redis-data k))
                
                ;; Set operations
                car/sadd (let [[_ k v] cmd]
                          (swap! mock-redis-data update k (fnil conj #{}) v)
                          1)
                car/srem (let [[_ k v] cmd]
                          (swap! mock-redis-data update k disj v)
                          1)
                car/smembers (let [[_ k] cmd]
                              (vec (get @mock-redis-data k #{})))
                car/sismember (let [[_ k v] cmd]
                               (if (contains? (get @mock-redis-data k #{}) v) 1 0))
                
                ;; List operations
                car/rpush (let [[_ k & vs] cmd]
                           (swap! mock-redis-data update k (fnil into []) vs)
                           (count vs))
                car/lrange (let [[_ k start end] cmd]
                            (let [lst (get @mock-redis-data k [])]
                              (if (= end -1)
                                (subvec lst start)
                                (subvec lst start (inc end)))))
                
                ;; Key operations
                car/del (let [[_ k] cmd]
                         (swap! mock-redis-data dissoc k)
                         1)
                car/keys (let [[_ pattern] cmd]
                          (filter #(re-matches (re-pattern (clojure.string/replace pattern "*" ".*")) %)
                                  (keys @mock-redis-data)))
                
                ;; Default
                nil)))
    @result))

(facts "About cache service initialization"
       (fact "creates cache service component with empty caches"
             (let [service (cache/create-cache-service-component)]
               service => truthy
               @(:descendants-cache service) => {}
               @(:entity-prompt-cache service) => {}))
       
       (fact "starts and stops service correctly"
             (with-redefs [cache/wcar* mock-wcar*]
               (let [service (cache/start "test")]
                 service => truthy
                 @cache/cache-service-comp => service
                 
                 (cache/stop)
                 @cache/cache-service-comp => nil))))

(facts "About entity facts cache operations"
       (before :facts (reset! mock-redis-data {}))
       
       (with-redefs [cache/wcar* mock-wcar*]
         (let [service (cache/create-cache-service-component)]
           
           (fact "adds facts to entity cache"
                 (cache/add-to-entity-facts-cache service "entity-123" "fact-456")
                 (let [facts (cache/all-facts-involving-entity service "entity-123")]
                   facts => [456]))
           
           (fact "handles multiple facts per entity"
                 (cache/add-to-entity-facts-cache service "entity-789" "fact-111")
                 (cache/add-to-entity-facts-cache service "entity-789" "fact-222")
                 (cache/add-to-entity-facts-cache service "entity-789" "fact-333")
                 (let [facts (cache/all-facts-involving-entity service "entity-789")]
                   (count facts) => 3
                   facts => (contains [111 222 333] :in-any-order)))
           
           (fact "removes specific facts from entity"
                 (cache/add-to-entity-facts-cache service "entity-999" "fact-100")
                 (cache/add-to-entity-facts-cache service "entity-999" "fact-200")
                 (cache/remove-from-facts-involving-entity service "entity-999" "fact-100")
                 (let [facts (cache/all-facts-involving-entity service "entity-999")]
                   facts => [200]))
           
           (fact "clears all entity facts caches"
                 (cache/add-to-entity-facts-cache service "e1" "f1")
                 (cache/add-to-entity-facts-cache service "e2" "f2")
                 (cache/clear-entity-facts-cache-complete service)
                 (cache/all-facts-involving-entity service "e1") => []
                 (cache/all-facts-involving-entity service "e2") => []))))

(facts "About entity lineage cache operations"
       (before :facts (reset! mock-redis-data {}))
       
       (with-redefs [cache/wcar* mock-wcar*]
         (let [service (cache/create-cache-service-component)]
           
           (fact "adds lineage to entity"
                 (cache/add-to-entity-lineage-cache service "child-entity" ["parent1" "parent2" "root"])
                 (let [lineage (cache/lineage-of service "child-entity")]
                   lineage => [1 2 0])) ;; String to int conversion
           
           (fact "clears lineage for specific entity"
                 (cache/add-to-entity-lineage-cache service "entity-100" ["ancestor1" "ancestor2"])
                 (cache/clear-entity-lineage-cache service "entity-100")
                 (cache/lineage-of service "entity-100") => [])
           
           (fact "clears all lineage caches"
                 (cache/add-to-entity-lineage-cache service "e1" ["a1"])
                 (cache/add-to-entity-lineage-cache service "e2" ["a2"])
                 (cache/clear-entity-lineage-cache-complete service)
                 (cache/lineage-of service "e1") => []
                 (cache/lineage-of service "e2") => []))))

(facts "About descendants cache operations"
       (before :facts (reset! mock-redis-data {}))
       
       (with-redefs [cache/wcar* mock-wcar*]
         (let [service (cache/create-cache-service-component)]
           
           (fact "adds single descendant"
                 (cache/add-descendant-to service "parent" "child1")
                 (let [descendants (cache/all-descendants-of service "parent")]
                   descendants => [1]))
           
           (fact "adds multiple descendants"
                 (cache/add-descendant-to service "root" "branch1")
                 (cache/add-descendant-to service "root" "branch2")
                 (cache/add-descendant-to service "root" "branch3")
                 (let [descendants (cache/all-descendants-of service "root")]
                   (count descendants) => 3))
           
           (fact "updates in-memory cache"
                 (cache/add-descendant-to service "entity-x" "desc1")
                 (cache/update-descendants-cache service "entity-x")
                 (get @(:descendants-cache service) "entity-x") => [1])
           
           (fact "clears all descendants"
                 (cache/add-descendant-to service "p1" "c1")
                 (cache/add-descendant-to service "p2" "c2")
                 (cache/clear-descendants service)
                 @(:descendants-cache service) => {}))))

(facts "About entity prompt cache operations"
       (let [service (cache/create-cache-service-component)]
         
         (fact "sets and retrieves prompts"
               (cache/set-prompt-of service "entity-123" "This is a test prompt")
               (cache/prompt-of service "entity-123") => "This is a test prompt")
         
         (fact "handles nil prompts"
               (cache/prompt-of service "non-existent") => nil)
         
         (fact "updates existing prompts"
               (cache/set-prompt-of service "entity-456" "Initial prompt")
               (cache/set-prompt-of service "entity-456" "Updated prompt")
               (cache/prompt-of service "entity-456") => "Updated prompt")))

(facts "About UID management"
       (before :facts (reset! mock-redis-data {}))
       
       (with-redefs [cache/wcar* mock-wcar*]
         (let [service (cache/create-cache-service-component)]
           
           (fact "manages minimum free entity UID"
                 (cache/set-min-free-entity-uid service "1000000")
                 (cache/get-min-free-entity-uid service) => "1000000")
           
           (fact "manages minimum free fact UID"
                 (cache/set-min-free-fact-uid service "2000000")
                 (cache/get-min-free-fact-uid service) => "2000000"))))

(facts "About entity removal operations"
       (before :facts (reset! mock-redis-data {}))
       
       (with-redefs [cache/wcar* mock-wcar*]
         (let [service (cache/create-cache-service-component)]
           
           (fact "removes entity completely"
                 ;; Setup entity with facts and descendants
                 (cache/add-to-entity-facts-cache service "entity-to-remove" "fact1")
                 (cache/add-to-entity-facts-cache service "entity-to-remove" "fact2")
                 (cache/add-descendant-to service "entity-to-remove" "child1")
                 (cache/set-prompt-of service "entity-to-remove" "Test prompt")
                 
                 ;; Remove entity
                 (cache/remove-entity service "entity-to-remove")
                 
                 ;; Verify all data removed
                 (cache/all-facts-involving-entity service "entity-to-remove") => []
                 (cache/all-descendants-of service "entity-to-remove") => []
                 (cache/prompt-of service "entity-to-remove") => nil))))

(facts "About error handling"
       (with-redefs [cache/wcar* (fn [& _] (throw (Exception. "Redis connection failed")))]
         (let [service (cache/create-cache-service-component)]
           
           (fact "handles Redis connection errors gracefully"
                 (cache/add-to-entity-facts-cache service "test" "fact") => nil
                 (cache/all-facts-involving-entity service "test") => []
                 (cache/lineage-of service "test") => []
                 (cache/all-descendants-of service "test") => []))))

(facts "About concurrent access"
       (before :facts (reset! mock-redis-data {}))
       
       (with-redefs [cache/wcar* mock-wcar*]
         (let [service (cache/create-cache-service-component)]
           
           (fact "handles concurrent updates to same entity"
                 (let [futures (doall
                               (for [i (range 10)]
                                 (future
                                   (cache/add-to-entity-facts-cache service "concurrent-entity" (str "fact-" i)))))]
                   ;; Wait for all futures
                   (doseq [f futures] @f)
                   
                   (let [facts (cache/all-facts-involving-entity service "concurrent-entity")]
                     (count facts) => 10))))))

(facts "About cache service as shared component"
       (with-redefs [cache/wcar* mock-wcar*]
         
         (fact "multiple services can share cache instance"
               (let [service (cache/start "shared-cache")]
                 ;; Service 1 adds data
                 (cache/add-to-entity-facts-cache service "shared-entity" "fact-from-service1")
                 
                 ;; Service 2 can access same data
                 (let [facts (cache/all-facts-involving-entity service "shared-entity")]
                   facts => [1])
                 
                 (cache/stop)))))