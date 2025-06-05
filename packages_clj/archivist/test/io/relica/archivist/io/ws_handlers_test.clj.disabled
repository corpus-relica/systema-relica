(ns io.relica.archivist.io.ws-handlers-test
  (:require [clojure.test :refer [deftest testing is]]
            [clojure.core.async :as async :refer [<! >! go chan]]
            [io.relica.archivist.utils.response :as response]
            [io.relica.archivist.test-helpers :as helpers]
            [io.relica.archivist.core.fact :as fact]
            [io.relica.archivist.core.submission :as submission]
            [io.relica.archivist.core.linearization :as linearization]
            [io.relica.common.services.cache-service :as cache]
            [io.relica.archivist.io.ws-handlers :as ws-handlers]))

;; Mock dependencies
(def mock-fact (atom {}))
(def mock-submission (atom {}))
(def mock-linearization (atom {}))
(def mock-cache (atom {}))

(defn setup-mocks []
  (reset! mock-fact {})
  (reset! mock-submission {})
  (reset! mock-linearization {})
  (reset! mock-cache {})

  (with-redefs [fact/create-fact (fn [data]
                                   (swap! mock-fact assoc :create-fact data)
                                   {:success true
                                    :fact (assoc data :fact_uid 12345)})
                fact/update-fact (fn [data]
                                   (swap! mock-fact assoc :update-fact data)
                                   {:success true
                                    :fact (assoc data :fact_uid 12345)})
                fact/delete-fact (fn [uid]
                                   (swap! mock-fact assoc :delete-fact uid)
                                   {:success true
                                    :uid uid})
                fact/create-facts (fn [data]
                                    (swap! mock-fact assoc :create-facts data)
                                    {:success true
                                     :facts (map #(assoc % :fact_uid 12345) data)})
                fact/delete-facts (fn [uids]
                                    (swap! mock-fact assoc :delete-facts uids)
                                    {:success true
                                     :results (map #(hash-map :success true :uid %) uids)})

                submission/update-definition (fn [data]
                                               (swap! mock-submission assoc :update-definition data)
                                               {:success true
                                                :result {:fact-uid (:fact_uid data)
                                                         :partial-definition (:partial_definition data)
                                                         :full-definition (:full_definition data)}})
                submission/update-collection (fn [data]
                                               (swap! mock-submission assoc :update-collection data)
                                               {:success true
                                                :result {:fact-uid (:fact_uid data)
                                                         :collection-uid (:collection_uid data)
                                                         :collection-name (:collection_name data)}})
                submission/update-name (fn [data]
                                         (swap! mock-submission assoc :update-name data)
                                         {:success true
                                          :result {:fact-uid (:fact_uid data)
                                                   :name (:name data)}})
                submission/blanket-rename (fn [data]
                                            (swap! mock-submission assoc :blanket-rename data)
                                            {:success true
                                             :result {:entity-uid (:entity_uid data)
                                                      :name (:name data)
                                                      :updated-facts 5}})
                submission/add-synonym (fn [data]
                                         (swap! mock-submission assoc :add-synonym data)
                                         {:success true
                                          :uid (:uid data)
                                          :synonym (:synonym data)})
                submission/submit-date (fn [data]
                                         (swap! mock-submission assoc :submit-date data)
                                         {:success true
                                          :fact {:fact_uid 12345
                                                 :lh_object_uid (:date_uid data)
                                                 :lh_object_name (str (:date_uid data))
                                                 :rel_type_uid 1225
                                                 :rel_type_name "is classified as"
                                                 :rh_object_uid 550571
                                                 :rh_object_name "date"
                                                 :collection_uid (:collection_uid data)
                                                 :collection_name (:collection_name data)}})

                linearization/calculate-lineage (fn [uid]
                                                  (swap! mock-linearization assoc :calculate-lineage uid)
                                                  (go [uid]))

                cache/cache-service mock-cache
                cache/clear-descendants (fn [_]
                                          (swap! mock-cache assoc :descendants-cleared true))]))

;; Helper function to create a mock response handler
(defn mock-response-handler []
  (let [responses (atom [])]
    {:responses responses
     :handler (fn [response]
                (swap! responses conj response))}))

;; Test fact CRUD operations
(deftest fact-crud-operations-test
  (testing "create-fact handler should create a fact and update lineage cache"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {:lh_object_uid 1001
                     :rh_object_uid 2001
                     :rel_type_uid 1225
                     :rel_type_name "is classified as"}
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.fact/create)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check responses
      (is (= 1 (count @(:responses response-handler))))
      (is (true? (get-in @(:responses response-handler) [0 :success])))
      (is (contains? (get-in @(:responses response-handler) [0 :data :fact]) :lh_object_uid))
      (is (= 1001 (get-in @(:responses response-handler) [0 :data :fact :lh_object_uid])))

      ;; Check that lineage was calculated
      (is (= 1001 (get @mock-linearization :calculate-lineage)))

      ;; Check that descendants were cleared
      (is (true? (get @mock-cache :descendants-cleared)))))

  (testing "create-fact handler should handle database errors gracefully"
    (setup-mocks)
    (with-redefs [fact/create-fact (fn [_] (throw (ex-info "Database connection failed" {})))]
      (let [response-handler (mock-response-handler)
            test-data {:lh_object_uid 1001
                       :rh_object_uid 2001
                       :rel_type_uid 1225}
            handler (response/with-standard-response
                      (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                           :archivist.fact/create)))]

        ;; Call the handler
        (handler {:?data test-data
                  :?reply-fn (:handler response-handler)})

        ;; Check error response
        (is (= 1 (count @(:responses response-handler))))
        (is (false? (get-in @(:responses response-handler) [0 :success])))
        (is (= "database-error" (get-in @(:responses response-handler) [0 :error :type]))))))

  (testing "create-fact handler should handle missing required fields"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {:lh_object_uid 1001
                     ;; Missing rh_object_uid and rel_type_uid
                     :rel_type_name "is classified as"}
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.fact/create)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Should still process but may fail at business logic level
      (is (= 1 (count @(:responses response-handler))))))

  (testing "create-fact handler should handle failed fact creation"
    (setup-mocks)
    (with-redefs [fact/create-fact (fn [_] {:success false
                                            :message "Validation failed"
                                            :details {:field "lh_object_uid"}})]
      (let [response-handler (mock-response-handler)
            test-data {:lh_object_uid 1001
                       :rh_object_uid 2001
                       :rel_type_uid 1225}
            handler (response/with-standard-response
                      (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                           :archivist.fact/create)))]

        ;; Call the handler
        (handler {:?data test-data
                  :?reply-fn (:handler response-handler)})

        ;; Check error response
        (is (= 1 (count @(:responses response-handler))))
        (is (false? (get-in @(:responses response-handler) [0 :success])))
        (is (= "database-error" (get-in @(:responses response-handler) [0 :error :type]))))))

  (testing "update-fact handler should update a fact"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {:fact_uid 12345
                     :lh_object_uid 1001
                     :rh_object_uid 2001
                     :rel_type_uid 1225
                     :rel_type_name "is classified as"
                     :updated_field "new value"}
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.fact/update)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check responses
      (is (= 1 (count @(:responses response-handler))))
      (is (true? (get-in @(:responses response-handler) [0 :success])))
      (is (contains? (get-in @(:responses response-handler) [0 :data :fact]) :fact_uid))
      (is (= 12345 (get-in @(:responses response-handler) [0 :data :fact :fact_uid])))))

  (testing "delete-fact handler should delete a fact"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {:uid 12345}
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.fact/delete)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check responses
      (is (= 1 (count @(:responses response-handler))))
      (is (true? (get-in @(:responses response-handler) [0 :success])))
      (is (= "success" (get-in @(:responses response-handler) [0 :data :result])))
      (is (= 12345 (get-in @(:responses response-handler) [0 :data :uid])))))

  (testing "batch-create handler should create multiple facts and update lineage cache"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data [{:lh_object_uid 1001
                      :rh_object_uid 2001
                      :rel_type_uid 1225
                      :rel_type_name "is classified as"}
                     {:lh_object_uid 1002
                      :rh_object_uid 2002
                      :rel_type_uid 1226
                      :rel_type_name "is part of"}]
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.fact/batch-create)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check responses
      (is (= 1 (count @(:responses response-handler))))
      (is (true? (get-in @(:responses response-handler) [0 :success])))
      (is (= 2 (count (get-in @(:responses response-handler) [0 :data :facts]))))

      ;; Check that lineage was calculated for both facts
      (is (= 1002 (get @mock-linearization :calculate-lineage))) ; Last one processed

      ;; Check that descendants were cleared
      (is (true? (get @mock-cache :descendants-cleared)))))

  (testing "batch-delete handler should delete multiple facts"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {:uids [12345 12346 12347]}
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.fact/batch-delete)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check responses
      (is (= 1 (count @(:responses response-handler))))
      (is (true? (get-in @(:responses response-handler) [0 :success])))
      (is (= "success" (get-in @(:responses response-handler) [0 :data :result])))
      (is (= 3 (count (get-in @(:responses response-handler) [0 :data :uids])))))))

