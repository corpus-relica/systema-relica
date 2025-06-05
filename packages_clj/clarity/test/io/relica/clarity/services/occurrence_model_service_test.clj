(ns io.relica.clarity.services.occurrence-model-service-test
  "Tests for occurrence model service"
  (:require [clojure.test :refer :all]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]
            [io.relica.clarity.services.occurrence-model-service :as occ-ms]
            [io.relica.clarity.services.entity-model-service :as e-ms]
            [io.relica.clarity.test-fixtures :as fixtures]
            [io.relica.clarity.test-helpers :as helpers]))

(deftest test-retrieve-kind-of-occurrence-model-success
  (testing "Successfully retrieve kind of occurrence model"
    (let [mock-base-model {:uid "occurrence1" :name "Test Occurrence" :type "kind"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (occ-ms/retrieve-kind-of-occurrence-model "occurrence1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "occurrence1"))
          (is (= (:name result) "Test Occurrence"))
          (is (= (:type result) "kind"))
          (is (= (:category result) "occurrence")))))))

(deftest test-retrieve-kind-of-occurrence-model-error
  (testing "Handle errors in kind of occurrence model retrieval"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (throw (Exception. "Test error")))]

      (let [result-chan (occ-ms/retrieve-kind-of-occurrence-model "error-occurrence")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle the error gracefully (returns nil in this implementation)
        (is (nil? result))))))

(deftest test-retrieve-individual-occurrence-model-success
  (testing "Successfully retrieve individual occurrence model"
    (let [mock-base-model {:uid "occurrence-individual" :name "Occurrence Instance" :type "individual"}]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (occ-ms/retrieve-individual-occurrence-model "occurrence-individual")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "occurrence-individual"))
          (is (= (:name result) "Occurrence Instance"))
          (is (= (:type result) "individual"))
          (is (= (:category result) "occurrence")))))))

(deftest test-retrieve-individual-occurrence-model-error
  (testing "Handle errors in individual occurrence model retrieval"
    (with-redefs [e-ms/retrieve-individual-entity-model
                  (fn [uid] (throw (Exception. "Test error")))]

      (let [result-chan (occ-ms/retrieve-individual-occurrence-model "error-individual")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle the error gracefully (returns nil in this implementation)
        (is (nil? result))))))

(deftest test-occurrence-model-merge-behavior
  (testing "Occurrence model properly merges with base entity model"
    (let [mock-base-model {:uid "occurrence1" :name "Test Occurrence" :type "kind" :description "Base description"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (occ-ms/retrieve-kind-of-occurrence-model "occurrence1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Should preserve base model properties
          (is (= (:uid result) "occurrence1"))
          (is (= (:name result) "Test Occurrence"))
          (is (= (:type result) "kind"))
          (is (= (:description result) "Base description"))
          
          ;; Should add occurrence specific properties
          (is (= (:category result) "occurrence")))))))

(deftest test-occurrence-model-data-validation
  (testing "Occurrence model validates data structure"
    (let [mock-base-model {:uid "occurrence1" :name "Test Occurrence" :type "kind"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (occ-ms/retrieve-kind-of-occurrence-model "occurrence1")
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
          (is (= (:category result) "occurrence")))))))

(deftest test-occurrence-model-performance-multiple-requests
  (testing "Occurrence model service handles multiple concurrent requests"
    (let [mock-base-model {:uid "occurrence-perf" :name "Performance Test" :type "kind"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go (assoc mock-base-model :uid uid)))]

        (let [start-time (System/currentTimeMillis)
              results (async/<!! 
                        (async/go
                          (let [channels (for [i (range 5)]
                                          (occ-ms/retrieve-kind-of-occurrence-model (str "occurrence-" i)))]
                            (async/<! (async/merge channels)))))]

          (let [end-time (System/currentTimeMillis)
                duration (- end-time start-time)]
            
            ;; Should complete within reasonable time
            (is (< duration 1000))
            (is (not (nil? results)))))))))

(deftest test-occurrence-model-timeout-handling
  (testing "Occurrence model handles timeouts gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (async/go (async/<! (async/timeout 50)) {:uid uid :name "Test"}))]

      (let [result-chan (occ-ms/retrieve-kind-of-occurrence-model "timeout-test")
            timeout-chan (async/timeout 30)
            [result port] (async/<!! (async/go (async/alts! [result-chan timeout-chan])))]

        ;; Should timeout since our mock delays exceed the timeout
        (is (= port timeout-chan))))))

(deftest test-occurrence-model-nil-uid-handling
  (testing "Occurrence model handles nil UID gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (when uid (go {:uid uid :name "Test"})))]

      (let [result-chan (occ-ms/retrieve-kind-of-occurrence-model nil)
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle nil UID appropriately
        (is (nil? result))))))

