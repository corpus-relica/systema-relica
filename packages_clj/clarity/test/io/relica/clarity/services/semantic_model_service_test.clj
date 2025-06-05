(ns io.relica.clarity.services.semantic-model-service-test
  "Tests for semantic model service - core OSM functionality"
  (:require [clojure.test :refer :all]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]
            [io.relica.clarity.services.semantic-model-service :as sms]
            [io.relica.clarity.test-fixtures :as fixtures]
            [io.relica.clarity.test-helpers :as helpers]
            [io.relica.clarity.io.archivist-api :as archivist-api]
            [io.relica.clarity.io.client-instances :refer [archivist-client]]
            [io.relica.clarity.services.physical-object-model-service :as po-ms]
            [io.relica.clarity.services.aspect-model-service :as asp-ms]
            [io.relica.clarity.services.role-model-service :as rol-ms]
            [io.relica.clarity.services.relation-model-service :as rel-ms]
            [io.relica.clarity.services.occurrence-model-service :as occ-ms]
            [io.relica.clarity.services.entity-model-service :as e-ms]))

(deftest test-category-to-spec-mapping
  (testing "Category to spec mapping is properly defined"
    (is (contains? sms/category-to-spec "physical object"))
    (is (contains? sms/category-to-spec "aspect"))
    (is (contains? sms/category-to-spec "role"))
    (is (contains? sms/category-to-spec "relation"))
    (is (contains? sms/category-to-spec "occurrence"))
    (is (contains? sms/category-to-spec "state"))))

(deftest test-relation-uid-to-semantic-mapping
  (testing "Relation UID to semantic mapping is properly defined"
    (is (= :specialization-of (get sms/relation-uid-to-semantic 1146)))
    (is (= :classification (get sms/relation-uid-to-semantic 1225)))
    (is (= :synonym (get sms/relation-uid-to-semantic 1981)))
    (is (= :inverse (get sms/relation-uid-to-semantic 1986)))
    (is (= :involves (get sms/relation-uid-to-semantic 5644)))))

(deftest test-retrieve-semantic-model-physical-object-kind
  (testing "Retrieve semantic model for physical object kind"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (go "kind"))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "physical object"))
                  po-ms/retrieve-kind-of-physical-object-model
                  (fn [uid] (go fixtures/expected-physical-object-model))]
      
      (let [result-chan (sms/retrieve-semantic-model "456")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (not (nil? result)))
        (is (= (:uid result) "456"))
        (is (= (:type result) :physical-object))
        (is (= (:name result) "Test Physical Object"))))))

(deftest test-retrieve-semantic-model-aspect-kind
  (testing "Retrieve semantic model for aspect kind"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (go "kind"))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "aspect"))
                  asp-ms/retrieve-kind-of-aspect-model
                  (fn [uid] (go fixtures/expected-aspect-model))]
      
      (let [result-chan (sms/retrieve-semantic-model "789")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (not (nil? result)))
        (is (= (:uid result) "789"))
        (is (= (:type result) :aspect))
        (is (= (:name result) "Test Aspect"))))))

(deftest test-retrieve-semantic-model-role-kind
  (testing "Retrieve semantic model for role kind"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (go "kind"))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "role"))
                  rol-ms/retrieve-kind-of-role-model
                  (fn [uid] (go fixtures/expected-role-model))]
      
      (let [result-chan (sms/retrieve-semantic-model "101112")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (not (nil? result)))
        (is (= (:uid result) "101112"))
        (is (= (:type result) :role))
        (is (= (:name result) "Test Role"))))))

(deftest test-retrieve-semantic-model-relation-kind
  (testing "Retrieve semantic model for relation kind"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (go "kind"))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "relation"))
                  rel-ms/retrieve-kind-of-relation-model
                  (fn [uid] (go fixtures/expected-relation-model))]
      
      (let [result-chan (sms/retrieve-semantic-model "rel1")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (not (nil? result)))
        (is (= (:uid result) "rel1"))
        (is (= (:type result) :relation))
        (is (= (:name result) "Test Relation"))))))

(deftest test-retrieve-semantic-model-occurrence-kind
  (testing "Retrieve semantic model for occurrence kind"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (go "kind"))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "occurrence"))
                  occ-ms/retrieve-kind-of-occurrence-model
                  (fn [uid] (go fixtures/expected-occurrence-model))]
      
      (let [result-chan (sms/retrieve-semantic-model "occ1")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (not (nil? result)))
        (is (= (:uid result) "occ1"))
        (is (= (:type result) :occurrence))
        (is (= (:name result) "Test Occurrence"))))))

(deftest test-retrieve-semantic-model-individual-physical-object
  (testing "Retrieve semantic model for individual physical object"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (go "individual"))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "physical object"))
                  po-ms/retrieve-individual-physical-object-model
                  (fn [uid] (go fixtures/expected-physical-object-model))]
      
      (let [result-chan (sms/retrieve-semantic-model "456")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (not (nil? result)))
        (is (= (:uid result) "456"))
        (is (= (:type result) :physical-object))))))

(deftest test-retrieve-semantic-model-individual-aspect
  (testing "Retrieve semantic model for individual aspect"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (go "individual"))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "aspect"))
                  asp-ms/retrieve-individual-aspect-model
                  (fn [uid] (go fixtures/expected-aspect-model))]
      
      (let [result-chan (sms/retrieve-semantic-model "789")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (not (nil? result)))
        (is (= (:uid result) "789"))
        (is (= (:type result) :aspect))))))

