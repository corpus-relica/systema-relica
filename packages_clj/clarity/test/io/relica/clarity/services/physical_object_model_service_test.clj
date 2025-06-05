(ns io.relica.clarity.services.physical-object-model-service-test
  "Tests for physical object model service"
  (:require [clojure.test :refer :all]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]
            [io.relica.clarity.services.physical-object-model-service :as po-ms]
            [io.relica.clarity.services.entity-model-service :as e-ms]
            [io.relica.clarity.io.archivist-api :as archivist-api]
            [io.relica.clarity.test-fixtures :as fixtures]
            [io.relica.clarity.test-helpers :as helpers]))

(deftest test-constants-defined
  (testing "Physical object service constants are properly defined"
    (is (= po-ms/aspect-uid 1727))
    (is (= po-ms/involvement-uid 4648))
    (is (= po-ms/is-part-of-uid 1190))
    (is (= po-ms/connection-uid 1487))
    (is (= po-ms/qual-asp-rel-type-uid 2070))
    (is (= po-ms/quant-asp-rel-type-uid 5848))
    (is (= po-ms/intrn-asp-rel-type-uid 5738))
    (is (= po-ms/can-have-role-rel-type-uid 4714))))

(deftest test-retrieve-kind-of-physical-object-model-success
  (testing "Successfully retrieve kind of physical object model"
    (let [mock-base-model {:uid "po1" :name "Physical Object" :type "kind"}
          mock-qual-aspects [{:rh_object_uid "qa1" :rh_object_name "Quality Aspect 1"}]
          mock-quant-aspects [{:rh_object_uid "qa2" :rh_object_name "Quantity Aspect 1"}]
          mock-intrn-aspects [{:rh_object_uid "ia1" :rh_object_name "Intrinsic Aspect 1"}]
          mock-possible-roles [[{:rh_object_uid "role1" :rh_object_name "Test Role"
                                 :lh_object_uid "po1" :lh_object_name "Physical Object"}]]]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))
                    archivist-api/get-core-sample
                    (fn [uid rel-type-uid]
                      (go
                        (case rel-type-uid
                          2070 mock-qual-aspects    ; qual-asp-rel-type-uid
                          5848 mock-quant-aspects   ; quant-asp-rel-type-uid
                          5738 mock-intrn-aspects   ; intrn-asp-rel-type-uid
                          4714 mock-possible-roles  ; can-have-role-rel-type-uid
                          [])))]

        (let [result-chan (po-ms/retrieve-kind-of-physical-object-model "po1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "po1"))
          (is (= (:name result) "Physical Object"))
          (is (= (:type result) "kind"))
          (is (= (:category result) "physical object"))
          (is (= (:definitive-kinds-of-qualitative-aspects result) mock-qual-aspects))
          (is (= (:definitive-kinds-of-quantitative-aspects result) mock-quant-aspects))
          (is (= (:definitive-kinds-of-intrinsic-aspects result) mock-intrn-aspects))
          (is (seq (:possible-kinds-of-roles result))))))))

(deftest test-retrieve-kind-of-physical-object-model-error
  (testing "Handle errors in kind of physical object model retrieval"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (throw (Exception. "Test error")))
                  archivist-api/get-core-sample
                  (fn [uid rel-type-uid] (go []))]

      (let [result-chan (po-ms/retrieve-kind-of-physical-object-model "error-po")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle the error gracefully (returns nil in this implementation)
        (is (nil? result))))))

(deftest test-retrieve-individual-physical-object-model-success
  (testing "Successfully retrieve individual physical object model"
    (let [mock-base-model {:uid "po-individual" :name "Physical Object Instance" :type "individual"}
          mock-totalities [{:rh_object_uid "totality1"}]
          mock-parts [{:lh_object_uid "part1"}]
          mock-connected-to [{:lh_object_uid "connected1"}]
          mock-connections-in [{:rh_object_uid "connection1"}]]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-base-model))
                    archivist-api/get-related-facts-by-relation
                    (fn [uid rel-type-uid]
                      (go
                        (case rel-type-uid
                          1190 mock-totalities      ; is-part-of-uid (totalities)
                          1487 mock-connections-in  ; connection-uid (connections-in)
                          [])))
                    archivist-api/get-related-to-subtype-cone
                    (fn [uid rel-type-uid] (go mock-parts))
                    archivist-api/get-related-to
                    (fn [uid rel-type-uid] (go mock-connected-to))]

        (let [result-chan (po-ms/retrieve-individual-physical-object-model "po-individual")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "po-individual"))
          (is (= (:name result) "Physical Object Instance"))
          (is (= (:type result) "individual"))
          (is (= (:category result) "physical object"))
          (is (= (:totalities result) ["totality1"]))
          (is (= (:parts result) ["part1"]))
          (is (= (:connected-to result) ["connected1"]))
          (is (= (:connections-in result) ["connection1"])))))))