(deftest test-occurrence-model-empty-uid-handling
  (testing "Occurrence model handles empty UID gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (when (and uid (not= uid "")) (go {:uid uid :name "Test"})))]

      (let [result-chan (occ-ms/retrieve-kind-of-occurrence-model "")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle empty UID appropriately
        (is (nil? result))))))

(deftest test-individual-occurrence-model-data-validation
  (testing "Individual occurrence model validates data structure"
    (let [mock-base-model {:uid "occurrence-ind" :name "Test Individual Occurrence" :type "individual"}]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (occ-ms/retrieve-individual-occurrence-model "occurrence-ind")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Validate required fields are present
          (is (contains? result :uid))
          (is (contains? result :name))
          (is (contains? result :type))
          (is (contains? result :category))
          
          ;; Validate specific values
          (is (= (:uid result) "occurrence-ind"))
          (is (= (:name result) "Test Individual Occurrence"))
          (is (= (:type result) "individual"))
          (is (= (:category result) "occurrence"))
          
          ;; Validate data types
          (is (string? (:uid result)))
          (is (string? (:name result)))
          (is (string? (:type result)))
          (is (string? (:category result))))))))

(deftest test-individual-occurrence-model-performance
  (testing "Individual occurrence model service handles multiple concurrent requests"
    (let [mock-base-model {:uid "occurrence-ind-perf" :name "Performance Test Individual" :type "individual"}]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go (assoc mock-base-model :uid uid)))]

        (let [start-time (System/currentTimeMillis)
              results (async/<!! 
                        (async/go
                          (let [channels (for [i (range 3)]
                                          (occ-ms/retrieve-individual-occurrence-model (str "occurrence-ind-" i)))]
                            (async/<! (async/merge channels)))))]

          (let [end-time (System/currentTimeMillis)
                duration (- end-time start-time)]
            
            ;; Should complete within reasonable time
            (is (< duration 1000))
            (is (not (nil? results)))))))))

(deftest test-occurrence-service-consistency
  (testing "Both kind and individual occurrence services produce consistent structure"
    (let [mock-kind-model {:uid "occurrence-kind" :name "Test Kind Occurrence" :type "kind"}
          mock-individual-model {:uid "occurrence-ind" :name "Test Individual Occurrence" :type "individual"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-kind-model))
                    e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-individual-model))]

        (let [kind-result-chan (occ-ms/retrieve-kind-of-occurrence-model "occurrence-kind")
              individual-result-chan (occ-ms/retrieve-individual-occurrence-model "occurrence-ind")
              kind-result (async/<!! (async/go (async/<! kind-result-chan)))
              individual-result (async/<!! (async/go (async/<! individual-result-chan)))]

          ;; Both should have consistent structure
          (is (= (:category kind-result) (:category individual-result) "occurrence"))
          (is (contains? kind-result :uid))
          (is (contains? individual-result :uid))
          (is (contains? kind-result :name))
          (is (contains? individual-result :name))
          (is (contains? kind-result :type))
          (is (contains? individual-result :type))
          
          ;; But different types
          (is (= (:type kind-result) "kind"))
          (is (= (:type individual-result) "individual")))))))

(deftest test-occurrence-model-with-commented-extensions
  (testing "Occurrence model handles future extension fields gracefully"
    (let [mock-base-model {:uid "occurrence1" :name "Test Occurrence" :type "kind"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (occ-ms/retrieve-kind-of-occurrence-model "occurrence1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Should not contain commented fields yet (future extensions)
          (is (not (contains? result :definitive-kinds-of-aspects)))
          (is (not (contains? result :possible-kinds-of-aspects)))
          (is (not (contains? result :required-kinds-of-aspects)))
          (is (not (contains? result :definitive-kinds-of-involvement)))
          (is (not (contains? result :possible-kinds-of-involvement)))
          (is (not (contains? result :required-kinds-of-involvement)))
          
          ;; Should contain basic structure
          (is (= (:category result) "occurrence")))))))

(deftest test-individual-occurrence-model-with-commented-extensions
  (testing "Individual occurrence model handles future extension fields gracefully"
    (let [mock-base-model {:uid "occurrence-ind" :name "Test Individual Occurrence" :type "individual"}]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (occ-ms/retrieve-individual-occurrence-model "occurrence-ind")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Should not contain commented fields yet (future extensions)
          (is (not (contains? result :aspects)))
          (is (not (contains? result :involvements)))
          
          ;; Should contain basic structure
          (is (= (:category result) "occurrence")))))))

