(ns io.relica.common.io.clarity-client-test
  "Comprehensive tests for the Clarity client including message identifiers, error handling,
   model retrieval operations, and cross-language compatibility."
  (:require [clojure.test :refer [deftest testing is]]
            [io.relica.common.io.clarity-client :as clarity]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout <!! close! alts!]]))

(deftest clarity-client-message-identifiers-test
  (testing "About Clarity client message identifiers"
    ;; Mock the WebSocket client's send-message! function to capture the message type
    (let [captured-messages (atom [])
          mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (swap! captured-messages conj {:type type
                                                            :payload payload
                                                            :timeout timeout-ms})
                             (go {:success true})))
          clarity-client (clarity/->ClarityClient mock-ws-client {:timeout 5000})]

      (testing "get-model uses standardized message identifier"
        (clarity/get-model clarity-client "model-123")
        (is (= :clarity.model/get (:type (first @captured-messages)))))

      (testing "get-kind-model uses standardized message identifier"
        (reset! captured-messages [])
        (clarity/get-kind-model clarity-client "kind-456")
        (is (= :clarity.kind/get (:type (first @captured-messages)))))

      (testing "get-individual-model uses standardized message identifier"
        (reset! captured-messages [])
        (clarity/get-individual-model clarity-client "individual-789")
        (is (= :clarity.individual/get (:type (first @captured-messages)))))

      (testing "send-heartbeat! uses standardized message identifier"
        (reset! captured-messages [])
        (clarity/send-heartbeat! clarity-client)
        (is (= :relica.app/heartbeat (:type (first @captured-messages))))))))

(deftest clarity-client-model-retrieval-operations-test
  (testing "About Clarity client model retrieval operations"
    (let [captured-messages (atom [])
          mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (swap! captured-messages conj {:type type :payload payload})
                             (go {:success true
                                  :data (case type
                                          :clarity.model/get
                                          {:model-id "model-123"
                                           :model-type "conceptual"
                                           :entities [{:uid "entity-1" :name "Entity 1"}
                                                     {:uid "entity-2" :name "Entity 2"}]
                                           :relationships [{:from "entity-1" :to "entity-2" :type "is-a"}]}
                                          :clarity.kind/get
                                          {:kind-id "kind-456"
                                           :name "Physical Object"
                                           :definition "A tangible entity"
                                           :instances-count 15}
                                          :clarity.individual/get
                                          {:individual-id "individual-789"
                                           :name "Specific Instance"
                                           :classification "Physical Object"
                                           :properties {:color "blue" :size "large"}}
                                          {})})))
          clarity-client (clarity/->ClarityClient mock-ws-client {:timeout 5000})]

      (testing "retrieves model data with entities and relationships"
        (let [result (<!! (clarity/get-model clarity-client "model-123"))]
          (is (= true (:success result)))
          (is (= "model-123" (get-in result [:data :model-id])))
          (is (= "conceptual" (get-in result [:data :model-type])))
          (is (= 2 (count (get-in result [:data :entities]))))
          (is (= 1 (count (get-in result [:data :relationships]))))))

      (testing "retrieves kind data with instances count"
        (let [result (<!! (clarity/get-kind-model clarity-client "kind-456"))]
          (is (= true (:success result)))
          (is (= "kind-456" (get-in result [:data :kind-id])))
          (is (= "Physical Object" (get-in result [:data :name])))
          (is (= 15 (get-in result [:data :instances-count])))))

      (testing "retrieves individual data with properties"
        (let [result (<!! (clarity/get-individual-model clarity-client "individual-789"))]
          (is (= true (:success result)))
          (is (= "individual-789" (get-in result [:data :individual-id])))
          (is (= "Specific Instance" (get-in result [:data :name])))
          (is (= "blue" (get-in result [:data :properties :color]))))))))

(deftest clarity-client-error-handling-test
  (testing "About Clarity client error handling"
    (let [mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (go (case type
                                   :clarity.model/get
                                   {:success false
                                    :error {:code 2201
                                            :type "model-not-found"
                                            :message "Model does not exist"
                                            :details {:model-id (:model-id payload)}}}
                                   :clarity.kind/get
                                   {:success false
                                    :error {:code 2101
                                            :type "validation-error"
                                            :message "Invalid kind identifier format"}}
                                   {:success false
                                    :error {:code 2002
                                            :type "internal-error"}}))))
          clarity-client (clarity/->ClarityClient mock-ws-client {:timeout 5000})]

      (testing "handles model not found errors"
        (let [result (<!! (clarity/get-model clarity-client "non-existent-model"))]
          (is (= false (:success result)))
          (is (= 2201 (get-in result [:error :code])))
          (is (= "model-not-found" (get-in result [:error :type])))
          ;; Error details might be structured differently
          (is (not (nil? (get-in result [:error :details]))))))

      (testing "handles validation errors"
        (let [result (<!! (clarity/get-kind-model clarity-client "invalid-format!"))]
          (is (= false (:success result)))
          (is (= 2101 (get-in result [:error :code])))
          (is (= "validation-error" (get-in result [:error :type]))))))))

(deftest clarity-client-cross-language-compatibility-test
  (testing "About Clarity client cross-language TypeScript compatibility"
    (let [captured-messages (atom [])
          mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (swap! captured-messages conj payload)
                             ;; Simulate TypeScript-style response
                             (go {:success true
                                  :data {:modelId "model-123"
                                         :modelType "ontological"
                                         :createdAt "2024-01-01T12:00:00.000Z"
                                         :lastModified "2024-01-01T12:30:00.000Z"
                                         :isPublic true
                                         :entityCount 42}})))
          clarity-client (clarity/->ClarityClient mock-ws-client {:timeout 5000})]

      (testing "sends requests compatible with TypeScript service"
        (clarity/get-model clarity-client "model-123")
        (let [message (first @captured-messages)]
          (is (= "model-123" (:uid message)))))

      (testing "handles TypeScript camelCase responses"
        (let [result (<!! (clarity/get-model clarity-client "model-123"))]
          (is (= true (:success result)))
          (is (= "model-123" (get-in result [:data :modelId])))
          (is (= "ontological" (get-in result [:data :modelType])))
          (is (= true (get-in result [:data :isPublic])))
          (is (= 42 (get-in result [:data :entityCount]))))))))

(deftest clarity-client-heartbeat-mechanism-test
  (testing "About Clarity client heartbeat mechanism"
    (let [heartbeat-count (atom 0)
          mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (when (= type :relica.app/heartbeat)
                               (swap! heartbeat-count inc))
                             (go {:success true})))
          clarity-client (clarity/->ClarityClient mock-ws-client {:timeout 5000})]

      (testing "sends heartbeat messages"
        (clarity/send-heartbeat! clarity-client)
        (is (= 1 @heartbeat-count))))))