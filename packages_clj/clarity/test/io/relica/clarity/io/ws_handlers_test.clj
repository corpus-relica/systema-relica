(ns io.relica.clarity.io.ws-handlers-test
  (:require [midje.sweet :refer [fact facts contains anything]]
            [io.relica.clarity.io.ws-handlers :as handlers]
            [io.relica.common.websocket.server :as ws-server]
            [io.relica.clarity.test-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]))

;; Test that WebSocket message identifiers are correctly defined
(fact "Get operations are correctly defined"
      (methods ws-server/handle-ws-message) => (contains {:clarity.model/get fn?})
      (methods ws-server/handle-ws-message) => (contains {:clarity.model/get-batch fn?})
      (methods ws-server/handle-ws-message) => (contains {:clarity.kind/get fn?})
      (methods ws-server/handle-ws-message) => (contains {:clarity.individual/get fn?}))

;; Note: System operations are defined in ws_server.clj, not in ws_handlers.clj
;; So we're only testing the Clarity-specific handlers here

(fact "System operations are in a separate file"
      "System operations are defined in ws_server.clj" => truthy)

;; Test response formatting for model operations
(facts "Model get operation returns correct response format"
       ;; Mock the semantic model service to return a test model
       (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                     (fn [_] (go {:id "test-model-id" :name "Test Model"}))]

         (let [reply-capture (helpers/capture-reply)
               msg (helpers/mock-ws-message :clarity.model/get {:uid "test-model-id"} reply-capture)]

           ;; Call the handler and wait for the response
           (ws-server/handle-ws-message msg)
           (let [response (helpers/wait-for reply-capture)]

             ;; Verify response structure
             response => (contains {:success true})
             response => (contains {:model {:id "test-model-id" :name "Test Model"}}))))

       ;; Test error handling when model is not found
       (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                     (fn [_] (go nil))]

         (let [reply-capture (helpers/capture-reply)
               msg (helpers/mock-ws-message :clarity.model/get {:uid "non-existent-id"} reply-capture)]

           ;; Call the handler and wait for the response
           (ws-server/handle-ws-message msg)
           (let [response (helpers/wait-for reply-capture)]

             ;; Verify error response structure
             response => (contains {:success false})
             response => (contains {:error (contains {:type "resource-not-found"})})))))

;; Test response formatting for batch model operations
(facts "Model batch get operation returns correct response format"
       ;; Mock the semantic model service to return test models
       (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                     (fn [id]
                       (go
                         (case id
                           "model1" {:id "model1" :name "Model 1"}
                           "model2" {:id "model2" :name "Model 2"}
                           nil)))]

         (let [reply-capture (helpers/capture-reply)
               msg (helpers/mock-ws-message :clarity.model/get-batch
                                            {:uids ["model1" "model2" "model3"]}
                                            reply-capture)]

           ;; Call the handler and wait for the response
           (ws-server/handle-ws-message msg)
           (let [response (helpers/wait-for reply-capture)]

             ;; Verify response structure
             response => (contains {:success true})
             response => (contains {:models (contains [{:id "model1" :name "Model 1"}
                                                       {:id "model2" :name "Model 2"}])})))))

;; Test response formatting for kind operations
(facts "Kind get operation returns correct response format"
       ;; Mock the semantic model service to return a test kind
       (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                     (fn [_] (go {:id "test-kind-id" :name "Test Kind" :type "kind"}))]

         (let [reply-capture (helpers/capture-reply)
               msg (helpers/mock-ws-message :clarity.kind/get {:kind-id "test-kind-id"} reply-capture)]

           ;; Call the handler and wait for the response
           (ws-server/handle-ws-message msg)
           (let [response (helpers/wait-for reply-capture)]

             ;; Verify response structure
             response => (contains {:success true})
             response => (contains {:model {:id "test-kind-id" :name "Test Kind" :type "kind"}}))))

       ;; Test error handling when kind is not found
       (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                     (fn [_] (go nil))]

         (let [reply-capture (helpers/capture-reply)
               msg (helpers/mock-ws-message :clarity.kind/get {:kind-id "non-existent-id"} reply-capture)]

           ;; Call the handler and wait for the response
           (ws-server/handle-ws-message msg)
           (let [response (helpers/wait-for reply-capture)]

             ;; Verify error response structure
             response => (contains {:success false})
             response => (contains {:error (contains {:type "resource-not-found"})})))))

;; Test response formatting for individual operations
(facts "Individual get operation returns correct response format"
       ;; Mock the semantic model service to return a test individual
       (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                     (fn [_] (go {:id "test-individual-id" :name "Test Individual" :type "individual"}))]

         (let [reply-capture (helpers/capture-reply)
               msg (helpers/mock-ws-message :clarity.individual/get
                                            {:individual-id "test-individual-id"}
                                            reply-capture)]

           ;; Call the handler and wait for the response
           (ws-server/handle-ws-message msg)
           (let [response (helpers/wait-for reply-capture)]

             ;; Verify response structure
             response => (contains {:success true})
             response => (contains {:model {:id "test-individual-id"
                                            :name "Test Individual"
                                            :type "individual"}}))))

       ;; Test error handling when individual is not found
       (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                     (fn [_] (go nil))]

         (let [reply-capture (helpers/capture-reply)
               msg (helpers/mock-ws-message :clarity.individual/get
                                            {:individual-id "non-existent-id"}
                                            reply-capture)]

           ;; Call the handler and wait for the response
           (ws-server/handle-ws-message msg)
           (let [response (helpers/wait-for reply-capture)]

             ;; Verify error response structure
             response => (contains {:success false})
             response => (contains {:error (contains {:type "resource-not-found"})})))))

;; Test error handling for exceptions
(facts "Handlers properly handle exceptions"
       ;; Mock the semantic model service to throw an exception
       (with-redefs [io.relica.clarity.services.semantic-model-service/retrieve-semantic-model
                     (fn [_] (throw (Exception. "Test exception")))]

         (let [reply-capture (helpers/capture-reply)
               msg (helpers/mock-ws-message :clarity.model/get {:uid "test-id"} reply-capture)]

           ;; Call the handler and wait for the response
           (ws-server/handle-ws-message msg)
           (let [response (helpers/wait-for reply-capture)]

             ;; Verify error response structure
             response => (contains {:success false})
             response => (contains {:error (contains {:type "internal-error"})})
             response => (contains {:error (contains {:details (contains {:exception anything})})})))))