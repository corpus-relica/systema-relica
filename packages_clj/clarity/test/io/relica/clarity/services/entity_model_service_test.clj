(ns io.relica.clarity.services.entity-model-service-test
  "Tests for entity model service"
  (:require [clojure.test :refer :all]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]
            [io.relica.clarity.services.entity-model-service :as e-ms]
            [io.relica.clarity.io.archivist-api :as archivist-api]
            [io.relica.clarity.test-fixtures :as fixtures]
            [io.relica.clarity.test-helpers :as helpers]))

;; Helper function tests

(deftest test-retrieve-supertypes-and-definitions-success
  (testing "Successfully retrieve supertypes and definitions"
    (let [mock-facts [{:lh_object_name "Entity 1"
                       :rh_object_uid "super1"
                       :full_definition "Definition 1"}
                      {:lh_object_name "Entity 2"
                       :rh_object_uid "super2"
                       :full_definition "Definition 2"}]]

      (with-redefs [archivist-api/get-definitive-facts
                    (fn [uid] (go mock-facts))]

        (let [result-chan (e-ms/retrieve-supertypes-and-definitions "entity1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:names result) ["Entity 1" "Entity 2"]))
          (is (= (:supertypes result) ["super1" "super2"]))
          (is (= (:definitions result) ["Definition 1" "Definition 2"])))))))

(deftest test-retrieve-supertypes-and-definitions-error
  (testing "Handle errors in retrieve supertypes and definitions"
    (with-redefs [archivist-api/get-definitive-facts
                  (fn [uid] (throw (Exception. "Test error")))]

      (let [result-chan (e-ms/retrieve-supertypes-and-definitions "error-entity")
            result (async/<!! (async/go (async/<! result-chan)))]

        (is (not (:valid result)))
        (is (contains? result :error))
        (is (= (:uid result) "error-entity"))))))

(deftest test-retrieve-classifiers-success
  (testing "Successfully retrieve classifiers"
    (let [mock-classifiers [{:classifier "classifier1"}
                            {:classifier "classifier2"}]]

      (with-redefs [archivist-api/get-definitive-facts
                    (fn [uid] (go mock-classifiers))]

        (let [result-chan (e-ms/retrieve-classifiers "individual1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (= result mock-classifiers)))))))

(deftest test-retrieve-classifiers-error
  (testing "Handle errors in retrieve classifiers"
    (with-redefs [archivist-api/get-definitive-facts
                  (fn [uid] (throw (Exception. "Test error")))]

      (let [result-chan (e-ms/retrieve-classifiers "error-individual")
            result (async/<!! (async/go (async/<! result-chan)))]

        (is (not (:valid result)))
        (is (contains? result :error))
        (is (= (:uid result) "error-individual"))))))

(deftest test-retrieve-stuff-success
  (testing "Successfully retrieve stuff (related facts)"
    (let [mock-facts [{:rel_type_uid 1225 :data "classification1"}
                      {:rel_type_uid 1146 :data "specialization1"}
                      {:rel_type_uid 1726 :data "qualification1"}
                      {:rel_type_uid 1981 :lh_object_name "synonym1"}
                      {:rel_type_uid 1981 :lh_object_name "synonym2"}
                      {:rel_type_uid 1981 :lh_object_name "synonym1"}]] ; Duplicate to test deduplication

      (with-redefs [archivist-api/get-all-related-facts
                    (fn [uid] (go mock-facts))]

        (let [result-chan (e-ms/retrieve-stuff "entity1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (count (:classifications result)) 1))
          (is (= (count (:specializations result)) 1))
          (is (= (count (:qualifications result)) 1))
          (is (= (count (:synonyms result)) 2)) ; Should deduplicate
          (is (contains? (set (:synonyms result)) "synonym1"))
          (is (contains? (set (:synonyms result)) "synonym2")))))))

(deftest test-retrieve-stuff-empty
  (testing "Handle empty stuff retrieval"
    (with-redefs [archivist-api/get-all-related-facts
                  (fn [uid] (go []))]

      (let [result-chan (e-ms/retrieve-stuff "empty-entity")
            result (async/<!! (async/go (async/<! result-chan)))]

        (is (not (nil? result)))
        (is (empty? (:classifications result)))
        (is (empty? (:specializations result)))
        (is (empty? (:qualifications result)))
        (is (empty? (:synonyms result)))))))

(deftest test-retrieve-stuff-error
  (testing "Handle errors in retrieve stuff"
    (with-redefs [archivist-api/get-all-related-facts
                  (fn [uid] (throw (Exception. "Test error")))]

      (let [result-chan (e-ms/retrieve-stuff "error-entity")
            result (async/<!! (async/go (async/<! result-chan)))]

        (is (not (:valid result)))
        (is (contains? result :error))
        (is (= (:uid result) "error-entity"))))))

;; Main function tests

(deftest test-retrieve-kind-of-entity-model-success
  (testing "Successfully retrieve kind of entity model"
    (let [mock-supertypes-and-definitions {:names ["Entity 1"]
                                           :supertypes ["super1"]
                                           :definitions ["Definition 1"]}
          mock-stuff {:classifications []
                      :specializations []
                      :qualifications []
                      :synonyms ["synonym1"]}]

      (with-redefs [e-ms/retrieve-supertypes-and-definitions
                    (fn [uid] (go mock-supertypes-and-definitions))
                    e-ms/retrieve-stuff
                    (fn [uid] (go mock-stuff))]

        (let [result-chan (e-ms/retrieve-kind-of-entity-model "entity1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "entity1"))
          (is (= (:name result) "Entity 1"))
          (is (= (:nature result) :kind))
          (is (= (:definitions result) ["Definition 1"]))
          (is (= (:supertypes result) ["super1"]))
          (is (= (:synonyms result) ["synonym1"])))))))

(deftest test-retrieve-kind-of-entity-model-error
  (testing "Handle errors in kind of entity model retrieval"
    (with-redefs [e-ms/retrieve-supertypes-and-definitions
                  (fn [uid] (throw (Exception. "Test error")))
                  e-ms/retrieve-stuff
                  (fn [uid] (go {}))]

      (let [result-chan (e-ms/retrieve-kind-of-entity-model "error-entity")
            result (async/<!! (async/go (async/<! result-chan)))]

        (is (not (:valid result)))
        (is (contains? result :error))
        (is (= (:uid result) "error-entity"))))))

(deftest test-retrieve-individual-entity-model-success
  (testing "Successfully retrieve individual entity model"
    (let [mock-classifiers [{:lh_object_name "Individual 1"
                             :rh_object_uid "classifier1"}
                            {:lh_object_name "Individual 1"
                             :rh_object_uid "classifier2"}]]

      (with-redefs [e-ms/retrieve-classifiers
                    (fn [uid] (go mock-classifiers))]

        (let [result-chan (e-ms/retrieve-individual-entity-model "individual1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "individual1"))
          (is (= (:name result) "Individual 1"))
          (is (= (:nature result) :individual))
          (is (= (:classifiers result) ["classifier1" "classifier2"])))))))

(deftest test-retrieve-individual-entity-model-error
  (testing "Handle errors in individual entity model retrieval"
    (with-redefs [e-ms/retrieve-classifiers
                  (fn [uid] (throw (Exception. "Test error")))]

      (let [result-chan (e-ms/retrieve-individual-entity-model "error-individual")
            result (async/<!! (async/go (async/<! result-chan)))]

        (is (not (:valid result)))
        (is (contains? result :error))
        (is (= (:uid result) "error-individual"))))))

(deftest test-entity-model-data-validation
  (testing "Entity model validates data structure for kind"
    (let [mock-supertypes-and-definitions {:names ["Test Entity"]
                                           :supertypes ["super1"]
                                           :definitions ["Test definition"]}
          mock-stuff {:synonyms ["synonym1"]}]

      (with-redefs [e-ms/retrieve-supertypes-and-definitions
                    (fn [uid] (go mock-supertypes-and-definitions))
                    e-ms/retrieve-stuff
                    (fn [uid] (go mock-stuff))]

        (let [result-chan (e-ms/retrieve-kind-of-entity-model "entity1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Validate required fields are present
          (is (contains? result :uid))
          (is (contains? result :name))
          (is (contains? result :nature))
          (is (contains? result :definitions))
          (is (contains? result :supertypes))
          (is (contains? result :synonyms))
          
          ;; Validate data types
          (is (string? (:uid result)))
          (is (string? (:name result)))
          (is (keyword? (:nature result)))
          (is (sequential? (:definitions result)))
          (is (sequential? (:supertypes result)))
          (is (sequential? (:synonyms result))))))))

(deftest test-individual-entity-model-data-validation
  (testing "Entity model validates data structure for individual"
    (let [mock-classifiers [{:lh_object_name "Test Individual"
                             :rh_object_uid "classifier1"}]]

      (with-redefs [e-ms/retrieve-classifiers
                    (fn [uid] (go mock-classifiers))]

        (let [result-chan (e-ms/retrieve-individual-entity-model "individual1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Validate required fields are present
          (is (contains? result :uid))
          (is (contains? result :name))
          (is (contains? result :nature))
          (is (contains? result :classifiers))
          
          ;; Validate data types
          (is (string? (:uid result)))
          (is (string? (:name result)))
          (is (keyword? (:nature result)))
          (is (sequential? (:classifiers result))))))))

(deftest test-entity-model-performance-multiple-requests
  (testing "Entity model service handles multiple concurrent requests"
    (let [mock-supertypes-and-definitions {:names ["Performance Test"]
                                           :supertypes []
                                           :definitions []}
          mock-stuff {:synonyms []}]

      (with-redefs [e-ms/retrieve-supertypes-and-definitions
                    (fn [uid] (go (assoc mock-supertypes-and-definitions :names [(str "Entity-" uid)])))
                    e-ms/retrieve-stuff
                    (fn [uid] (go mock-stuff))]

        (let [start-time (System/currentTimeMillis)
              results (async/<!! 
                        (async/go
                          (let [channels (for [i (range 5)]
                                          (e-ms/retrieve-kind-of-entity-model (str "entity-" i)))]
                            (async/<! (async/merge channels)))))]

          (let [end-time (System/currentTimeMillis)
                duration (- end-time start-time)]
            
            ;; Should complete within reasonable time
            (is (< duration 1000))
            (is (not (nil? results)))))))))

(deftest test-entity-model-timeout-handling
  (testing "Entity model handles timeouts gracefully"
    (with-redefs [e-ms/retrieve-supertypes-and-definitions
                  (fn [uid] (async/go (async/<! (async/timeout 50)) {:names ["Test"] :supertypes [] :definitions []}))
                  e-ms/retrieve-stuff
                  (fn [uid] (async/go (async/<! (async/timeout 50)) {:synonyms []}))]

      (let [result-chan (e-ms/retrieve-kind-of-entity-model "timeout-test")
            timeout-chan (async/timeout 30)
            [result port] (async/<!! (async/go (async/alts! [result-chan timeout-chan])))]

        ;; Should timeout since our mock delays exceed the timeout
        (is (= port timeout-chan))))))

(deftest test-entity-model-nil-uid-handling
  (testing "Entity model handles nil UID gracefully"
    (with-redefs [e-ms/retrieve-supertypes-and-definitions
                  (fn [uid] (when uid (go {:names ["Test"] :supertypes [] :definitions []})))
                  e-ms/retrieve-stuff
                  (fn [uid] (when uid (go {:synonyms []})))]

      (let [result-chan (e-ms/retrieve-kind-of-entity-model nil)
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle nil UID appropriately
        (is (nil? result))))))

(deftest test-entity-model-empty-uid-handling
  (testing "Entity model handles empty UID gracefully"
    (with-redefs [e-ms/retrieve-supertypes-and-definitions
                  (fn [uid] (when (and uid (not= uid "")) (go {:names ["Test"] :supertypes [] :definitions []})))
                  e-ms/retrieve-stuff
                  (fn [uid] (when (and uid (not= uid "")) (go {:synonyms []})))]

      (let [result-chan (e-ms/retrieve-kind-of-entity-model "")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle empty UID appropriately
        (is (nil? result))))))

(deftest test-synonym-deduplication
  (testing "Synonyms are properly deduplicated"
    (let [mock-facts [{:rel_type_uid 1981 :lh_object_name "synonym1"}
                      {:rel_type_uid 1981 :lh_object_name "synonym2"}
                      {:rel_type_uid 1981 :lh_object_name "synonym1"} ; Duplicate
                      {:rel_type_uid 1981 :lh_object_name "synonym3"}
                      {:rel_type_uid 1981 :lh_object_name "synonym2"}]] ; Another duplicate

      (with-redefs [archivist-api/get-all-related-facts
                    (fn [uid] (go mock-facts))]

        (let [result-chan (e-ms/retrieve-stuff "entity1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (= (count (:synonyms result)) 3))
          (is (contains? (set (:synonyms result)) "synonym1"))
          (is (contains? (set (:synonyms result)) "synonym2"))
          (is (contains? (set (:synonyms result)) "synonym3")))))))

(deftest test-fact-filtering-by-relation-type
  (testing "Facts are properly filtered by relation type"
    (let [mock-facts [{:rel_type_uid 1225 :data "classification1"}  ; Classification
                      {:rel_type_uid 1146 :data "specialization1"} ; Specialization
                      {:rel_type_uid 1726 :data "qualification1"}  ; Qualification
                      {:rel_type_uid 1981 :lh_object_name "synonym1"} ; Synonym
                      {:rel_type_uid 9999 :data "other"}]] ; Other type

      (with-redefs [archivist-api/get-all-related-facts
                    (fn [uid] (go mock-facts))]

        (let [result-chan (e-ms/retrieve-stuff "entity1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (= (count (:classifications result)) 1))
          (is (= (count (:specializations result)) 1))
          (is (= (count (:qualifications result)) 1))
          (is (= (count (:synonyms result)) 1))
          
          ;; The fact with rel_type_uid 9999 should not appear in any category
          (is (not (some #(= (:data %) "other") (:classifications result))))
          (is (not (some #(= (:data %) "other") (:specializations result))))
          (is (not (some #(= (:data %) "other") (:qualifications result)))))))))

(deftest test-entity-model-concurrent-access
  (testing "Entity model service handles concurrent access to same UID"
    (let [mock-supertypes-and-definitions {:names ["Concurrent Test"]
                                           :supertypes []
                                           :definitions []}
          mock-stuff {:synonyms []}
          access-count (atom 0)]

      (with-redefs [e-ms/retrieve-supertypes-and-definitions
                    (fn [uid] 
                      (swap! access-count inc)
                      (go mock-supertypes-and-definitions))
                    e-ms/retrieve-stuff
                    (fn [uid] (go mock-stuff))]

        (let [channels (for [i (range 3)]
                        (e-ms/retrieve-kind-of-entity-model "concurrent-test"))
              results (async/<!! 
                        (async/go
                          (loop [remaining-channels channels
                                 collected-results []]
                            (if (empty? remaining-channels)
                              collected-results
                              (let [result (async/<! (first remaining-channels))]
                                (recur (rest remaining-channels)
                                       (conj collected-results result)))))))]

          ;; Should have called the helper service 3 times (no caching in this implementation)
          (is (= @access-count 3))
          
          ;; All results should be consistent
          (is (= (count results) 3))
          (is (every? #(= (:uid %) "concurrent-test") results))
          (is (every? #(= (:name %) "Concurrent Test") results)))))))

(deftest test-entity-model-empty-collections
  (testing "Entity model handles empty collections gracefully"
    (let [mock-supertypes-and-definitions {:names []
                                           :supertypes []
                                           :definitions []}
          mock-stuff {:classifications []
                      :specializations []
                      :qualifications []
                      :synonyms []}]

      (with-redefs [e-ms/retrieve-supertypes-and-definitions
                    (fn [uid] (go mock-supertypes-and-definitions))
                    e-ms/retrieve-stuff
                    (fn [uid] (go mock-stuff))]

        (let [result-chan (e-ms/retrieve-kind-of-entity-model "empty-entity")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "empty-entity"))
          (is (nil? (:name result))) ; First of empty collection
          (is (= (:nature result) :kind))
          (is (empty? (:definitions result)))
          (is (empty? (:supertypes result)))
          (is (empty? (:synonyms result))))))))

(deftest test-individual-entity-model-empty-classifiers
  (testing "Individual entity model handles empty classifiers"
    (with-redefs [e-ms/retrieve-classifiers
                  (fn [uid] (go []))]

      (let [result-chan (e-ms/retrieve-individual-entity-model "empty-individual")
            result (async/<!! (async/go (async/<! result-chan)))]

        (is (not (nil? result)))
        (is (= (:uid result) "empty-individual"))
        (is (nil? (:name result))) ; First of empty collection
        (is (= (:nature result) :individual))
        (is (empty? (:classifiers result)))))))

;; Integration tests (require actual dependencies)
(deftest ^:integration test-entity-model-integration
  (testing "Integration test with real dependencies"
    ;; Skip if not in integration test environment
    (when (System/getProperty "clarity.integration.tests")
      (let [result-chan (e-ms/retrieve-kind-of-entity-model "1") ; Some real entity UID
            result (async/<!! (async/go 
                                (async/<! 
                                  (async/timeout 5000) ; 5 second timeout
                                  result-chan)))]
        
        (is (not (nil? result)))
        (is (contains? result :uid))
        (is (contains? result :nature))
        (is (= (:nature result) :kind))))))

(deftest test-entity-model-error-propagation
  (testing "Entity model properly propagates archivist API errors"
    (let [error-msg "Archivist API error"]
      
      (with-redefs [archivist-api/get-definitive-facts
                    (fn [uid] (throw (Exception. error-msg)))
                    archivist-api/get-all-related-facts
                    (fn [uid] (go []))]

        (let [result-chan (e-ms/retrieve-kind-of-entity-model "error-test")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Should handle the error and return error structure
          (is (not (:valid result)))
          (is (contains? result :error))
          (is (.contains (:error result) error-msg)))))))

(deftest test-entity-model-async-behavior
  (testing "Entity model maintains proper async behavior"
    (let [mock-supertypes-and-definitions {:names ["Async Test"]
                                           :supertypes []
                                           :definitions []}
          mock-stuff {:synonyms []}
          call-order (atom [])]

      (with-redefs [e-ms/retrieve-supertypes-and-definitions
                    (fn [uid] 
                      (go 
                        (swap! call-order conj :supertypes-start)
                        (async/<! (async/timeout 10)) ; Small delay
                        (swap! call-order conj :supertypes-end)
                        mock-supertypes-and-definitions))
                    e-ms/retrieve-stuff
                    (fn [uid] 
                      (go 
                        (swap! call-order conj :stuff-start)
                        (async/<! (async/timeout 5)) ; Smaller delay
                        (swap! call-order conj :stuff-end)
                        mock-stuff))]

        (let [result-chan (e-ms/retrieve-kind-of-entity-model "async-test")]
          (swap! call-order conj :entity-model-called)
          
          (let [result (async/<!! (async/go (async/<! result-chan)))]
            (swap! call-order conj :entity-model-complete)
            
            ;; Should maintain proper async execution order
            (is (= (first @call-order) :entity-model-called))
            (is (= (last @call-order) :entity-model-complete))
            
            ;; Should return proper result
            (is (not (nil? result)))
            (is (= (:name result) "Async Test"))))))))
