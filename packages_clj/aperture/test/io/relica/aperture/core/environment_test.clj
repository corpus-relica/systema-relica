(ns io.relica.aperture.core.environment-test
  "Tests for environment management functionality."
  (:require [clojure.test :refer :all]
            [clojure.core.async :refer [go <! >! chan timeout close!] :as async]
            [io.relica.aperture.core.environment :as env]
            [io.relica.aperture.test-helpers :as helpers]
            [io.relica.aperture.test-fixtures :as fixtures]
            [io.relica.aperture.config :as config]
            [io.relica.aperture.io.client-instances :as client-instances]))

;; Basic environment operations tests
(deftest test-get-environment-success
  (testing "Get environment returns environment data successfully"
    (fixtures/with-mock-environment-service 
      (fn []
        (let [result @(env/get-environment "user-456" "test-env-123")]
          (is (:success result))
          (is (contains? result :environment))
          (is (= "test-env-123" (get-in result [:environment :id])))))
      {:get fixtures/mock-environment-data})))

(deftest test-get-environment-not-found
  (testing "Get environment handles not found case"
    (fixtures/with-mock-environment-service
      (fn []
        (let [result @(env/get-environment "user-456" "nonexistent-env")]
          (is (not (:success result)))
          (is (= "Environment not found" (:error result)))))
      {:get nil})))

(deftest test-get-environment-with-failure
  (testing "Get environment handles service failures"
    (fixtures/with-failing-service :connection-error
      (fn []
        (let [result @(env/get-environment "user-456" "test-env-123")]
          (is (not (:success result)))
          (is (= "Failed to get environment" (:error result))))))))

(deftest test-list-environments-success
  (testing "List environments returns environment list successfully"
    (fixtures/with-mock-environment-service
      (fn []
        (let [result @(env/list-environments "user-1")]
          (is (:success result))
          (is (contains? result :environments))
          (is (= 3 (count (:environments result))))))
      {:list fixtures/mock-environment-list})))

(deftest test-list-environments-with-failure
  (testing "List environments handles service failures"
    (fixtures/with-failing-service :service-unavailable
      (fn []
        (let [result @(env/list-environments "user-1")]
          (is (not (:success result)))
          (is (= "Failed to list environments" (:error result))))))))

(deftest test-create-environment-success
  (testing "Create environment returns new environment successfully"
    (fixtures/with-mock-environment-service
      (fn []
        (let [result @(env/create-environment "user-456" "New Test Environment")]
          (is (:success result))
          (is (contains? result :environment))
          (is (= "user-456" (get-in result [:environment :user_id])))))
      {:create (assoc fixtures/mock-environment-data :name "New Test Environment")})))

(deftest test-create-environment-with-failure
  (testing "Create environment handles service failures"
    (fixtures/with-failing-service :invalid-response
      (fn []
        (let [result @(env/create-environment "user-456" "Failed Environment")]
          (is (not (:success result)))
          (is (= "Failed to create environment" (:error result))))))))

