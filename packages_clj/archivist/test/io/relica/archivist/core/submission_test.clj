(ns io.relica.archivist.core.submission-test
  (:require [clojure.test :refer [deftest testing is]]
            [io.relica.archivist.core.submission :as submission]
            [io.relica.archivist.core.gellish-base :as gellish-base]
            [io.relica.archivist.core.fact :as fact]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.common.services.cache-service :as cache]
            [io.relica.archivist.services.uid-service :as uid]))

;; Mock dependencies
(def mock-gellish-base (atom {}))
(def mock-fact (atom {}))
(def mock-graph-service (atom {}))
(def mock-cache-service (atom {}))
(def mock-uid-service (atom {}))

(defn setup-mocks []
  ;; Reset all mocks
  (reset! mock-gellish-base {})
  (reset! mock-fact {})
  (reset! mock-graph-service {})
  (reset! mock-cache-service {})
  (reset! mock-uid-service {})

  ;; Mock services
  (with-redefs [graph/graph-service mock-graph-service
                graph/exec-write-query (fn [_ query params]
                                         (swap! mock-graph-service assoc :last-query {:query query :params params})
                                         [{:r {:properties {:fact_uid 12345
                                                            :lh_object_uid (:lh_object_uid (:properties params))
                                                            :rh_object_uid (:rh_object_uid (:properties params))
                                                            :rel_type_uid (:rel_type_uid (:properties params))
                                                            :rel_type_name (:rel_type_name (:properties params))}}}])
                graph/exec-query (fn [_ query params]
                                   (swap! mock-graph-service assoc :last-query {:query query :params params})
                                   [])
                graph/transform-results identity

                cache/cache-service mock-cache-service
                cache/update-facts-involving-entity (fn [_ uid]
                                                      (swap! mock-cache-service update :updated-entities conj uid))
                cache/append-fact (fn [_ fact]
                                    (swap! mock-cache-service update :appended-facts conj fact))
                cache/clear-descendants (fn [_]
                                          (swap! mock-cache-service assoc :descendants-cleared true))

                uid/uid-service mock-uid-service
                uid/reserve-uid (fn [_ count]
                                  (let [start 10000]
                                    (vec (range start (+ start (or count 1))))))

                ;; Mock gellish-base functions
                gellish-base/update-fact-definition (fn [fact-uid partial-def full-def]
                                                      (swap! mock-gellish-base assoc :update-definition
                                                             {:fact-uid fact-uid
                                                              :partial-definition partial-def
                                                              :full-definition full-def})
                                                      {:fact-uid fact-uid
                                                       :partial-definition partial-def
                                                       :full-definition full-def})
                gellish-base/update-fact-collection (fn [fact-uid collection-uid collection-name]
                                                      (swap! mock-gellish-base assoc :update-collection
                                                             {:fact-uid fact-uid
                                                              :collection-uid collection-uid
                                                              :collection-name collection-name})
                                                      {:fact-uid fact-uid
                                                       :collection-uid collection-uid
                                                       :collection-name collection-name})
                gellish-base/update-fact-name (fn [fact-uid name]
                                                (swap! mock-gellish-base assoc :update-name
                                                       {:fact-uid fact-uid
                                                        :name name})
                                                {:fact-uid fact-uid
                                                 :name name})
                gellish-base/blanket-update-fact-name (fn [entity-uid name]
                                                        (swap! mock-gellish-base assoc :blanket-rename
                                                               {:entity-uid entity-uid
                                                                :name name})
                                                        {:entity-uid entity-uid
                                                         :name name
                                                         :updated-facts 5})

                ;; Mock fact functions - use the real implementation but with mocked dependencies
                fact/create-fact (fn [fact-data]
                                   (swap! mock-fact assoc :create-fact fact-data)
                                   {:success true
                                    :fact (assoc fact-data :fact_uid 12345)})])

  ;; Initialize mock cache service state
  (swap! mock-cache-service assoc
         :updated-entities #{}
         :appended-facts []))

(deftest update-definition-test
  (testing "Updating a fact definition"
    (setup-mocks)
    (let [test-data {:fact_uid 12345
                     :partial_definition "A partial definition"
                     :full_definition "A complete definition of the concept"}
          result (submission/update-definition test-data)]

      ;; Check result
      (is (:success result))
      (is (map? (:result result)))
      (is (= 12345 (get-in result [:result :fact-uid])))

      ;; Check mock calls
      (is (= 12345 (get-in @mock-gellish-base [:update-definition :fact-uid])))
      (is (= "A partial definition" (get-in @mock-gellish-base [:update-definition :partial-definition])))
      (is (= "A complete definition of the concept" (get-in @mock-gellish-base [:update-definition :full-definition]))))))

(deftest update-collection-test
  (testing "Updating a fact collection"
    (setup-mocks)
    (let [test-data {:fact_uid 12345
                     :collection_uid 5001
                     :collection_name "My Collection"}
          result (submission/update-collection test-data)]

      ;; Check result
      (is (:success result))
      (is (map? (:result result)))
      (is (= 12345 (get-in result [:result :fact-uid])))

      ;; Check mock calls
      (is (= 12345 (get-in @mock-gellish-base [:update-collection :fact-uid])))
      (is (= 5001 (get-in @mock-gellish-base [:update-collection :collection-uid])))
      (is (= "My Collection" (get-in @mock-gellish-base [:update-collection :collection-name]))))))

(deftest update-name-test
  (testing "Updating an entity name on a fact"
    (setup-mocks)
    (let [test-data {:fact_uid 12345
                     :name "New Entity Name"}
          result (submission/update-name test-data)]

      ;; Check result
      (is (:success result))
      (is (map? (:result result)))
      (is (= 12345 (get-in result [:result :fact-uid])))

      ;; Check mock calls
      (is (= 12345 (get-in @mock-gellish-base [:update-name :fact-uid])))
      (is (= "New Entity Name" (get-in @mock-gellish-base [:update-name :name]))))))

(deftest blanket-rename-test
  (testing "Updating entity name at every instance"
    (setup-mocks)
    (let [test-data {:entity_uid 12345
                     :name "New Entity Name"}
          result (submission/blanket-rename test-data)]

      ;; Check result
      (is (:success result))
      (is (map? (:result result)))
      (is (= 12345 (get-in result [:result :entity-uid])))

      ;; Check mock calls
      (is (= 12345 (get-in @mock-gellish-base [:blanket-rename :entity-uid])))
      (is (= "New Entity Name" (get-in @mock-gellish-base [:blanket-rename :name]))))))

(deftest add-synonym-test
  (testing "Adding a synonym to an entity"
    (setup-mocks)
    (let [test-data {:uid 12345
                     :synonym "Alternative Name"}
          result (submission/add-synonym test-data)]

      ;; Check result
      (is (:success result))
      (is (= 12345 (:uid result)))
      (is (= "Alternative Name" (:synonym result))))))

(deftest submit-date-test
  (testing "Creating a date entity"
    (setup-mocks)
    (let [test-data {:date_uid 12345
                     :collection_uid 5001
                     :collection_name "My Collection"}
          result (submission/submit-date test-data)]

      ;; Check result
      (is (:success result))
      (is (map? (:fact result)))

      ;; Check mock calls
      (is (= 12345 (get-in @mock-fact [:create-fact :lh_object_uid])))
      (is (= 550571 (get-in @mock-fact [:create-fact :rh_object_uid])))
      (is (= 1225 (get-in @mock-fact [:create-fact :rel_type_uid])))
      (is (= 5001 (get-in @mock-fact [:create-fact :collection_uid]))))))