(deftest test-retrieve-individual-physical-object-model-empty-relations
  (testing "Individual physical object model with empty relations"
    (let [mock-base-model {:uid "po-empty" :name "Empty Physical Object" :type "individual"}]

      (with-redefs [e-ms/retrieve-individual-entity-model
                    (fn [uid] (go mock-base-model))
                    archivist-api/get-related-facts-by-relation
                    (fn [uid rel-type-uid] (go []))
                    archivist-api/get-related-to-subtype-cone
                    (fn [uid rel-type-uid] (go []))
                    archivist-api/get-related-to
                    (fn [uid rel-type-uid] (go []))]

        (let [result-chan (po-ms/retrieve-individual-physical-object-model "po-empty")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "po-empty"))
          (is (= (:category result) "physical object"))
          (is (empty? (:totalities result)))
          (is (empty? (:parts result)))
          (is (empty? (:connected-to result)))
          (is (empty? (:connections-in result))))))))

(deftest test-retrieve-individual-physical-object-model-error
  (testing "Handle errors in individual physical object model retrieval"
    (with-redefs [e-ms/retrieve-individual-entity-model
                  (fn [uid] (throw (Exception. "Test error")))
                  archivist-api/get-related-facts-by-relation
                  (fn [uid rel-type-uid] (go []))
                  archivist-api/get-related-to-subtype-cone
                  (fn [uid rel-type-uid] (go []))
                  archivist-api/get-related-to
                  (fn [uid rel-type-uid] (go []))]

      (let [result-chan (po-ms/retrieve-individual-physical-object-model "error-individual")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle the error gracefully (returns nil in this implementation)
        (is (nil? result))))))

(deftest test-possible-roles-transformation
  (testing "Possible roles data transformation works correctly"
    (let [mock-base-model {:uid "po1" :name "Physical Object" :type "kind"}
          mock-possible-roles-raw [[{:rh_object_uid "role1" :rh_object_name "Role 1"
                                     :lh_object_uid "po1" :lh_object_name "Physical Object"}
                                    {:rh_object_uid "role2" :rh_object_name "Role 2"
                                     :lh_object_uid "po1" :lh_object_name "Physical Object"}]]]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))
                    archivist-api/get-core-sample
                    (fn [uid rel-type-uid]
                      (go
                        (case rel-type-uid
                          4714 mock-possible-roles-raw  ; can-have-role-rel-type-uid
                          [])))]

        (let [result-chan (po-ms/retrieve-kind-of-physical-object-model "po1")
              result (async/<!! (async/go (async/<! result-chan)))
              roles (:possible-kinds-of-roles result)]

          (is (not (nil? result)))
          (is (seq roles))
          ;; Verify the transformation structure
          (is (vector? (first roles)))
          (is (= 2 (count (first roles)))) ; Two roles in the nested structure
          (is (= 4 (count (first (first roles))))) ; Each role has 4 elements: [rh_uid, rh_name, lh_uid, lh_name]
          ))))

(deftest test-physical-object-model-merge-behavior
  (testing "Physical object model properly merges with base entity model"
    (let [mock-base-model {:uid "po1" :name "Physical Object" :type "kind" :description "Base description"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))
                    archivist-api/get-core-sample
                    (fn [uid rel-type-uid] (go []))]

        (let [result-chan (po-ms/retrieve-kind-of-physical-object-model "po1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Should preserve base model properties
          (is (= (:uid result) "po1"))
          (is (= (:name result) "Physical Object"))
          (is (= (:type result) "kind"))
          (is (= (:description result) "Base description"))
          
          ;; Should add physical object specific properties
          (is (= (:category result) "physical object"))
          (is (contains? result :definitive-kinds-of-qualitative-aspects))
          (is (contains? result :definitive-kinds-of-quantitative-aspects))
          (is (contains? result :definitive-kinds-of-intrinsic-aspects))
          (is (contains? result :possible-kinds-of-roles)))))))