;; Search operations tests
(deftest test-text-search-load-success
  (testing "Text search load updates environment with matching facts"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:id "test-env-123" :facts []})]
      (let [mock-archivist-response {:results {:facts [fixtures/mock-fact-data]}}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/text-search
                      (fn [_ _] (async/go mock-archivist-response))]
          (let [result @(env/text-search-load "user-456" "Test Entity")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

(deftest test-uid-search-load-success
  (testing "UID search load updates environment with matching facts"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:id "test-env-123" :facts []})]
      (let [mock-archivist-response {:results {:facts [fixtures/mock-fact-data]}}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/uid-search
                      (fn [_ _] (async/go mock-archivist-response))]
          (let [result @(env/uid-search-load "user-456" "entity-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

;; Entity loading tests
(deftest test-load-entity-success
  (testing "Load entity updates environment with entity facts"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts [] :selected_entity_id nil})
                  config/update-user-environment! (constantly {:id "test-env-123" :facts []})]
      (let [mock-archivist-response {:facts [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-definitive-facts
                      (fn [_ _] (async/go mock-archivist-response))
                      io.relica.common.io.archivist-client/get-facts-relating-entities
                      (fn [_ _ _] (async/go {:facts []}))]
          (let [result @(env/load-entity "user-456" "entity-123" "test-env-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

(deftest test-load-entity-with-selected-entity
  (testing "Load entity includes relating facts when entity is selected"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts [] :selected_entity_id "selected-entity"})
                  config/update-user-environment! (constantly {:id "test-env-123" :facts []})]
      (let [definitive-facts {:facts [fixtures/mock-fact-data]}
            relating-facts {:facts [(assoc fixtures/mock-fact-data :uid "relating-fact")]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-definitive-facts
                      (fn [_ _] (async/go definitive-facts))
                      io.relica.common.io.archivist-client/get-facts-relating-entities
                      (fn [_ _ _] (async/go relating-facts))]
          (let [result @(env/load-entity "user-456" "entity-123" "test-env-123")]
            (is (:success result))
            (is (= 2 (count (:facts result))))))))))

(deftest test-unload-entity-success
  (testing "Unload entity removes entity facts from environment"
    (let [test-facts [fixtures/mock-fact-data
                      (assoc fixtures/mock-fact-data :uid "other-fact" :subject "other-entity")]
          expected-remaining-facts [(assoc fixtures/mock-fact-data :uid "other-fact" :subject "other-entity")]]
      (with-redefs [config/get-user-environment (constantly {:facts test-facts})
                    config/update-user-environment! (constantly {:facts expected-remaining-facts})]
        (let [result @(env/unload-entity "user-456" "ent-1" "test-env-123")]
          (is (:success result))
          (is (contains? result :fact-uids-removed))
          (is (contains? result :model-uids-removed)))))))

;; Multiple entity operations tests
(deftest test-load-entities-success
  (testing "Load entities processes multiple entities successfully"
    (with-redefs [config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-entity-result {:success true :facts [fixtures/mock-fact-data]}]
        (with-redefs [env/load-entity (constantly (async/go mock-entity-result))]
          (let [result @(env/load-entities "user-456" "test-env-123" ["entity-1" "entity-2"])]
            (is (:success result))
            (is (contains? result :facts))
            (is (contains? result :models))))))))

(deftest test-unload-entities-success
  (testing "Unload entities removes multiple entities from environment"
    (let [test-facts [fixtures/mock-fact-data
                      (assoc fixtures/mock-fact-data :uid "fact-2" :subject "ent-2")
                      (assoc fixtures/mock-fact-data :uid "fact-3" :subject "other-entity")]]
      (with-redefs [config/get-user-environment (constantly {:facts test-facts})
                    config/update-user-environment! (constantly {:facts []})]
        (let [result @(env/unload-entities "user-456" "test-env-123" ["ent-1" "ent-2"])]
          (is (:success result))
          (is (contains? result :fact-uids-removed))
          (is (contains? result :model-uids-removed)))))))

;; Specialization tests
(deftest test-load-specialization-fact-success
  (testing "Load specialization fact updates environment"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-archivist-response {:facts [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-specialization-fact
                      (fn [_ _ _] (async/go mock-archivist-response))]
          (let [result @(env/load-specialization-fact "user-456" "test-env-123" "entity-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

(deftest test-load-specialization-hierarchy-success
  (testing "Load specialization hierarchy updates environment"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-archivist-response {:facts [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-specialization-hierarchy
                      (fn [_ _ _] (async/go mock-archivist-response))]
          (let [result @(env/load-specialization-hierarchy "user-456" "entity-123" "test-env-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

;; Subtype operations tests
(deftest test-load-subtypes-success
  (testing "Load subtypes updates environment with subtype facts"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-archivist-response {:facts [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-subtypes
                      (fn [_ _] (async/go mock-archivist-response))]
          (let [result @(env/load-subtypes "user-456" "test-env-123" "entity-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

(deftest test-load-subtypes-cone-success
  (testing "Load subtypes cone updates environment with cone facts"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-archivist-response {:facts [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-subtypes-cone
                      (fn [_ _] (async/go mock-archivist-response))]
          (let [result @(env/load-subtypes-cone "user-456" "test-env-123" "entity-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

(deftest test-unload-subtypes-cone-success
  (testing "Unload subtypes cone removes subtype hierarchy from environment"
    (let [test-environment {:facts [fixtures/mock-fact-data]}]
      (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                    config/get-user-environment (constantly test-environment)
                    config/update-user-environment! (constantly {:facts []})]
        (let [result @(env/unload-subtypes-cone "user-456" "test-env-123" "entity-123")]
          (is (:success result))
          (is (contains? result :fact-uids-removed))
          (is (contains? result :model-uids-removed)))))))

;; Classification tests
(deftest test-load-classified-success
  (testing "Load classified updates environment with classification facts"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-archivist-response {:facts [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-classified
                      (fn [_ _] (async/go mock-archivist-response))]
          (let [result @(env/load-classified "user-456" "test-env-123" "entity-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

(deftest test-load-classification-fact-success
  (testing "Load classification fact updates environment"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-archivist-response {:facts [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-classification-fact
                      (fn [_ _] (async/go mock-archivist-response))]
          (let [result @(env/load-classification-fact "user-456" "test-env-123" "entity-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

;; Composition and connection tests
(deftest test-load-composition-success
  (testing "Load composition updates environment with composition facts"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-archivist-response {:facts [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-recurisve-relations
                      (fn [_ _ _] (async/go mock-archivist-response))]
          (let [result @(env/load-composition "user-456" "test-env-123" "entity-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

(deftest test-load-composition-in-success
  (testing "Load composition-in updates environment with incoming composition facts"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-archivist-response {:facts [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-recurisve-relations-to
                      (fn [_ _ _] (async/go mock-archivist-response))]
          (let [result @(env/load-composition-in "user-456" "test-env-123" "entity-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

(deftest test-load-connections-success
  (testing "Load connections updates environment with connection facts"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-archivist-response {:facts [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-recurisve-relations
                      (fn [_ _ _] (async/go mock-archivist-response))]
          (let [result @(env/load-connections "user-456" "test-env-123" "entity-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

(deftest test-load-connections-in-success
  (testing "Load connections-in updates environment with incoming connection facts"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-archivist-response {:facts [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-recurisve-relations-to
                      (fn [_ _ _] (async/go mock-archivist-response))]
          (let [result @(env/load-connections-in "user-456" "test-env-123" "entity-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

;; Environment clearing tests
(deftest test-clear-entities-success
  (testing "Clear entities removes all facts from environment"
    (let [test-environment {:facts [fixtures/mock-fact-data
                                   (assoc fixtures/mock-fact-data :fact_uid "fact-2")]}]
      (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                    config/get-user-environment (constantly test-environment)
                    config/update-user-environment! (constantly {:facts []})]
        (let [result @(env/clear-entities "user-456" "test-env-123")]
          (is (:success result))
          (is (contains? result :fact-uids-removed))
          (is (= 2 (count (:fact-uids-removed result)))))))))

;; Entity selection tests
(deftest test-select-entity-success
  (testing "Select entity updates environment with selected entity"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/select-entity! (constantly {:selected_entity_id "entity-123"})]
      (let [result @(env/select-entity "user-456" "test-env-123" "entity-123")]
        (is (:success result))
        (is (= "entity-123" (:selected-entity result)))))))

(deftest test-deselect-entity-success
  (testing "Deselect entity clears selected entity from environment"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/deselect-entity! (constantly {:selected_entity_id nil})]
      (let [result @(env/deselect-entity "user-456" "test-env-123")]
        (is (:success result))))))

;; Role operations tests
(deftest test-load-required-roles-success
  (testing "Load required roles updates environment with role facts"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-archivist-response {:data [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-required-roles
                      (fn [_ _] (async/go mock-archivist-response))]
          (let [result @(env/load-required-roles "user-456" "test-env-123" 4714)]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

(deftest test-load-role-players-success
  (testing "Load role players updates environment with player facts"
    (with-redefs [config/get-default-environment (constantly {:id "test-env-123"})
                  config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-requirement {:requirement fixtures/mock-fact-data :player fixtures/mock-fact-data}
            mock-archivist-response {:data [mock-requirement mock-requirement]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-role-players
                      (fn [_ _] (async/go mock-archivist-response))]
          (let [result @(env/load-role-players "user-456" "test-env-123" 4714)]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))
            (is (= 4 (count (:facts result)))))))))

;; Edge cases and error handling tests
(deftest test-deduplicate-facts-functionality
  (testing "Fact deduplication works correctly"
    (let [duplicate-facts [fixtures/mock-fact-data
                          fixtures/mock-fact-data
                          (assoc fixtures/mock-fact-data :fact_uid "different-uid")]
          deduplicated (#'env/deduplicate-facts duplicate-facts)]
      (is (= 2 (count deduplicated)))
      (is (= #{"fact-123" "different-uid"} (set (map :fact_uid deduplicated)))))))

(deftest test-load-all-related-facts-success
  (testing "Load all related facts updates environment correctly"
    (with-redefs [config/get-user-environment (constantly {:facts []})
                  config/update-user-environment! (constantly {:facts []})]
      (let [mock-archivist-response {:facts [fixtures/mock-fact-data]}]
        (with-redefs [client-instances/archivist-client (constantly nil)
                      io.relica.common.io.archivist-client/get-all-related
                      (fn [_ _] (async/go mock-archivist-response))]
          (let [result @(env/load-all-related-facts "user-456" "entity-123" "test-env-123")]
            (is (:success result))
            (is (contains? result :environment))
            (is (contains? result :facts))))))))

;; Performance tests with large datasets
(deftest test-environment-operations-with-large-dataset
  (testing "Environment operations handle large datasets efficiently"
    (fixtures/with-performance-data
      (fn []
        (let [result @(env/list-environments "perf-user-1")]
          (is (:success result))
          (is (= 100 (count (:environments result)))))))))

;; Async operation error handling
(deftest test-async-error-handling
  (testing "Async operations handle errors gracefully"
    (with-redefs [config/get-default-environment (fn [_] (throw (Exception. "Config error")))]
      (let [result @(env/get-environment "user-456" nil)]
        (is (not (:success result)))
        (is (= "Failed to get environment" (:error result))))))))
