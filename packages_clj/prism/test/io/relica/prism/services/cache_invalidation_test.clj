(ns io.relica.prism.services.cache-invalidation-test
  (:require [midje.sweet :refer [fact facts contains anything => provided before after]]
            [clojure.core.async :refer [go <! >! <!! chan timeout]]
            [io.relica.common.test.midje-helpers :as helpers]
            [io.relica.prism.services.cache :as cache]
            [io.relica.common.services.cache-service :as common-cache]
            [io.relica.prism.io.client-instances :refer [archivist-client]]
            [io.relica.common.io.archivist-client :as archivist]))

;; Setup and teardown
(before :facts
        (do
          (common-cache/start "test-cache")))

(after :facts
       (do
         (common-cache/clear-entity-facts-cache-complete @common-cache/cache-service-comp)
         (common-cache/clear-entity-lineage-cache-complete @common-cache/cache-service-comp)
         (common-cache/clear-descendants @common-cache/cache-service-comp)))

(facts "About cache invalidation strategies"
       
       (fact "invalidates entity facts cache when entity is removed"
             (let [entity-uid "uid123"
                   fact-uids ["fact1" "fact2" "fact3"]]
               
               ;; Setup - populate cache
               (doseq [fact-uid fact-uids]
                 (common-cache/add-to-entity-facts-cache @common-cache/cache-service-comp entity-uid fact-uid))
               
               ;; Verify cache populated
               (let [facts (common-cache/all-facts-involving-entity @common-cache/cache-service-comp entity-uid)]
                 (count facts) => 3)
               
               ;; Remove entity
               (common-cache/remove-entity @common-cache/cache-service-comp entity-uid)
               
               ;; Verify cache cleared
               (let [facts (common-cache/all-facts-involving-entity @common-cache/cache-service-comp entity-uid)]
                 facts => [])))
       
       (fact "invalidates specific facts from entity cache"
             (let [entity-uid "uid456"
                   fact-uids ["fact10" "fact20" "fact30"]]
               
               ;; Setup - populate cache
               (doseq [fact-uid fact-uids]
                 (common-cache/add-to-entity-facts-cache @common-cache/cache-service-comp entity-uid fact-uid))
               
               ;; Remove specific fact
               (common-cache/remove-from-facts-involving-entity @common-cache/cache-service-comp entity-uid "fact20")
               
               ;; Verify partial invalidation
               (let [facts (common-cache/all-facts-involving-entity @common-cache/cache-service-comp entity-uid)]
                 (count facts) => 2
                 facts => (contains #{"10" "30"} :in-any-order))))
       
       (fact "invalidates entity lineage cache for specific entity"
             (let [entity-uid "uid789"
                   lineage ["ancestor1" "ancestor2" "ancestor3"]]
               
               ;; Setup - populate lineage cache
               (common-cache/add-to-entity-lineage-cache @common-cache/cache-service-comp entity-uid lineage)
               
               ;; Verify cache populated
               (let [cached-lineage (common-cache/lineage-of @common-cache/cache-service-comp entity-uid)]
                 cached-lineage => ["ancestor1" "ancestor2" "ancestor3"])
               
               ;; Clear lineage for entity
               (common-cache/clear-entity-lineage-cache @common-cache/cache-service-comp entity-uid)
               
               ;; Verify cache cleared
               (let [cached-lineage (common-cache/lineage-of @common-cache/cache-service-comp entity-uid)]
                 cached-lineage => [])))
       
       (fact "cascade invalidation when parent entity changes affect descendants"
             (let [parent-uid "parent1"
                   child-uids ["child1" "child2" "child3"]]
               
               ;; Setup - populate descendants cache
               (doseq [child-uid child-uids]
                 (common-cache/add-descendant-to @common-cache/cache-service-comp parent-uid child-uid))
               
               ;; Verify cache populated
               (let [descendants (common-cache/all-descendants-of @common-cache/cache-service-comp parent-uid)]
                 (count descendants) => 3)
               
               ;; Remove entity should clear its descendants
               (common-cache/remove-entity @common-cache/cache-service-comp parent-uid)
               
               ;; Verify descendants cleared
               (let [descendants (common-cache/all-descendants-of @common-cache/cache-service-comp parent-uid)]
                 descendants => [])))
       
       (fact "selective cache clearing preserves unrelated entries"
             (let [entity1 "uid1000"
                   entity2 "uid2000"
                   facts1 ["fact100" "fact101"]
                   facts2 ["fact200" "fact201"]]
               
               ;; Setup - populate caches for two entities
               (doseq [fact-uid facts1]
                 (common-cache/add-to-entity-facts-cache @common-cache/cache-service-comp entity1 fact-uid))
               (doseq [fact-uid facts2]
                 (common-cache/add-to-entity-facts-cache @common-cache/cache-service-comp entity2 fact-uid))
               
               ;; Remove only entity1
               (common-cache/remove-entity @common-cache/cache-service-comp entity1)
               
               ;; Verify entity1 cleared but entity2 preserved
               (let [facts1-after (common-cache/all-facts-involving-entity @common-cache/cache-service-comp entity1)
                     facts2-after (common-cache/all-facts-involving-entity @common-cache/cache-service-comp entity2)]
                 facts1-after => []
                 (count facts2-after) => 2)))
       
       (fact "batch invalidation for multiple entities"
             (let [entities ["uid3000" "uid3001" "uid3002"]]
               
               ;; Setup - populate cache for multiple entities
               (doseq [entity entities]
                 (common-cache/add-to-entity-facts-cache @common-cache/cache-service-comp entity (str "fact-" entity)))
               
               ;; Batch remove entities
               (doseq [entity entities]
                 (common-cache/remove-entity @common-cache/cache-service-comp entity))
               
               ;; Verify all cleared
               (doseq [entity entities]
                 (let [facts (common-cache/all-facts-involving-entity @common-cache/cache-service-comp entity)]
                   facts => []))))
       
       (fact "complete cache clear operations"
             ;; Setup - populate various caches
             (common-cache/add-to-entity-facts-cache @common-cache/cache-service-comp "uid5000" "fact5000")
             (common-cache/add-to-entity-lineage-cache @common-cache/cache-service-comp "uid5001" ["ancestor1"])
             (common-cache/add-descendant-to @common-cache/cache-service-comp "uid5002" "child1")
             
             ;; Clear all caches
             (common-cache/clear-entity-facts-cache-complete @common-cache/cache-service-comp)
             (common-cache/clear-entity-lineage-cache-complete @common-cache/cache-service-comp)
             (common-cache/clear-descendants @common-cache/cache-service-comp)
             
             ;; Verify all cleared
             (let [facts (common-cache/all-facts-involving-entity @common-cache/cache-service-comp "uid5000")
                   lineage (common-cache/lineage-of @common-cache/cache-service-comp "uid5001")
                   descendants (common-cache/all-descendants-of @common-cache/cache-service-comp "uid5002")]
               facts => []
               lineage => []
               descendants => [])))