;; Test submission operations
(deftest submission-operations-test
  (testing "update-definition handler should update a fact definition"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {:fact_uid 12345
                     :partial_definition "A partial definition"
                     :full_definition "A complete definition of the concept"}
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.submission/update-definition)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check responses
      (is (= 1 (count @(:responses response-handler))))
      (is (true? (get-in @(:responses response-handler) [0 :success])))
      (is (= 12345 (get-in @(:responses response-handler) [0 :data :result :fact-uid])))))

  (testing "update-collection handler should update a fact collection"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {:fact_uid 12345
                     :collection_uid 5001
                     :collection_name "My Collection"}
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.submission/update-collection)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check responses
      (is (= 1 (count @(:responses response-handler))))
      (is (true? (get-in @(:responses response-handler) [0 :success])))
      (is (= 12345 (get-in @(:responses response-handler) [0 :data :result :fact-uid])))))

  (testing "update-name handler should update an entity name on a fact"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {:fact_uid 12345
                     :name "New Entity Name"}
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.submission/update-name)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check responses
      (is (= 1 (count @(:responses response-handler))))
      (is (true? (get-in @(:responses response-handler) [0 :success])))
      (is (= 12345 (get-in @(:responses response-handler) [0 :data :result :fact-uid])))))

  (testing "blanket-rename handler should update entity name at every instance"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {:entity_uid 12345
                     :name "New Entity Name"}
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.submission/blanket-rename)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check responses
      (is (= 1 (count @(:responses response-handler))))
      (is (true? (get-in @(:responses response-handler) [0 :success])))
      (is (= 12345 (get-in @(:responses response-handler) [0 :data :result :entity-uid])))))

  (testing "add-synonym handler should add a synonym to an entity"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {:uid 12345
                     :synonym "Alternative Name"}
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.submission/add-synonym)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check responses
      (is (= 1 (count @(:responses response-handler))))
      (is (true? (get-in @(:responses response-handler) [0 :success])))
      (is (= 12345 (get-in @(:responses response-handler) [0 :data :uid])))
      (is (= "Alternative Name" (get-in @(:responses response-handler) [0 :data :synonym])))))

  (testing "create-date handler should create a date entity"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {:date_uid 12345
                     :collection_uid 5001
                     :collection_name "My Collection"}
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.submission/create-date)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check responses
      (is (= 1 (count @(:responses response-handler))))
      (is (true? (get-in @(:responses response-handler) [0 :success])))
      (is (= 12345 (get-in @(:responses response-handler) [0 :data :fact :fact_uid]))))))

