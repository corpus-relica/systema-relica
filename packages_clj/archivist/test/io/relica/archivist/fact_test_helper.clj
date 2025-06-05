(ns io.relica.archivist.fact-test-helper
  "Helper functions for fact tests that avoid Neo4j dependencies"
  (:require [io.relica.archivist.core.fact :as fact]
            [io.relica.archivist.test-fixtures :as fixtures]))

(defn mock-create-fact 
  "Mock implementation of create-fact that avoids Neo4j calls"
  [fact-data]
  (let [mock-uid-service (fixtures/create-mock-uid-service)
        [lh-uid rh-uid fact-uid] (.reserve-uid mock-uid-service 3)
        
        ;; Handle temporary UIDs (1-100)
        final-lh-uid (if (and (number? (:lh_object_uid fact-data))
                             (>= (:lh_object_uid fact-data) 1)
                             (<= (:lh_object_uid fact-data) 100))
                      lh-uid
                      (:lh_object_uid fact-data))
        
        final-rh-uid (if (and (number? (:rh_object_uid fact-data))
                             (>= (:rh_object_uid fact-data) 1)
                             (<= (:rh_object_uid fact-data) 100))
                      rh-uid
                      (:rh_object_uid fact-data))
        
        final-fact (assoc fact-data
                         :fact_uid fact-uid
                         :lh_object_uid final-lh-uid
                         :rh_object_uid final-rh-uid)]
    
    ;; Track cache updates
    (fixtures/mock-update-facts-involving-entity nil final-lh-uid)
    (fixtures/mock-update-facts-involving-entity nil final-rh-uid)
    
    {:success true
     :fact final-fact}))

(defn mock-update-fact 
  "Mock implementation of update-fact"
  [fact-data]
  ;; Track cache updates
  (fixtures/mock-update-facts-involving-entity nil (:lh_object_uid fact-data))
  (fixtures/mock-update-facts-involving-entity nil (:rh_object_uid fact-data))
  
  {:success true
   :fact fact-data})

(defn mock-create-facts
  "Mock implementation of create-facts"
  [facts-data]
  (let [results (mapv mock-create-fact facts-data)]
    {:success true
     :facts (mapv :fact results)}))