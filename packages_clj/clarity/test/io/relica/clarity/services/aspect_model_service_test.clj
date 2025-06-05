(ns io.relica.clarity.services.aspect-model-service-test
  "Tests for aspect model service"
  (:require [clojure.test :refer :all]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]
            [io.relica.clarity.services.aspect-model-service :as asp-ms]
            [io.relica.clarity.services.entity-model-service :as e-ms]
            [io.relica.clarity.test-fixtures :as fixtures]
            [io.relica.clarity.test-helpers :as helpers]))

(deftest test-retrieve-kind-of-aspect-model-success
  (testing "Successfully retrieve kind of aspect model"
    (let [mock-base-model {:uid "aspect1" :name "Test Aspect" :type "kind"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (asp-ms/retrieve-kind-of-aspect-model "aspect1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "aspect1"))
          (is (= (:name result) "Test Aspect"))
          (is (= (:type result) "kind"))
          (is (= (:category result) "aspect")))))))

(deftest test-retrieve-kind-of-aspect-model-error
  (testing "Handle errors in kind of aspect model retrieval"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (throw (Exception. "Test error")))]

      (let [result-chan (asp-ms/retrieve-kind-of-aspect-model "error-aspect")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle the error gracefully (returns nil in this implementation)
        (is (nil? result))))))

(deftest test-retrieve-individual-aspect-model-success
  (testing "Successfully retrieve individual aspect model"
    (let [mock-base-model {:uid "aspect-individual" :name "Aspect Instance" :type "individual"}]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (asp-ms/retrieve-individual-aspect-model "aspect-individual")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "aspect-individual"))
          (is (= (:name result) "Aspect Instance"))
          (is (= (:type result) "individual"))
          (is (= (:category result) "aspect")))))))

(deftest test-retrieve-individual-aspect-model-error
  (testing "Handle errors in individual aspect model retrieval"
    (with-redefs [e-ms/retrieve-individual-entity-model
                  (fn [uid] (throw (Exception. "Test error")))]

      (let [result-chan (asp-ms/retrieve-individual-aspect-model "error-individual")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle the error gracefully (returns nil in this implementation)
        (is (nil? result))))))

(deftest test-aspect-model-merge-behavior
  (testing "Aspect model properly merges with base entity model"
    (let [mock-base-model {:uid "aspect1" :name "Test Aspect" :type "kind" :description "Base description"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (asp-ms/retrieve-kind-of-aspect-model "aspect1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Should preserve base model properties
          (is (= (:uid result) "aspect1"))
          (is (= (:name result) "Test Aspect"))
          (is (= (:type result) "kind"))
          (is (= (:description result) "Base description"))
          
          ;; Should add aspect specific properties
          (is (= (:category result) "aspect")))))))

(deftest test-aspect-model-data-validation
  (testing "Aspect model validates data structure"
    (let [mock-base-model {:uid "aspect1" :name "Test Aspect" :type "kind"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (asp-ms/retrieve-kind-of-aspect-model "aspect1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Validate required fields are present
          (is (contains? result :uid))
          (is (contains? result :name))
          (is (contains? result :type))
          (is (contains? result :category))
          
          ;; Validate data types
          (is (string? (:uid result)))
          (is (string? (:name result)))
          (is (string? (:type result)))
          (is (string? (:category result)))
          (is (= (:category result) "aspect")))))))

(deftest test-aspect-model-performance-multiple-requests
  (testing "Aspect model service handles multiple concurrent requests"
    (let [mock-base-model {:uid "aspect-perf" :name "Performance Test" :type "kind"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go (assoc mock-base-model :uid uid)))]

        (let [start-time (System/currentTimeMillis)
              results (async/<!! 
                        (async/go
                          (let [channels (for [i (range 5)]
                                          (asp-ms/retrieve-kind-of-aspect-model (str "aspect-" i)))]
                            (async/<! (async/merge channels)))))]

          (let [end-time (System/currentTimeMillis)
                duration (- end-time start-time)]
            
            ;; Should complete within reasonable time
            (is (< duration 1000))
            (is (not (nil? results))))))))

(deftest test-aspect-model-timeout-handling
  (testing "Aspect model handles timeouts gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (async/go (async/<! (async/timeout 50)) {:uid uid :name "Test"}))]

      (let [result-chan (asp-ms/retrieve-kind-of-aspect-model "timeout-test")
            timeout-chan (async/timeout 30)
            [result port] (async/<!! (async/go (async/alts! [result-chan timeout-chan])))]

        ;; Should timeout since our mock delays exceed the timeout
        (is (= port timeout-chan))))))

;; Integration tests (require actual dependencies)
(deftest ^:integration test-aspect-model-integration
  (testing "Integration test with real dependencies"
    ;; Skip if not in integration test environment
    (when (System/getProperty "clarity.integration.tests")
      (let [result-chan (asp-ms/retrieve-kind-of-aspect-model "1727") ; Some real aspect UID
            result (async/<!! (async/go 
                                (async/<! 
                                  (async/timeout 5000) ; 5 second timeout
                                  result-chan)))]
        
        (is (not (nil? result)))
        (is (contains? result :uid))
        (is (contains? result :category))
        (is (= (:category result) "aspect"))))))

(deftest test-aspect-model-nil-uid-handling
  (testing "Aspect model handles nil UID gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (when uid (go {:uid uid :name "Test"})))]

      (let [result-chan (asp-ms/retrieve-kind-of-aspect-model nil)
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle nil UID appropriately
        (is (nil? result))))))

(deftest test-aspect-model-empty-uid-handling
  (testing "Aspect model handles empty UID gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (when (and uid (not= uid "")) (go {:uid uid :name "Test"})))]

      (let [result-chan (asp-ms/retrieve-kind-of-aspect-model "")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle empty UID appropriately
        (is (nil? result))))))

(deftest test-individual-aspect-model-data-validation
  (testing "Individual aspect model validates data structure"
    (let [mock-base-model {:uid "aspect-ind" :name "Test Individual Aspect" :type "individual"}]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (asp-ms/retrieve-individual-aspect-model "aspect-ind")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Validate required fields are present
          (is (contains? result :uid))
          (is (contains? result :name))
          (is (contains? result :type))
          (is (contains? result :category))
          
          ;; Validate specific values
          (is (= (:uid result) "aspect-ind"))
          (is (= (:name result) "Test Individual Aspect"))
          (is (= (:type result) "individual"))
          (is (= (:category result) "aspect"))
          
          ;; Validate data types
          (is (string? (:uid result)))
          (is (string? (:name result)))
          (is (string? (:type result)))
          (is (string? (:category result))))))))