;; Test additional WebSocket handlers for better coverage
(deftest additional-websocket-handlers-test
  (testing "graph/execute-query handler should execute queries successfully"
    (setup-mocks)
    (with-redefs [graph/exec-query (fn [_ query params]
                                     (go {:results [{:uid 1001 :name "Test Entity"}]
                                          :total 1}))]
      (let [response-handler (mock-response-handler)
            test-data {:query "MATCH (n) RETURN n LIMIT 1"
                       :params {}}
            handler (response/with-standard-response
                      (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                           :archivist.graph/execute-query)))]

        ;; Call the handler
        (handler {:?data test-data
                  :?reply-fn (:handler response-handler)})

        ;; Check responses
        (is (= 1 (count @(:responses response-handler))))
        (is (true? (get-in @(:responses response-handler) [0 :success])))
        (is (contains? (first (get-in @(:responses response-handler) [0 :data :results])) :uid))
        (is (= 1001 (:uid (first (get-in @(:responses response-handler) [0 :data :results]))))))))

  (testing "graph/execute-query handler should handle query failures"
    (setup-mocks)
    (with-redefs [graph/exec-query (fn [_ _ _]
                                     (throw (ex-info "Invalid Cypher syntax" {})))]
      (let [response-handler (mock-response-handler)
            test-data {:query "INVALID QUERY SYNTAX"
                       :params {}}
            handler (response/with-standard-response
                      (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                           :archivist.graph/execute-query)))]

        ;; Call the handler
        (handler {:?data test-data
                  :?reply-fn (:handler response-handler)})

        ;; Check error response
        (is (= 1 (count @(:responses response-handler))))
        (is (false? (get-in @(:responses response-handler) [0 :success])))
        (is (= "query-execution-failed" (get-in @(:responses response-handler) [0 :error :type]))))))

  (testing "entity/type-get handler should return entity type"
    (setup-mocks)
    (with-redefs [entity/get-entity-type (fn [uid]
                                           (go {:type "individual" :uid uid}))]
      (let [response-handler (mock-response-handler)
            test-data {:uid 1001}
            handler (response/with-standard-response
                      (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                           :archivist.entity/type-get)))]

        ;; Call the handler
        (handler {:?data test-data
                  :?reply-fn (:handler response-handler)})

        ;; Check responses
        (is (= 1 (count @(:responses response-handler))))
        (is (true? (get-in @(:responses response-handler) [0 :success])))
        (is (= "individual" (get-in @(:responses response-handler) [0 :data :type :type]))))))

  (testing "entity/type-get handler should handle non-existent entities"
    (setup-mocks)
    (with-redefs [entity/get-entity-type (fn [_] (go nil))]
      (let [response-handler (mock-response-handler)
            test-data {:uid 99999999}
            handler (response/with-standard-response
                      (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                           :archivist.entity/type-get)))]

        ;; Call the handler
        (handler {:?data test-data
                  :?reply-fn (:handler response-handler)})

        ;; Check error response
        (is (= 1 (count @(:responses response-handler))))
        (is (false? (get-in @(:responses response-handler) [0 :success])))
        (is (= "resource-not-found" (get-in @(:responses response-handler) [0 :error :type]))))))

  (testing "lineage/get handler should handle missing UID field"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {} ; Missing :uid field
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.lineage/get)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check error response
      (is (= 1 (count @(:responses response-handler))))
      (is (false? (get-in @(:responses response-handler) [0 :success])))
      (is (= "missing-required-field" (get-in @(:responses response-handler) [0 :error :type])))
      (is (= "uid" (get-in @(:responses response-handler) [0 :error :details :field])))))

  (testing "fact/delete handler should handle missing UID field"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {} ; Missing :uid field
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.fact/delete)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check error response
      (is (= 1 (count @(:responses response-handler))))
      (is (false? (get-in @(:responses response-handler) [0 :success])))
      (is (= "missing-required-field" (get-in @(:responses response-handler) [0 :error :type])))
      (is (= "uid" (get-in @(:responses response-handler) [0 :error :details :field])))))

  (testing "fact/batch-delete handler should handle missing UIDs field"
    (setup-mocks)
    (let [response-handler (mock-response-handler)
          test-data {} ; Missing :uids field
          handler (response/with-standard-response
                    (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                         :archivist.fact/batch-delete)))]

      ;; Call the handler
      (handler {:?data test-data
                :?reply-fn (:handler response-handler)})

      ;; Check error response
      (is (= 1 (count @(:responses response-handler))))
      (is (false? (get-in @(:responses response-handler) [0 :success])))
      (is (= "missing-required-field" (get-in @(:responses response-handler) [0 :error :type])))
      (is (= "uids" (get-in @(:responses response-handler) [0 :error :details :field]))))))

