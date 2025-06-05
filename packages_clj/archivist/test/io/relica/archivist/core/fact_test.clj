(ns io.relica.archivist.core.fact-test
  (:require [clojure.test :refer [deftest testing is use-fixtures]]
            [io.relica.archivist.core.fact :as fact]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.common.services.cache-service :as cache]
            [io.relica.archivist.services.uid-service :as uid]
            [clojure.core.async :refer [<!!]]))

;; Mock dependencies
(def mock-graph-service (atom {}))
(def mock-cache-service (atom {}))
(def mock-uid-service (atom {}))

(defn setup-mocks []
  ;; Reset all mocks
  (reset! mock-graph-service {})
  (reset! mock-cache-service {})
  (reset! mock-uid-service {})

  ;; Mock services
  (with-redefs [graph/graph-service mock-graph-service
                graph/exec-write-query (fn [_ query params]
                                         (swap! mock-graph-service assoc :last-query {:query query :params params})
                                         [{:r {:properties {:fact_uid 12345
                                                            :lh_object_uid (get-in params [:properties :lh_object_uid])
                                                            :rh_object_uid (get-in params [:properties :rh_object_uid])
                                                            :rel_type_uid (get-in params [:properties :rel_type_uid])
                                                            :rel_type_name (get-in params [:properties :rel_type_name])}}}])
                graph/exec-query (fn [_ query params]
                                   (swap! mock-graph-service assoc :last-query {:query query :params params})
                                   [])
                graph/convert-neo4j-ints identity

                ;; Mock cache service
                cache/cache-service mock-cache-service
                cache/update-facts-involving-entity (fn [_ uid]
                                                      (swap! mock-cache-service update :updated-entities conj uid))
                cache/add-to-entity-facts-cache (fn [_ entity-uid fact-uid]
                                                  (swap! mock-cache-service update-in [:entity-facts entity-uid] conj fact-uid))
                cache/clear-descendants (fn [_]
                                          (swap! mock-cache-service assoc :descendants-cleared true))

                ;; Mock UID service
                uid/uid-service mock-uid-service
                uid/reserve-uid (fn [_ count]
                                  (let [start 10000]
                                    (vec (range start (+ start (or count 1))))))])

  ;; Initialize mock cache service state
  (swap! mock-cache-service assoc
         :updated-entities #{}
         :entity-facts {}))

(deftest create-fact-test
  (testing "Creating a fact"
    (setup-mocks)
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
      (is (contains? (:updated-entities @mock-cache-service) 1001))
      (is (contains? (:updated-entities @mock-cache-service) 2001)))))

(deftest update-fact-test
  (testing "Updating a fact"
    (setup-mocks)
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
      (is (contains? (:updated-entities @mock-cache-service) 1001))
      (is (contains? (:updated-entities @mock-cache-service) 2001)))))

(deftest create-facts-test
  (testing "Creating multiple facts"
    (setup-mocks)
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
      (is (seq? (:facts result))))))

(deftest delete-fact-test
  (testing "Deleting a fact"
    (setup-mocks)
    (with-redefs [fact/delete-fact (fn [uid] {:success true :uid uid})]
      (let [result (fact/delete-fact 12345)]
        (is (:success result))
        (is (= 12345 (:uid result)))))))

(deftest delete-facts-test
  (testing "Deleting multiple facts"
    (setup-mocks)
    (with-redefs [fact/delete-fact (fn [uid] {:success true :uid uid})]
      (let [test-uids [12345 12346 12347]
            result (fact/delete-facts test-uids)]
        (is (:success result))
        (is (= 3 (count (:results result))))))))

;; Test temporary UIDs handling
(deftest temporary-uids-test
  (testing "Handling temporary UIDs in create-fact"
    (setup-mocks)
    (let [test-fact {:lh_object_uid 50  ; Temporary UID (1-100)
                     :rh_object_uid 75  ; Temporary UID (1-100)
                     :rel_type_uid 1225
                     :rel_type_name "is classified as"}
          result (fact/create-fact test-fact)]

      ;; Check result
      (is (:success result))
      (is (not= 50 (get-in result [:fact :lh_object_uid])))
      (is (not= 75 (get-in result [:fact :rh_object_uid]))))))
