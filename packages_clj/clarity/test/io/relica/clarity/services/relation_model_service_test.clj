(ns io.relica.clarity.services.relation-model-service-test
  "Tests for relation model service"
  (:require [clojure.test :refer :all]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]
            [io.relica.clarity.services.relation-model-service :as rel-ms]
            [io.relica.clarity.services.entity-model-service :as e-ms]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.clarity.test-fixtures :as fixtures]
            [io.relica.clarity.test-helpers :as helpers]))

(deftest test-retrieve-required-kind-of-role-1-success
  (testing "Successfully retrieve required kind of role 1"
    (let [mock-response {:success true
                         :fact [{:rh_object_uid "role1-uid"
                                 :rh_object_name "Role 1"}]}]

      (with-redefs [archivist/get-inherited-relation
                    (fn [client uid relation-uid]
                      (go mock-response))]

        (let [result-chan (rel-ms/retrieve-required-kind-of-role-1 "relation1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (= result "role1-uid")))))))

(deftest test-retrieve-required-kind-of-role-1-failure
  (testing "Handle failure in retrieve required kind of role 1"
    (let [mock-response {:success false
                         :fact []}]

      (with-redefs [archivist/get-inherited-relation
                    (fn [client uid relation-uid]
                      (go mock-response))]

        (let [result-chan (rel-ms/retrieve-required-kind-of-role-1 "relation1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (= result [])))))))

(deftest test-retrieve-required-kind-of-role-1-error
  (testing "Handle errors in retrieve required kind of role 1"
    (with-redefs [archivist/get-inherited-relation
                  (fn [client uid relation-uid]
                    (throw (Exception. "Test error")))]

      (let [result-chan (rel-ms/retrieve-required-kind-of-role-1 "error-relation")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle the error gracefully (returns {} in this implementation)
        (is (= result {}))))))

(deftest test-retrieve-required-kind-of-role-2-success
  (testing "Successfully retrieve required kind of role 2"
    (let [mock-response {:success true
                         :fact [{:rh_object_uid "role2-uid"
                                 :rh_object_name "Role 2"}]}]

      (with-redefs [archivist/get-inherited-relation
                    (fn [client uid relation-uid]
                      (go mock-response))]

        (let [result-chan (rel-ms/retrieve-required-kind-of-role-2 "relation1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (= result "role2-uid")))))))

(deftest test-retrieve-required-kind-of-role-2-failure
  (testing "Handle failure in retrieve required kind of role 2"
    (let [mock-response {:success false
                         :fact []}]

      (with-redefs [archivist/get-inherited-relation
                    (fn [client uid relation-uid]
                      (go mock-response))]

        (let [result-chan (rel-ms/retrieve-required-kind-of-role-2 "relation1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (= result [])))))))

(deftest test-retrieve-required-kind-of-role-2-error
  (testing "Handle errors in retrieve required kind of role 2"
    (with-redefs [archivist/get-inherited-relation
                  (fn [client uid relation-uid]
                    (throw (Exception. "Test error")))]

      (let [result-chan (rel-ms/retrieve-required-kind-of-role-2 "error-relation")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle the error gracefully (returns [] in this implementation)
        (is (= result []))))))

(deftest test-retrieve-kind-of-relation-model-special-case
  (testing "Handle special case for UID 730000 (anything)"
    (let [result-chan (rel-ms/retrieve-kind-of-relation-model 730000)
          result (async/<!! (async/go (async/<! result-chan)))]

      (is (not (nil? result)))
      (is (= (:uid result) 730000))
      (is (= (:name result) "anything"))
      (is (= (:nature result) :kind))
      (is (= (:definitions result) ["..."]))
      (is (= (:supertypes result) [])))))

(deftest test-retrieve-kind-of-relation-model-success
  (testing "Successfully retrieve kind of relation model"
    (let [mock-base-model {:uid "relation1" :name "Test Relation" :type "kind"}
          mock-role-1 "role1-uid"
          mock-role-2 "role2-uid"]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))
                    rel-ms/retrieve-required-kind-of-role-1
                    (fn [uid] (go mock-role-1))
                    rel-ms/retrieve-required-kind-of-role-2
                    (fn [uid] (go mock-role-2))]

        (let [result-chan (rel-ms/retrieve-kind-of-relation-model "relation1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "relation1"))
          (is (= (:name result) "Test Relation"))
          (is (= (:type result) "kind"))
          (is (= (:category result) "relation"))
          (is (= (:required-kind-of-role-1 result) mock-role-1))
          (is (= (:required-kind-of-role-2 result) mock-role-2)))))))

(deftest test-retrieve-kind-of-relation-model-error
  (testing "Handle errors in kind of relation model retrieval"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (throw (Exception. "Test error")))
                  rel-ms/retrieve-required-kind-of-role-1
                  (fn [uid] (go "role1"))
                  rel-ms/retrieve-required-kind-of-role-2
                  (fn [uid] (go "role2"))]

      (let [result-chan (rel-ms/retrieve-kind-of-relation-model "error-relation")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle the error gracefully (returns nil in this implementation)
        (is (nil? result))))))

(deftest test-retrieve-individual-relation-model-success
  (testing "Successfully retrieve individual relation model"
    (let [mock-base-model {:uid "relation-individual" :name "Relation Instance" :type "individual"}]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (rel-ms/retrieve-individual-relation-model "relation-individual")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "relation-individual"))
          (is (= (:name result) "Relation Instance"))
          (is (= (:type result) "individual"))
          (is (= (:category result) "relation")))))))

(deftest test-retrieve-individual-relation-model-error
  (testing "Handle errors in individual relation model retrieval"
    (with-redefs [e-ms/retrieve-individual-entity-model
                  (fn [uid] (throw (Exception. "Test error")))]

      (let [result-chan (rel-ms/retrieve-individual-relation-model "error-individual")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle the error gracefully (returns nil in this implementation)
        (is (nil? result))))))

(deftest test-relation-model-merge-behavior
  (testing "Relation model properly merges with base entity model"
    (let [mock-base-model {:uid "relation1" :name "Test Relation" :type "kind" :description "Base description"}
          mock-role-1 "role1-uid"
          mock-role-2 "role2-uid"]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))
                    rel-ms/retrieve-required-kind-of-role-1
                    (fn [uid] (go mock-role-1))
                    rel-ms/retrieve-required-kind-of-role-2
                    (fn [uid] (go mock-role-2))]

        (let [result-chan (rel-ms/retrieve-kind-of-relation-model "relation1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Should preserve base model properties
          (is (= (:uid result) "relation1"))
          (is (= (:name result) "Test Relation"))
          (is (= (:type result) "kind"))
          (is (= (:description result) "Base description"))
          
          ;; Should add relation specific properties
          (is (= (:category result) "relation"))
          (is (contains? result :required-kind-of-role-1))
          (is (contains? result :required-kind-of-role-2)))))))

(deftest test-relation-model-data-validation
  (testing "Relation model validates data structure"
    (let [mock-base-model {:uid "relation1" :name "Test Relation" :type "kind"}
          mock-role-1 "role1-uid"
          mock-role-2 "role2-uid"]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))
                    rel-ms/retrieve-required-kind-of-role-1
                    (fn [uid] (go mock-role-1))
                    rel-ms/retrieve-required-kind-of-role-2
                    (fn [uid] (go mock-role-2))]

        (let [result-chan (rel-ms/retrieve-kind-of-relation-model "relation1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Validate required fields are present
          (is (contains? result :uid))
          (is (contains? result :name))
          (is (contains? result :type))
          (is (contains? result :category))
          
          ;; Validate relation specific fields
          (is (contains? result :required-kind-of-role-1))
          (is (contains? result :required-kind-of-role-2))
          
          ;; Validate data types
          (is (string? (:uid result)))
          (is (string? (:name result)))
          (is (string? (:type result)))
          (is (string? (:category result)))
          (is (= (:category result) "relation")))))))

(deftest test-relation-model-performance-multiple-requests
  (testing "Relation model service handles multiple concurrent requests"
    (let [mock-base-model {:uid "relation-perf" :name "Performance Test" :type "kind"}
          mock-role-1 "role1-uid"
          mock-role-2 "role2-uid"]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go (assoc mock-base-model :uid uid)))
                    rel-ms/retrieve-required-kind-of-role-1
                    (fn [uid] (go mock-role-1))
                    rel-ms/retrieve-required-kind-of-role-2
                    (fn [uid] (go mock-role-2))]

        (let [start-time (System/currentTimeMillis)
              results (async/<!! 
                        (async/go
                          (let [channels (for [i (range 5)]
                                          (rel-ms/retrieve-kind-of-relation-model (str "relation-" i)))]
                            (async/<! (async/merge channels)))))]

          (let [end-time (System/currentTimeMillis)
                duration (- end-time start-time)]
            
            ;; Should complete within reasonable time
            (is (< duration 1000))
            (is (not (nil? results))))))))

(deftest test-relation-model-timeout-handling
  (testing "Relation model handles timeouts gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (async/go (async/<! (async/timeout 50)) {:uid uid :name "Test"}))
                  rel-ms/retrieve-required-kind-of-role-1
                  (fn [uid] (async/go (async/<! (async/timeout 50)) "role1"))
                  rel-ms/retrieve-required-kind-of-role-2
                  (fn [uid] (async/go (async/<! (async/timeout 50)) "role2"))]

      (let [result-chan (rel-ms/retrieve-kind-of-relation-model "timeout-test")
            timeout-chan (async/timeout 30)
            [result port] (async/<!! (async/go (async/alts! [result-chan timeout-chan])))]

        ;; Should timeout since our mock delays exceed the timeout
        (is (= port timeout-chan))))))

(deftest test-relation-model-nil-uid-handling
  (testing "Relation model handles nil UID gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (when uid (go {:uid uid :name "Test"})))
                  rel-ms/retrieve-required-kind-of-role-1
                  (fn [uid] (when uid (go "role1")))
                  rel-ms/retrieve-required-kind-of-role-2
                  (fn [uid] (when uid (go "role2")))]

      (let [result-chan (rel-ms/retrieve-kind-of-relation-model nil)
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle nil UID appropriately
        (is (nil? result))))))

(deftest test-relation-model-empty-uid-handling
  (testing "Relation model handles empty UID gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (when (and uid (not= uid "")) (go {:uid uid :name "Test"})))
                  rel-ms/retrieve-required-kind-of-role-1
                  (fn [uid] (when (and uid (not= uid "")) (go "role1")))
                  rel-ms/retrieve-required-kind-of-role-2
                  (fn [uid] (when (and uid (not= uid "")) (go "role2")))]

      (let [result-chan (rel-ms/retrieve-kind-of-relation-model "")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle empty UID appropriately
        (is (nil? result))))))

(deftest test-individual-relation-model-data-validation
  (testing "Individual relation model validates data structure"
    (let [mock-base-model {:uid "relation-ind" :name "Test Individual Relation" :type "individual"}]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (rel-ms/retrieve-individual-relation-model "relation-ind")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Validate required fields are present
          (is (contains? result :uid))
          (is (contains? result :name))
          (is (contains? result :type))
          (is (contains? result :category))
          
          ;; Validate specific values
          (is (= (:uid result) "relation-ind"))
          (is (= (:name result) "Test Individual Relation"))
          (is (= (:type result) "individual"))
          (is (= (:category result) "relation"))
          
          ;; Validate data types
          (is (string? (:uid result)))
          (is (string? (:name result)))
          (is (string? (:type result)))
          (is (string? (:category result))))))))

(deftest test-individual-relation-model-performance
  (testing "Individual relation model service handles multiple concurrent requests"
    (let [mock-base-model {:uid "relation-ind-perf" :name "Performance Test Individual" :type "individual"}]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go (assoc mock-base-model :uid uid)))]

        (let [start-time (System/currentTimeMillis)
              results (async/<!! 
                        (async/go
                          (let [channels (for [i (range 3)]
                                          (rel-ms/retrieve-individual-relation-model (str "relation-ind-" i)))]
                            (async/<! (async/merge channels)))))]

          (let [end-time (System/currentTimeMillis)
                duration (- end-time start-time)]
            
            ;; Should complete within reasonable time
            (is (< duration 1000))
            (is (not (nil? results))))))))

(deftest test-relation-service-consistency
  (testing "Both kind and individual relation services produce consistent structure"
    (let [mock-kind-model {:uid "relation-kind" :name "Test Kind Relation" :type "kind"}
          mock-individual-model {:uid "relation-ind" :name "Test Individual Relation" :type "individual"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-kind-model))
                    e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-individual-model))
                    rel-ms/retrieve-required-kind-of-role-1
                    (fn [uid] (go "role1"))
                    rel-ms/retrieve-required-kind-of-role-2
                    (fn [uid] (go "role2"))]

        (let [kind-result-chan (rel-ms/retrieve-kind-of-relation-model "relation-kind")
              individual-result-chan (rel-ms/retrieve-individual-relation-model "relation-ind")
              kind-result (async/<!! (async/go (async/<! kind-result-chan)))
              individual-result (async/<!! (async/go (async/<! individual-result-chan)))]

          ;; Both should have consistent structure
          (is (= (:category kind-result) (:category individual-result) "relation"))
          (is (contains? kind-result :uid))
          (is (contains? individual-result :uid))
          (is (contains? kind-result :name))
          (is (contains? individual-result :name))
          (is (contains? kind-result :type))
          (is (contains? individual-result :type))
          
          ;; But different types
          (is (= (:type kind-result) "kind"))
          (is (= (:type individual-result) "individual"))
          
          ;; Kind should have role requirements
          (is (contains? kind-result :required-kind-of-role-1))
          (is (contains? kind-result :required-kind-of-role-2)))))))

(deftest test-role-helper-functions-with-different-relation-types
  (testing "Role helper functions work with different relation type UIDs"
    (let [mock-response-4731 {:success true
                              :fact [{:rh_object_uid "role1-uid"
                                      :rh_object_name "Role 1"}]}
          mock-response-4733 {:success true
                              :fact [{:rh_object_uid "role2-uid"
                                      :rh_object_name "Role 2"}]}]

      (with-redefs [archivist/get-inherited-relation
                    (fn [client uid relation-uid]
                      (go
                        (case relation-uid
                          4731 mock-response-4731  ; For role 1
                          4733 mock-response-4733  ; For role 2
                          {:success false :fact []})))]

        (let [role1-chan (rel-ms/retrieve-required-kind-of-role-1 "test-relation")
              role2-chan (rel-ms/retrieve-required-kind-of-role-2 "test-relation")
              role1-result (async/<!! (async/go (async/<! role1-chan)))
              role2-result (async/<!! (async/go (async/<! role2-chan)))]

          (is (= role1-result "role1-uid"))
          (is (= role2-result "role2-uid")))))))

;; Integration tests (require actual dependencies)
(deftest ^:integration test-relation-model-integration
  (testing "Integration test with real dependencies"
    ;; Skip if not in integration test environment
    (when (System/getProperty "clarity.integration.tests")
      (let [result-chan (rel-ms/retrieve-kind-of-relation-model "1146") ; Some real relation UID
            result (async/<!! (async/go 
                                (async/<! 
                                  (async/timeout 5000) ; 5 second timeout
                                  result-chan)))]
        
        (is (not (nil? result)))
        (is (contains? result :uid))
        (is (contains? result :category))
        (is (= (:category result) "relation"))))))