(deftest test-individual-aspect-model-performance
  (testing "Individual aspect model service handles multiple concurrent requests"
    (let [mock-base-model {:uid "aspect-ind-perf" :name "Performance Test Individual" :type "individual"}]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go (assoc mock-base-model :uid uid)))]

        (let [start-time (System/currentTimeMillis)
              results (async/<!! 
                        (async/go
                          (let [channels (for [i (range 3)]
                                          (asp-ms/retrieve-individual-aspect-model (str "aspect-ind-" i)))]
                            (async/<! (async/merge channels)))))]

          (let [end-time (System/currentTimeMillis)
                duration (- end-time start-time)]
            
            ;; Should complete within reasonable time
            (is (< duration 1000))
            (is (not (nil? results))))))))

(deftest test-aspect-service-consistency
  (testing "Both kind and individual aspect services produce consistent structure"
    (let [mock-kind-model {:uid "aspect-kind" :name "Test Kind Aspect" :type "kind"}
          mock-individual-model {:uid "aspect-ind" :name "Test Individual Aspect" :type "individual"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-kind-model))
                    e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-individual-model))]

        (let [kind-result-chan (asp-ms/retrieve-kind-of-aspect-model "aspect-kind")
              individual-result-chan (asp-ms/retrieve-individual-aspect-model "aspect-ind")
              kind-result (async/<!! (async/go (async/<! kind-result-chan)))
              individual-result (async/<!! (async/go (async/<! individual-result-chan)))]

          ;; Both should have consistent structure
          (is (= (:category kind-result) (:category individual-result) "aspect"))
          (is (contains? kind-result :uid))
          (is (contains? individual-result :uid))
          (is (contains? kind-result :name))
          (is (contains? individual-result :name))
          (is (contains? kind-result :type))
          (is (contains? individual-result :type))
          
          ;; But different types
          (is (= (:type kind-result) "kind"))
          (is (= (:type individual-result) "individual"))))))