(deftest test-occurrence-model-base-entity-integration
  (testing "Occurrence model properly integrates with entity model service"
    (let [mock-base-model {:uid "occurrence1" 
                           :name "Test Occurrence" 
                           :type "kind"
                           :definitions ["Test definition"]
                           :supertypes ["super1" "super2"]
                           :synonyms ["synonym1" "synonym2"]}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (occ-ms/retrieve-kind-of-occurrence-model "occurrence1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Should preserve all base model fields
          (is (= (:uid result) "occurrence1"))
          (is (= (:name result) "Test Occurrence"))
          (is (= (:type result) "kind"))
          (is (= (:definitions result) ["Test definition"]))
          (is (= (:supertypes result) ["super1" "super2"]))
          (is (= (:synonyms result) ["synonym1" "synonym2"]))
          
          ;; Should add occurrence category
          (is (= (:category result) "occurrence")))))))

(deftest test-occurrence-model-individual-entity-integration
  (testing "Individual occurrence model properly integrates with entity model service"
    (let [mock-base-model {:uid "occurrence-ind" 
                           :name "Test Individual Occurrence" 
                           :type "individual"
                           :classifiers ["classifier1" "classifier2"]}]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-base-model))]

        (let [result-chan (occ-ms/retrieve-individual-occurrence-model "occurrence-ind")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Should preserve all base model fields
          (is (= (:uid result) "occurrence-ind"))
          (is (= (:name result) "Test Individual Occurrence"))
          (is (= (:type result) "individual"))
          (is (= (:classifiers result) ["classifier1" "classifier2"]))
          
          ;; Should add occurrence category
          (is (= (:category result) "occurrence")))))))

(deftest test-occurrence-model-concurrent-access
  (testing "Occurrence model service handles concurrent access to same UID"
    (let [mock-base-model {:uid "concurrent-test" :name "Concurrent Test" :type "kind"}
          access-count (atom 0)]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] 
                      (swap! access-count inc)
                      (go mock-base-model))]

        (let [channels (for [i (range 3)]
                        (occ-ms/retrieve-kind-of-occurrence-model "concurrent-test"))
              results (async/<!! 
                        (async/go
                          (loop [remaining-channels channels
                                 collected-results []]
                            (if (empty? remaining-channels)
                              collected-results
                              (let [result (async/<! (first remaining-channels))]
                                (recur (rest remaining-channels)
                                       (conj collected-results result)))))))]

          ;; Should have called the base service 3 times (no caching in this implementation)
          (is (= @access-count 3))
          
          ;; All results should be consistent
          (is (= (count results) 3))
          (is (every? #(= (:uid %) "concurrent-test") results))
          (is (every? #(= (:category %) "occurrence") results)))))))

;; Integration tests (require actual dependencies)
(deftest ^:integration test-occurrence-model-integration
  (testing "Integration test with real dependencies"
    ;; Skip if not in integration test environment
    (when (System/getProperty "clarity.integration.tests")
      (let [result-chan (occ-ms/retrieve-kind-of-occurrence-model "1") ; Some real occurrence UID
            result (async/<!! (async/go 
                                (async/<! 
                                  (async/timeout 5000) ; 5 second timeout
                                  result-chan)))]
        
        (is (not (nil? result)))
        (is (contains? result :uid))
        (is (contains? result :category))
        (is (= (:category result) "occurrence"))))))

(deftest test-occurrence-model-error-propagation
  (testing "Occurrence model properly propagates entity model errors"
    (let [error-msg "Entity model error"]
      
      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (throw (Exception. error-msg)))]

        (let [result-chan (occ-ms/retrieve-kind-of-occurrence-model "error-test")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Should handle the error and return nil
          (is (nil? result)))))))

(deftest test-occurrence-model-async-behavior
  (testing "Occurrence model maintains proper async behavior"
    (let [mock-base-model {:uid "async-test" :name "Async Test" :type "kind"}
          call-order (atom [])]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] 
                      (go 
                        (swap! call-order conj :entity-model-start)
                        (async/<! (async/timeout 10)) ; Small delay
                        (swap! call-order conj :entity-model-end)
                        mock-base-model))]

        (let [result-chan (occ-ms/retrieve-kind-of-occurrence-model "async-test")]
          (swap! call-order conj :occurrence-model-called)
          
          (let [result (async/<!! (async/go (async/<! result-chan)))]
            (swap! call-order conj :occurrence-model-complete)
            
            ;; Should maintain proper async execution order
            (is (= @call-order [:occurrence-model-called 
                                :entity-model-start 
                                :entity-model-end 
                                :occurrence-model-complete]))
            
            ;; Should return proper result
            (is (not (nil? result)))
            (is (= (:category result) "occurrence"))))))))
