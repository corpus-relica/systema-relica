(ns io.relica.archivist.core.fact-test
  (:require [clojure.test :refer [deftest testing is use-fixtures]]
            [io.relica.archivist.core.fact :as fact]
            [io.relica.archivist.test-fixtures :as fixtures]
            [io.relica.archivist.fact-test-helper :as fact-helper]
            [clojure.core.async :refer [<!!]]))

;; Use the mock services fixture for all tests
(use-fixtures :each fixtures/with-mock-services)

(deftest create-fact-test
  (testing "Creating a fact"
    (with-redefs [fact/create-fact fact-helper/mock-create-fact]
      (let [test-fact {:lh_object_uid 1001
                       :rh_object_uid 2001
                       :rel_type_uid 1225
                       :rel_type_name "is classified as"}
            result (fact/create-fact test-fact)]
        (println "Result:" result)

        ;; Check result
        (is (:success result))
        (is (map? (:fact result)))
        (is (= 1001 (get-in result [:fact :lh_object_uid])))
        (is (= 2001 (get-in result [:fact :rh_object_uid])))
        (is (= 1225 (get-in result [:fact :rel_type_uid])))

        ;; Check cache updates
        (let [cache-state (fixtures/get-mock-cache-state)]
          (is (contains? (:updated-entities cache-state) 1001))
          (is (contains? (:updated-entities cache-state) 2001)))))))

(deftest update-fact-test
  (testing "Updating a fact"
    (with-redefs [fact/update-fact fact-helper/mock-update-fact]
      (let [test-fact {:fact_uid 12345
                       :lh_object_uid 1001
                       :rh_object_uid 2001
                       :rel_type_uid 1225
                       :rel_type_name "is classified as"
                       :updated_field "new value"}
            result (fact/update-fact test-fact)]

        ;; Check result
        (is (:success result))
        (is (map? (:fact result)))
        (is (= 12345 (get-in result [:fact :fact_uid])))

        ;; Check cache updates
        (let [cache-state (fixtures/get-mock-cache-state)]
          (is (contains? (:updated-entities cache-state) 1001))
          (is (contains? (:updated-entities cache-state) 2001)))))))

(deftest create-facts-test
  (testing "Creating multiple facts"
    (with-redefs [fact/create-facts fact-helper/mock-create-facts]
      (let [test-facts [{:lh_object_uid 1001
                         :rh_object_uid 2001
                         :rel_type_uid 1225
                         :rel_type_name "is classified as"}
                        {:lh_object_uid 1002
                         :rh_object_uid 2002
                         :rel_type_uid 1226
                         :rel_type_name "is part of"}]
            result (fact/create-facts test-facts)]

        ;; Check result
        (is (:success result))
        (is (sequential? (:facts result)))
        (is (= 2 (count (:facts result))))))))

(deftest delete-fact-test
  (testing "Deleting a fact"
    (with-redefs [fact/delete-fact (fn [uid] {:success true :uid uid})]
      (let [result (fact/delete-fact 12345)]
        (is (:success result))
        (is (= 12345 (:uid result)))))))

(deftest delete-facts-test
  (testing "Deleting multiple facts"
    (with-redefs [fact/delete-fact (fn [uid] {:success true :uid uid})]
      (let [test-uids [12345 12346 12347]
            result (fact/delete-facts test-uids)]
        (is (:success result))
        (is (= 3 (count (:results result))))))))

;; Test temporary UIDs handling
(deftest temporary-uids-test
  (testing "Handling temporary UIDs in create-fact"
    (with-redefs [fact/create-fact fact-helper/mock-create-fact]
      (let [test-fact {:lh_object_uid 50  ; Temporary UID (1-100)
                       :rh_object_uid 75  ; Temporary UID (1-100)
                       :rel_type_uid 1225
                       :rel_type_name "is classified as"}
            result (fact/create-fact test-fact)]

        ;; Check result
        (is (:success result))
        (is (not= 50 (get-in result [:fact :lh_object_uid])))
        (is (not= 75 (get-in result [:fact :rh_object_uid])))))))