(deftest test-retrieve-semantic-model-individual-relation
  (testing "Retrieve semantic model for individual relation"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (go "individual"))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "relation"))
                  rel-ms/retrieve-individual-relation-model
                  (fn [uid] (go fixtures/expected-relation-model))]
      
      (let [result-chan (sms/retrieve-semantic-model "rel1")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (not (nil? result)))
        (is (= (:uid result) "rel1"))
        (is (= (:type result) :relation))))))

(deftest test-retrieve-semantic-model-individual-occurrence
  (testing "Retrieve semantic model for individual occurrence"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (go "individual"))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "occurrence"))
                  occ-ms/retrieve-individual-occurrence-model
                  (fn [uid] (go fixtures/expected-occurrence-model))]
      
      (let [result-chan (sms/retrieve-semantic-model "occ1")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (not (nil? result)))
        (is (= (:uid result) "occ1"))
        (is (= (:type result) :occurrence))))))

(deftest test-retrieve-semantic-model-entity-anything
  (testing "Retrieve semantic model for entity with 'anything' category"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (go "kind"))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "anything"))
                  e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (go {:uid "entity1" :type :entity :name "Test Entity"}))]
      
      (let [result-chan (sms/retrieve-semantic-model "entity1")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (not (nil? result)))
        (is (= (:uid result) "entity1"))
        (is (= (:type result) :entity))))))

(deftest test-retrieve-semantic-model-unknown-type
  (testing "Retrieve semantic model for unknown entity type returns empty map"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (go "unknown"))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "unknown"))]
      
      (let [result-chan (sms/retrieve-semantic-model "unknown")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (= result {}))))))

(deftest test-retrieve-semantic-model-unknown-category
  (testing "Retrieve semantic model for unknown category returns empty map"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (go "kind"))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "unknown-category"))]
      
      (let [result-chan (sms/retrieve-semantic-model "unknown")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (= result {}))))))

(deftest test-retrieve-semantic-model-error-handling
  (testing "Retrieve semantic model handles errors gracefully"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (throw (Exception. "Test error")))
                  archivist-api/get-entity-category 
                  (fn [uid] (go "physical object"))]
      
      (let [result-chan (sms/retrieve-semantic-model "error-uid")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (= (:valid result) false))
        (is (contains? result :error))
        (is (= (:uid result) "error-uid"))))))

(deftest test-retrieve-semantic-model-archivist-timeout
  (testing "Retrieve semantic model handles Archivist timeouts"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (async/go (async/<! (async/timeout 100)) "kind"))
                  archivist-api/get-entity-category 
                  (fn [uid] (async/go (async/<! (async/timeout 100)) "physical object"))
                  po-ms/retrieve-kind-of-physical-object-model
                  (fn [uid] (async/go (async/<! (async/timeout 100)) fixtures/expected-physical-object-model))]
      
      (let [result-chan (sms/retrieve-semantic-model "timeout-test")
            timeout-chan (async/timeout 50)
            [result port] (async/<!! (async/go (async/alts! [result-chan timeout-chan])))]
        
        ;; Should timeout since our mock delays exceed the timeout
        (is (= port timeout-chan))))))

(deftest test-service-lifecycle
  (testing "Service start and stop functions work correctly"
    (let [start-result (sms/start)]
      (is (map? start-result))
      
      (let [stop-result (sms/stop)]
        (is (nil? stop-result))))))

(deftest test-retrieve-semantic-model-performance
  (testing "Retrieve semantic model performance with large datasets"
    (let [start-time (System/currentTimeMillis)]
      (with-redefs [archivist-api/get-entity-type 
                    (fn [uid] (go "kind"))
                    archivist-api/get-entity-category 
                    (fn [uid] (go "physical object"))
                    po-ms/retrieve-kind-of-physical-object-model
                    (fn [uid] (go fixtures/expected-physical-object-model))]
        
        ;; Test multiple concurrent retrievals
        (let [results (async/<!! 
                        (async/go
                          (async/<! 
                            (async/merge 
                              (for [i (range 10)]
                                (sms/retrieve-semantic-model (str "perf-test-" i)))))))]
          
          (let [end-time (System/currentTimeMillis)
                duration (- end-time start-time)]
            
            ;; Should complete within reasonable time (1 second)
            (is (< duration 1000))
            (is (not (nil? results)))))))))

;; Integration tests (require actual Archivist connection)
(deftest ^:integration test-retrieve-semantic-model-integration
  (testing "Integration test with real Archivist data"
    ;; This test requires actual Archivist connection
    ;; Skip if not in integration test environment
    (when (System/getProperty "clarity.integration.tests")
      (let [result-chan (sms/retrieve-semantic-model "1225") ;; Real UID
            result (async/<!! (async/go 
                                (async/<! 
                                  (async/timeout 5000) ;; 5 second timeout
                                  result-chan)))]
        
        (is (not (nil? result)))
        (is (contains? result :uid))
        (is (contains? result :type))))))

;; Error condition tests
(deftest test-retrieve-semantic-model-nil-uid
  (testing "Retrieve semantic model handles nil UID"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (when uid (go "kind")))
                  archivist-api/get-entity-category 
                  (fn [uid] (when uid (go "physical object")))]
      
      (let [result-chan (sms/retrieve-semantic-model nil)
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (or (nil? result) (= result {})))))))

(deftest test-retrieve-semantic-model-empty-uid
  (testing "Retrieve semantic model handles empty UID"
    (with-redefs [archivist-api/get-entity-type 
                  (fn [uid] (when (and uid (not= uid "")) (go "kind")))
                  archivist-api/get-entity-category 
                  (fn [uid] (when (and uid (not= uid "")) (go "physical object")))]
      
      (let [result-chan (sms/retrieve-semantic-model "")
            result (async/<!! (async/go (async/<! result-chan)))]
        
        (is (or (nil? result) (= result {})))))))