(deftest test-physical-object-archivist-timeout-handling
  (testing "Physical object model handles Archivist timeouts gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (async/go (async/<! (async/timeout 50)) {:uid uid :name "Test"}))
                  archivist-api/get-core-sample
                  (fn [uid rel-type-uid] (async/go (async/<! (async/timeout 50)) []))]

      (let [result-chan (po-ms/retrieve-kind-of-physical-object-model "timeout-test")
            timeout-chan (async/timeout 30)
            [result port] (async/<!! (async/go (async/alts! [result-chan timeout-chan])))]

        ;; Should timeout since our mock delays exceed the timeout
        (is (= port timeout-chan))))))

(deftest test-physical-object-performance-multiple-requests
  (testing "Physical object model service handles multiple concurrent requests"
    (let [mock-base-model {:uid "po-perf" :name "Performance Test" :type "kind"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go (assoc mock-base-model :uid uid)))
                    archivist-api/get-core-sample
                    (fn [uid rel-type-uid] (go []))]

        (let [start-time (System/currentTimeMillis)
              results (async/<!! 
                        (async/go
                          (let [channels (for [i (range 5)]
                                          (po-ms/retrieve-kind-of-physical-object-model (str "po-" i)))]
                            (async/<! (async/merge channels)))))]

          (let [end-time (System/currentTimeMillis)
                duration (- end-time start-time)]
            
            ;; Should complete within reasonable time
            (is (< duration 1000))
            (is (not (nil? results))))))))

;; Integration tests (require actual dependencies)
(deftest ^:integration test-physical-object-model-integration
  (testing "Integration test with real dependencies"
    ;; Skip if not in integration test environment
    (when (System/getProperty "clarity.integration.tests")
      (let [result-chan (po-ms/retrieve-kind-of-physical-object-model "1") ; Some real UID
            result (async/<!! (async/go 
                                (async/<! 
                                  (async/timeout 5000) ; 5 second timeout
                                  result-chan)))]
        
        (is (not (nil? result)))
        (is (contains? result :uid))
        (is (contains? result :category))
        (is (= (:category result) "physical object"))))))

(deftest test-physical-object-data-validation
  (testing "Physical object model validates data structure"
    (let [mock-base-model {:uid "po1" :name "Physical Object" :type "kind"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))
                    archivist-api/get-core-sample
                    (fn [uid rel-type-uid] (go []))]

        (let [result-chan (po-ms/retrieve-kind-of-physical-object-model "po1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Validate required fields are present
          (is (contains? result :uid))
          (is (contains? result :name))
          (is (contains? result :type))
          (is (contains? result :category))
          
          ;; Validate physical object specific fields
          (is (contains? result :definitive-kinds-of-qualitative-aspects))
          (is (contains? result :definitive-kinds-of-quantitative-aspects))
          (is (contains? result :definitive-kinds-of-intrinsic-aspects))
          (is (contains? result :possible-kinds-of-roles))
          
          ;; Validate data types
          (is (string? (:uid result)))
          (is (string? (:name result)))
          (is (string? (:type result)))
          (is (string? (:category result)))
          (is (sequential? (:definitive-kinds-of-qualitative-aspects result)))
          (is (sequential? (:definitive-kinds-of-quantitative-aspects result)))
          (is (sequential? (:definitive-kinds-of-intrinsic-aspects result)))
          (is (sequential? (:possible-kinds-of-roles result))))))))

(deftest test-physical-object-nil-uid-handling
  (testing "Physical object model handles nil UID gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (when uid (go {:uid uid :name "Test"})))
                  archivist-api/get-core-sample
                  (fn [uid rel-type-uid] (when uid (go [])))]

      (let [result-chan (po-ms/retrieve-kind-of-physical-object-model nil)
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle nil UID appropriately
        (is (nil? result))))))

(deftest test-physical-object-empty-uid-handling
  (testing "Physical object model handles empty UID gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (when (and uid (not= uid "")) (go {:uid uid :name "Test"})))
                  archivist-api/get-core-sample
                  (fn [uid rel-type-uid] (when (and uid (not= uid "")) (go [])))]

      (let [result-chan (po-ms/retrieve-kind-of-physical-object-model "")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle empty UID appropriately
        (is (nil? result)))))