(ns io.relica.archivist.core.submission-test
  (:require [clojure.test :refer [deftest testing is use-fixtures]]
            [io.relica.archivist.core.submission :as submission]
            [io.relica.archivist.core.gellish-base :as gellish-base]
            [io.relica.archivist.core.fact :as fact]
            [io.relica.archivist.test-fixtures :as fixtures]))

;; Use the mock services fixture for all tests
(use-fixtures :each fixtures/with-mock-services)

;; Mock tracking atoms
(def mock-gellish-base (atom {}))
(def mock-fact (atom {}))

(defn setup-submission-mocks []
  ;; Reset tracking atoms
  (reset! mock-gellish-base {})
  (reset! mock-fact {})
  
  ;; Mock gellish-base functions
  (with-redefs [gellish-base/update-fact-definition (fn [fact-uid partial-definition full-definition]
                                                      (swap! mock-gellish-base assoc :update-definition
                                                             {:fact-uid fact-uid
                                                              :partial-definition partial-definition
                                                              :full-definition full-definition})
                                                      {:fact-uid fact-uid})
                gellish-base/update-fact-collection (fn [fact-uid collection-uid collection-name]
                                                     (swap! mock-gellish-base assoc :update-collection
                                                            {:fact-uid fact-uid
                                                             :collection-uid collection-uid
                                                             :collection-name collection-name})
                                                     {:fact-uid fact-uid})
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
                fact/create-fact (fn [fact-data]
                                  (swap! mock-fact assoc :create-fact fact-data)
                                  {:success true
                                   :fact (assoc fact-data :fact_uid 12345)})]))

(deftest update-definition-test
  (testing "Updating a fact definition"
    (setup-submission-mocks)
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
    (setup-submission-mocks)
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
    (setup-submission-mocks)
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
    (setup-submission-mocks)
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
    (setup-submission-mocks)
    (let [test-data {:uid 12345
                     :synonym "Alternative Name"}
          result (submission/add-synonym test-data)]

      ;; Check result
      (is (:success result))
      (is (= 12345 (:uid result)))
      (is (= "Alternative Name" (:synonym result)))

      ;; Check fact creation
      (is (= 5117 (get-in @mock-fact [:create-fact :rel_type_uid]))) ; 5117 is "is also called"
      (is (= 12345 (get-in @mock-fact [:create-fact :lh_object_uid])))
      (is (nil? (get-in @mock-fact [:create-fact :rh_object_uid]))))))

(deftest submit-date-test
  (testing "Submitting a date entity"
    (setup-submission-mocks)
    (let [test-data {:date_uid 12345
                     :collection_uid 5001
                     :collection_name "Date Collection"}
          result (submission/submit-date test-data)]

      ;; Check result
      (is (:success result))
      (is (map? (:fact result)))

      ;; Check fact creation
      (is (= 1726 (get-in @mock-fact [:create-fact :rel_type_uid]))) ; 1726 is the date relation type
      (is (= 12345 (get-in @mock-fact [:create-fact :lh_object_uid])))
      (is (= 5001 (get-in @mock-fact [:create-fact :rh_object_uid]))))))