;; Test search operations
(deftest search-operations-test
  (testing "search/text handler should execute text searches"
    (setup-mocks)
    (with-redefs [general-search/get-text-search (fn [term coll page size filter exact]
                                                   (go {:results [{:uid 1001 :name "Test Result"}]
                                                        :total 1
                                                        :page page
                                                        :page-size size}))]
      (let [response-handler (mock-response-handler)
            test-data {:searchTerm "test"
                       :collectionUID 5001
                       :page 1
                       :pageSize 10
                       :exactMatch false}
            handler (response/with-standard-response
                      (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                           :archivist.search/text)))]

        ;; Call the handler
        (handler {:?data test-data
                  :?reply-fn (:handler response-handler)})

        ;; Check responses
        (is (= 1 (count @(:responses response-handler))))
        (is (true? (get-in @(:responses response-handler) [0 :success])))
        (is (= 1 (get-in @(:responses response-handler) [0 :data :results :total]))))))

  (testing "search/uid handler should execute UID searches with string conversion"
    (setup-mocks)
    (with-redefs [general-search/get-uid-search (fn [uid coll page size filter]
                                                  (go {:results [{:uid uid :name "Found Entity"}]
                                                       :total 1}))]
      (let [response-handler (mock-response-handler)
            test-data {:searchUID "1001" ; String UID that should be converted
                       :collectionUID 5001
                       :page 1
                       :pageSize 10}
            handler (response/with-standard-response
                      (var-get (ns-resolve 'io.relica.archivist.io.ws-handlers
                                           :archivist.search/uid)))]

        ;; Call the handler
        (handler {:?data test-data
                  :?reply-fn (:handler response-handler)})

        ;; Check responses
        (is (= 1 (count @(:responses response-handler))))
        (is (true? (get-in @(:responses response-handler) [0 :success])))
        (is (= 1 (get-in @(:responses response-handler) [0 :data :results :total])))))))