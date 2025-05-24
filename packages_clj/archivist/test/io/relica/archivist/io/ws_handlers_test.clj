(ns io.relica.archivist.io.ws-handlers-test
  (:require [midje.sweet :refer :all]
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
(facts "about fact CRUD operations"
       (fact "create-fact handler should create a fact and update lineage cache"
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
               (count @(:responses response-handler)) => 1
               (get-in @(:responses response-handler) [0 :success]) => true
               (get-in @(:responses response-handler) [0 :data :fact]) => (contains {:lh_object_uid 1001})

               ;; Check that lineage was calculated
               (get @mock-linearization :calculate-lineage) => 1001

               ;; Check that descendants were cleared
               (get @mock-cache :descendants-cleared) => true))

       (fact "update-fact handler should update a fact"
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
               (count @(:responses response-handler)) => 1
               (get-in @(:responses response-handler) [0 :success]) => true
               (get-in @(:responses response-handler) [0 :data :fact]) => (contains {:fact_uid 12345})))

       (fact "delete-fact handler should delete a fact"
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
               (count @(:responses response-handler)) => 1
               (get-in @(:responses response-handler) [0 :success]) => true
               (get-in @(:responses response-handler) [0 :data :result]) => "success"
               (get-in @(:responses response-handler) [0 :data :uid]) => 12345))

       (fact "batch-create handler should create multiple facts and update lineage cache"
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
               (count @(:responses response-handler)) => 1
               (get-in @(:responses response-handler) [0 :success]) => true
               (count (get-in @(:responses response-handler) [0 :data :facts])) => 2

               ;; Check that lineage was calculated for both facts
               (get @mock-linearization :calculate-lineage) => 1002  ; Last one processed

               ;; Check that descendants were cleared
               (get @mock-cache :descendants-cleared) => true))

       (fact "batch-delete handler should delete multiple facts"
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
               (count @(:responses response-handler)) => 1
               (get-in @(:responses response-handler) [0 :success]) => true
               (get-in @(:responses response-handler) [0 :data :result]) => "success"
               (count (get-in @(:responses response-handler) [0 :data :uids])) => 3)))

;; Test submission operations
(facts "about submission operations"
       (fact "update-definition handler should update a fact definition"
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
               (count @(:responses response-handler)) => 1
               (get-in @(:responses response-handler) [0 :success]) => true
               (get-in @(:responses response-handler) [0 :data :result :fact-uid]) => 12345))

       (fact "update-collection handler should update a fact collection"
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
               (count @(:responses response-handler)) => 1
               (get-in @(:responses response-handler) [0 :success]) => true
               (get-in @(:responses response-handler) [0 :data :result :fact-uid]) => 12345))

       (fact "update-name handler should update an entity name on a fact"
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
               (count @(:responses response-handler)) => 1
               (get-in @(:responses response-handler) [0 :success]) => true
               (get-in @(:responses response-handler) [0 :data :result :fact-uid]) => 12345))

       (fact "blanket-rename handler should update entity name at every instance"
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
               (count @(:responses response-handler)) => 1
               (get-in @(:responses response-handler) [0 :success]) => true
               (get-in @(:responses response-handler) [0 :data :result :entity-uid]) => 12345))

       (fact "add-synonym handler should add a synonym to an entity"
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
               (count @(:responses response-handler)) => 1
               (get-in @(:responses response-handler) [0 :success]) => true
               (get-in @(:responses response-handler) [0 :data :uid]) => 12345
               (get-in @(:responses response-handler) [0 :data :synonym]) => "Alternative Name"))

       (fact "create-date handler should create a date entity"
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
               (count @(:responses response-handler)) => 1
               (get-in @(:responses response-handler) [0 :success]) => true
               (get-in @(:responses response-handler) [0 :data :fact :fact_uid]) => 12345)))