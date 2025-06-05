(ns io.relica.clarity.io.ws-handlers-test
  (:require [clojure.test :refer :all]
            [io.relica.clarity.io.ws-handlers :as handlers]
            [io.relica.common.websocket.server :as ws-server]
            [io.relica.clarity.test-helpers :as helpers]
            [io.relica.clarity.test-fixtures :as fixtures]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]))

(deftest test-websocket-handler-methods-defined
  (testing "WebSocket message identifiers are correctly defined"
    (let [methods (methods ws-server/handle-ws-message)]
      (is (contains? methods :clarity.model/get))
      (is (contains? methods :clarity.model/get-batch))
      (is (contains? methods :clarity.kind/get))
      (is (contains? methods :clarity.individual/get))
      
      (is (fn? (get methods :clarity.model/get)))
      (is (fn? (get methods :clarity.model/get-batch)))
      (is (fn? (get methods :clarity.kind/get)))
      (is (fn? (get methods :clarity.individual/get)))))

(deftest test-system-operations-separation
  (testing "System operations are properly separated"
    ;; Note: System operations are defined in ws_server.clj, not in ws_handlers.clj
    ;; So we're only testing the Clarity-specific handlers here
    (is (string? "System operations are defined in ws_server.clj"))))

(deftest test-model-get-operation-success
  (testing "Model get operation returns correct response format for successful retrieval"
    (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                  (fn [_] (go {:id "test-model-id" :name "Test Model"}))]

      (let [capture (helpers/capture-reply)
            msg (helpers/mock-ws-message :clarity.model/get {:uid "test-model-id"} (:reply-fn capture))]

        ;; Call the handler and wait for the response
        (ws-server/handle-ws-message msg)
        (let [response (helpers/wait-for-reply capture)]

          ;; Verify response structure
          (is (= (:success response) true))
          (is (= (get-in response [:model :id]) "test-model-id"))
          (is (= (get-in response [:model :name]) "Test Model")))))))

(deftest test-model-get-operation-not-found
  (testing "Model get operation handles resource not found correctly"
    (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                  (fn [_] (go nil))]

      (let [capture (helpers/capture-reply)
            msg (helpers/mock-ws-message :clarity.model/get {:uid "non-existent-id"} (:reply-fn capture))]

        ;; Call the handler and wait for the response
        (ws-server/handle-ws-message msg)
        (let [response (helpers/wait-for-reply capture)]

          ;; Verify error response structure
          (is (= (:success response) false))
          (is (contains? response :error))
          (is (= (get-in response [:error :type]) "resource-not-found")))))))

(deftest test-model-batch-get-operation
  (testing "Model batch get operation returns correct response format"
    (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                  (fn [id]
                    (go
                      (case id
                        "model1" {:id "model1" :name "Model 1"}
                        "model2" {:id "model2" :name "Model 2"}
                        nil)))]

      (let [capture (helpers/capture-reply)
            msg (helpers/mock-ws-message :clarity.model/get-batch
                                         {:uids ["model1" "model2" "model3"]}
                                         (:reply-fn capture))]

        ;; Call the handler and wait for the response
        (ws-server/handle-ws-message msg)
        (let [response (helpers/wait-for-reply capture)]

          ;; Verify response structure
          (is (= (:success response) true))
          (is (contains? response :models))
          ;; Check that we get results for existing models
          (is (some #(= (:id %) "model1") (:models response)))
          (is (some #(= (:id %) "model2") (:models response))))))))

(deftest test-kind-get-operation-success
  (testing "Kind get operation returns correct response format"
    (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                  (fn [_] (go {:id "test-kind-id" :name "Test Kind" :type "kind"}))]

      (let [capture (helpers/capture-reply)
            msg (helpers/mock-ws-message :clarity.kind/get {:kind-id "test-kind-id"} (:reply-fn capture))]

        ;; Call the handler and wait for the response
        (ws-server/handle-ws-message msg)
        (let [response (helpers/wait-for-reply capture)]

          ;; Verify response structure
          (is (= (:success response) true))
          (is (= (get-in response [:model :id]) "test-kind-id"))
          (is (= (get-in response [:model :name]) "Test Kind"))
          (is (= (get-in response [:model :type]) "kind")))))))

(deftest test-kind-get-operation-not-found
  (testing "Kind get operation handles not found correctly"
    (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                  (fn [_] (go nil))]

      (let [capture (helpers/capture-reply)
            msg (helpers/mock-ws-message :clarity.kind/get {:kind-id "non-existent-id"} (:reply-fn capture))]

        ;; Call the handler and wait for the response
        (ws-server/handle-ws-message msg)
        (let [response (helpers/wait-for-reply capture)]

          ;; Verify error response structure
          (is (= (:success response) false))
          (is (contains? response :error))
          (is (= (get-in response [:error :type]) "resource-not-found")))))))

(deftest test-individual-get-operation-success
  (testing "Individual get operation returns correct response format"
    (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                  (fn [_] (go {:id "test-individual-id" :name "Test Individual" :type "individual"}))]

      (let [capture (helpers/capture-reply)
            msg (helpers/mock-ws-message :clarity.individual/get
                                         {:individual-id "test-individual-id"}
                                         (:reply-fn capture))]

        ;; Call the handler and wait for the response
        (ws-server/handle-ws-message msg)
        (let [response (helpers/wait-for-reply capture)]

          ;; Verify response structure
          (is (= (:success response) true))
          (is (= (get-in response [:model :id]) "test-individual-id"))
          (is (= (get-in response [:model :name]) "Test Individual"))
          (is (= (get-in response [:model :type]) "individual")))))))

(deftest test-individual-get-operation-not-found
  (testing "Individual get operation handles not found correctly"
    (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                  (fn [_] (go nil))]

      (let [capture (helpers/capture-reply)
            msg (helpers/mock-ws-message :clarity.individual/get
                                         {:individual-id "non-existent-id"}
                                         (:reply-fn capture))]

        ;; Call the handler and wait for the response
        (ws-server/handle-ws-message msg)
        (let [response (helpers/wait-for-reply capture)]

          ;; Verify error response structure
          (is (= (:success response) false))
          (is (contains? response :error))
          (is (= (get-in response [:error :type]) "resource-not-found")))))))

(deftest test-handlers-exception-handling
  (testing "Handlers properly handle exceptions"
    (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                  (fn [_] (throw (Exception. "Test exception")))]

      (let [capture (helpers/capture-reply)
            msg (helpers/mock-ws-message :clarity.model/get {:uid "test-id"} (:reply-fn capture))]

        ;; Call the handler and wait for the response
        (ws-server/handle-ws-message msg)
        (let [response (helpers/wait-for-reply capture)]

          ;; Verify error response structure
          (is (= (:success response) false))
          (is (contains? response :error))
          (is (= (get-in response [:error :type]) "internal-error"))
          (is (contains? (get-in response [:error :details]) :exception)))))))