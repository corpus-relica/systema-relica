(ns io.relica.clarity.services.role-model-service-test
  "Tests for role model service"
  (:require [clojure.test :refer :all]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]
            [io.relica.clarity.services.role-model-service :as rol-ms]
            [io.relica.clarity.services.entity-model-service :as e-ms]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.clarity.io.client-instances :refer [archivist-client]]
            [io.relica.clarity.test-fixtures :as fixtures]
            [io.relica.clarity.test-helpers :as helpers]))

(deftest test-retrieve-possible-kinds-of-role-players-success
  (testing "Successfully retrieve possible kinds of role players"
    (let [mock-response {:success true 
                         :facts [{:lh_object_uid "player1"}
                                {:lh_object_uid "player2"}]}]

      (with-redefs [archivist/get-related-to
                    (fn [client uid rel-type-uid]
                      (go
                        (when (= rel-type-uid 4714)
                          mock-response)))]

        (let [result-chan (rol-ms/retrieve-possible-kinds-of-role-players "role1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (sequential? result))
          (is (= 2 (count result)))
          (is (some #(= % "player1") result))
          (is (some #(= % "player2") result)))))))

(deftest test-retrieve-possible-kinds-of-role-players-error
  (testing "Handle errors in retrieving possible kinds of role players"
    (with-redefs [archivist/get-related-to
                  (fn [client uid rel-type-uid]
                    (throw (Exception. "Test error")))]

      (let [result-chan (rol-ms/retrieve-possible-kinds-of-role-players "error-role")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle error gracefully and return empty map
        (is (= result {}))))))

(deftest test-retrieve-possible-kinds-of-role-players-failure
  (testing "Handle failure response from Archivist"
    (let [mock-response {:success false :facts []}]

      (with-redefs [archivist/get-related-to
                    (fn [client uid rel-type-uid] (go mock-response))]

        (let [result-chan (rol-ms/retrieve-possible-kinds-of-role-players "fail-role")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (sequential? result))
          (is (empty? result)))))))

(deftest test-retrieve-requiring-kinds-of-relations-success
  (testing "Successfully retrieve requiring kinds of relations"
    (let [mock-response-1 {:success true 
                           :facts [{:lh_object_uid "relation1"}]}
          mock-response-2 {:success true 
                           :facts [{:lh_object_uid "relation2"}]}]

      (with-redefs [archivist/get-related-to
                    (fn [client uid rel-type-uid]
                      (go
                        (case rel-type-uid
                          4731 mock-response-1
                          4733 mock-response-2
                          {:success false :facts []})))]

        (let [result-chan (rol-ms/retrieve-requiring-kinds-of-relations "role1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (sequential? result))
          (is (= 2 (count result)))
          (is (some #(= % "relation1") result))
          (is (some #(= % "relation2") result)))))))

(deftest test-retrieve-requiring-kinds-of-relations-partial-failure
  (testing "Handle partial failure in retrieving requiring kinds of relations"
    (let [mock-response-1 {:success true 
                           :facts [{:lh_object_uid "relation1"}]}
          mock-response-2 {:success false :facts []}]

      (with-redefs [archivist/get-related-to
                    (fn [client uid rel-type-uid]
                      (go
                        (case rel-type-uid
                          4731 mock-response-1
                          4733 mock-response-2
                          {:success false :facts []})))]

        (let [result-chan (rol-ms/retrieve-requiring-kinds-of-relations "role1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Should return empty list when not all requests succeed
          (is (sequential? result))
          (is (empty? result)))))))

(deftest test-retrieve-requiring-kinds-of-relations-error
  (testing "Handle errors in retrieving requiring kinds of relations"
    (with-redefs [archivist/get-related-to
                  (fn [client uid rel-type-uid]
                    (throw (Exception. "Test error")))]

      (let [result-chan (rol-ms/retrieve-requiring-kinds-of-relations "error-role")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle error gracefully and return empty list
        (is (sequential? result))
        (is (empty? result))))))

(deftest test-retrieve-kind-of-role-model-success
  (testing "Successfully retrieve kind of role model"
    (let [mock-base-model {:uid "role1" :name "Test Role" :type "kind"}
          mock-players ["player1" "player2"]
          mock-relations ["relation1" "relation2"]]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))
                    rol-ms/retrieve-possible-kinds-of-role-players
                    (fn [uid] (go mock-players))
                    rol-ms/retrieve-requiring-kinds-of-relations
                    (fn [uid] (go mock-relations))]

        (let [result-chan (rol-ms/retrieve-kind-of-role-model "role1")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "role1"))
          (is (= (:name result) "Test Role"))
          (is (= (:type result) "kind"))
          (is (= (:category result) "role"))
          (is (= (:possible-kinds-of-role-players result) mock-players))
          (is (= (:requiring-kinds-of-relations result) mock-relations)))))))

(deftest test-retrieve-kind-of-role-model-error
  (testing "Handle errors in kind of role model retrieval"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (throw (Exception. "Test error")))
                  rol-ms/retrieve-possible-kinds-of-role-players
                  (fn [uid] (go []))
                  rol-ms/retrieve-requiring-kinds-of-relations
                  (fn [uid] (go []))]

      (let [result-chan (rol-ms/retrieve-kind-of-role-model "error-role")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle the error gracefully (returns nil in this implementation)
        (is (nil? result))))))

(deftest test-role-model-merge-behavior
  (testing "Role model properly merges with base entity model"
    (let [mock-base-model {:uid "role1" :name "Test Role" :type "kind" :description "Base description"}
          mock-players ["player1"]
          mock-relations ["relation1"]]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))
                    rol-ms/retrieve-possible-kinds-of-role-players
                    (fn [uid] (go mock-players))
                    rol-ms/retrieve-requiring-kinds-of-relations
                    (fn [uid] (go mock-relations))]

        (let [result-chan (rol-ms/retrieve-kind-of-role-model "role1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Should preserve base model properties
          (is (= (:uid result) "role1"))
          (is (= (:name result) "Test Role"))
          (is (= (:type result) "kind"))
          (is (= (:description result) "Base description"))
          
          ;; Should add role specific properties
          (is (= (:category result) "role"))
          (is (contains? result :possible-kinds-of-role-players))
          (is (contains? result :requiring-kinds-of-relations)))))))

(deftest test-role-model-empty-relations
  (testing "Role model with empty relations"
    (let [mock-base-model {:uid "role-empty" :name "Empty Role" :type "kind"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))
                    rol-ms/retrieve-possible-kinds-of-role-players
                    (fn [uid] (go []))
                    rol-ms/retrieve-requiring-kinds-of-relations
                    (fn [uid] (go []))]

        (let [result-chan (rol-ms/retrieve-kind-of-role-model "role-empty")
              result (async/<!! (async/go (async/<! result-chan)))]

          (is (not (nil? result)))
          (is (= (:uid result) "role-empty"))
          (is (= (:category result) "role"))
          (is (empty? (:possible-kinds-of-role-players result)))
          (is (empty? (:requiring-kinds-of-relations result))))))))

(deftest test-role-model-data-validation
  (testing "Role model validates data structure"
    (let [mock-base-model {:uid "role1" :name "Test Role" :type "kind"}
          mock-players ["player1"]
          mock-relations ["relation1"]]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go mock-base-model))
                    rol-ms/retrieve-possible-kinds-of-role-players
                    (fn [uid] (go mock-players))
                    rol-ms/retrieve-requiring-kinds-of-relations
                    (fn [uid] (go mock-relations))]

        (let [result-chan (rol-ms/retrieve-kind-of-role-model "role1")
              result (async/<!! (async/go (async/<! result-chan)))]

          ;; Validate required fields are present
          (is (contains? result :uid))
          (is (contains? result :name))
          (is (contains? result :type))
          (is (contains? result :category))
          (is (contains? result :possible-kinds-of-role-players))
          (is (contains? result :requiring-kinds-of-relations))
          
          ;; Validate data types
          (is (string? (:uid result)))
          (is (string? (:name result)))
          (is (string? (:type result)))
          (is (string? (:category result)))
          (is (sequential? (:possible-kinds-of-role-players result)))
          (is (sequential? (:requiring-kinds-of-relations result)))
          (is (= (:category result) "role")))))))

(deftest test-role-model-performance-multiple-requests
  (testing "Role model service handles multiple concurrent requests"
    (let [mock-base-model {:uid "role-perf" :name "Performance Test" :type "kind"}]

      (with-redefs [e-ms/retrieve-kind-of-entity-model
                    (fn [uid] (go (assoc mock-base-model :uid uid)))
                    rol-ms/retrieve-possible-kinds-of-role-players
                    (fn [uid] (go []))
                    rol-ms/retrieve-requiring-kinds-of-relations
                    (fn [uid] (go []))]

        (let [start-time (System/currentTimeMillis)
              results (async/<!! 
                        (async/go
                          (let [channels (for [i (range 5)]
                                          (rol-ms/retrieve-kind-of-role-model (str "role-" i)))]
                            (async/<! (async/merge channels)))))]

          (let [end-time (System/currentTimeMillis)
                duration (- end-time start-time)]
            
            ;; Should complete within reasonable time
            (is (< duration 1000))
            (is (not (nil? results))))))))

(deftest test-role-model-timeout-handling
  (testing "Role model handles timeouts gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (async/go (async/<! (async/timeout 50)) {:uid uid :name "Test"}))
                  rol-ms/retrieve-possible-kinds-of-role-players
                  (fn [uid] (async/go (async/<! (async/timeout 50)) []))
                  rol-ms/retrieve-requiring-kinds-of-relations
                  (fn [uid] (async/go (async/<! (async/timeout 50)) []))]

      (let [result-chan (rol-ms/retrieve-kind-of-role-model "timeout-test")
            timeout-chan (async/timeout 30)
            [result port] (async/<!! (async/go (async/alts! [result-chan timeout-chan])))]

        ;; Should timeout since our mock delays exceed the timeout
        (is (= port timeout-chan))))))

;; Integration tests (require actual dependencies)
(deftest ^:integration test-role-model-integration
  (testing "Integration test with real dependencies"
    ;; Skip if not in integration test environment
    (when (System/getProperty "clarity.integration.tests")
      (let [result-chan (rol-ms/retrieve-kind-of-role-model "1") ; Some real role UID
            result (async/<!! (async/go 
                                (async/<! 
                                  (async/timeout 5000) ; 5 second timeout
                                  result-chan)))]
        
        (is (not (nil? result)))
        (is (contains? result :uid))
        (is (contains? result :category))
        (is (= (:category result) "role"))))))

(deftest test-role-model-nil-uid-handling
  (testing "Role model handles nil UID gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (when uid (go {:uid uid :name "Test"})))
                  rol-ms/retrieve-possible-kinds-of-role-players
                  (fn [uid] (when uid (go [])))
                  rol-ms/retrieve-requiring-kinds-of-relations
                  (fn [uid] (when uid (go [])))]

      (let [result-chan (rol-ms/retrieve-kind-of-role-model nil)
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle nil UID appropriately
        (is (nil? result))))))

(deftest test-role-model-empty-uid-handling
  (testing "Role model handles empty UID gracefully"
    (with-redefs [e-ms/retrieve-kind-of-entity-model
                  (fn [uid] (when (and uid (not= uid "")) (go {:uid uid :name "Test"})))
                  rol-ms/retrieve-possible-kinds-of-role-players
                  (fn [uid] (when (and uid (not= uid "")) (go [])))
                  rol-ms/retrieve-requiring-kinds-of-relations
                  (fn [uid] (when (and uid (not= uid "")) (go [])))]

      (let [result-chan (rol-ms/retrieve-kind-of-role-model "")
            result (async/<!! (async/go (async/<! result-chan)))]

        ;; Should handle empty UID appropriately
        (is (nil? result))))))

(deftest test-role-model-relation-uids-constants
  (testing "Role model service uses correct relation UID constants"
    ;; Test that the service uses the expected relation type UIDs
    (let [expected-possible-role-players-uid 4714
          expected-required-role-1-uid 4731
          expected-required-role-2-uid 4733]

      (with-redefs [archivist/get-related-to
                    (fn [client uid rel-type-uid]
                      (go
                        (is (contains? #{expected-possible-role-players-uid 
                                        expected-required-role-1-uid 
                                        expected-required-role-2-uid} 
                                       rel-type-uid))
                        {:success true :facts []}))]

        ;; Test both helper functions
        (let [players-chan (rol-ms/retrieve-possible-kinds-of-role-players "test")
              relations-chan (rol-ms/retrieve-requiring-kinds-of-relations "test")]
          
          (async/<!! (async/go (async/<! players-chan)))
          (async/<!! (async/go (async/<! relations-chan))))))))