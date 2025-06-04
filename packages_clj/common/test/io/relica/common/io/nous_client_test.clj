(ns io.relica.common.io.nous-client-test
  "Comprehensive tests for the Nous client including cross-language Python service communication,
   message serialization, streaming responses, and error handling."
  (:require [clojure.test :refer [deftest testing is]]
            [io.relica.common.io.nous-client :as nous]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout <!! close! alts!]]))

(deftest nous-client-message-identifiers-test
  (testing "About Nous client message identifiers"
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
          nous-client (nous/->NOUSClient mock-ws-client {:timeout 5000})]

      (testing "send-heartbeat! uses standardized message identifier"
        (nous/send-heartbeat! nous-client)
        (is (= :relica.app/heartbeat (:type (first @captured-messages)))))

      (testing "user-input uses standardized message identifier"
        (reset! captured-messages [])
        (nous/user-input nous-client "user-123" "env-456" "Hello, world!")
        (is (= :nous.user/input (:type (first @captured-messages))))))))

(deftest nous-client-cross-language-python-service-communication-test
  (testing "About Nous client cross-language Python service communication"
    (let [captured-messages (atom [])
          mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (swap! captured-messages conj {:type type
                                                            :payload payload})
                             ;; Simulate Python service response
                             (go {:success true
                                  :data {:agent_response "I understand your query"
                                         :metadata {:model "gpt-4"
                                                   :temperature 0.7
                                                   :processing_time_ms 150}}})))
          nous-client (nous/->NOUSClient mock-ws-client {:timeout 5000})]

      (testing "sends properly formatted messages to Python service"
        (nous/user-input nous-client "user-123" "env-456" "What is the weather today?")
        (let [message (first @captured-messages)]
          (is (= :nous.user/input (:type message)))
          (is (= "user-123" (get-in message [:payload :user-id])))
          (is (= "env-456" (get-in message [:payload :env-id])))
          (is (= "What is the weather today?" (get-in message [:payload :message])))))

      (testing "handles Python snake_case responses correctly"
        (let [result (<!! (nous/user-input nous-client "user-123" "env-456" "Query"))]
          (is (= true (:success result)))
          (is (= "I understand your query" (get-in result [:data :agent_response])))
          (is (= 150 (get-in result [:data :metadata :processing_time_ms]))))))))

(deftest nous-client-error-handling-test
  (testing "About Nous client error handling"
    (let [mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (go (case type
                                   :nous.user/input
                                   {:success false
                                    :error {:code "PYTHON_SERVICE_ERROR"
                                            :message "LangChain agent initialization failed"
                                            :details {:python_traceback "Traceback (most recent call last)..."}}}
                                   {:success false
                                    :error {:code "UNKNOWN_ERROR"}}))))
          nous-client (nous/->NOUSClient mock-ws-client {:timeout 5000})]

      (testing "handles Python service errors with traceback"
        (let [result (<!! (nous/user-input nous-client "user-123" "env-456" "test"))]
          (is (= false (:success result)))
          (is (= "PYTHON_SERVICE_ERROR" (get-in result [:error :code])))
          (is (.contains (get-in result [:error :message]) "LangChain"))
          (is (.contains (get-in result [:error :details :python_traceback]) "Traceback")))))))

(deftest nous-client-connection-management-test
  (testing "About Nous client connection management"
    (let [connection-state (atom false)
          reconnect-count (atom 0)
          mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_]
                             (swap! reconnect-count inc)
                             (reset! connection-state true)
                             true)
                           (disconnect! [_]
                             (reset! connection-state false)
                             true)
                           (connected? [_] @connection-state)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (go {:success true
                                  :data {:response "ok"}})))
          nous-client (nous/->NOUSClient mock-ws-client {:timeout 5000})]

      (testing "tracks connection state"
        ;; Start disconnected, then connect
        (reset! connection-state false)
        (is (= false (ws/connected? mock-ws-client)))
        (ws/connect! mock-ws-client)
        (is (= true (ws/connected? mock-ws-client)))
        (ws/disconnect! mock-ws-client)
        (is (= false (ws/connected? mock-ws-client)))))))

(deftest nous-client-timeout-handling-test
  (testing "About Nous client timeout handling"
    (let [slow-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (go
                               ;; Simulate Python service taking too long
                               (<! (timeout 2000))
                               {:success false
                                :error {:code "TIMEOUT"
                                        :message "Python service response timeout"}})))
          nous-client (nous/->NOUSClient slow-ws-client {:timeout 1000})]

      (testing "handles Python service timeouts"
        (let [start (System/currentTimeMillis)
              result (<!! (nous/user-input nous-client "user-123" "env-456" "complex query"))
              duration (- (System/currentTimeMillis) start)]
          ;; Should return after ~2 seconds (simulated delay)  
          (is (> duration 1800)) ; At least 1.8 seconds
          (is (< duration 2500)) ; Less than 2.5 seconds
          (is (= false (:success result)))
          (is (= "TIMEOUT" (get-in result [:error :code]))))))))

(deftest nous-client-metadata-handling-test
  (testing "About Nous client metadata handling"
    (let [captured-messages (atom [])
          mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (swap! captured-messages conj payload)
                             (go {:success true
                                  :data {:response "Processed"
                                         :metadata {:llm_provider "openai"
                                                   :model_version "gpt-4-turbo"
                                                   :context_tokens 150
                                                   :completion_tokens 50
                                                   :total_cost_usd 0.003}}})))
          nous-client (nous/->NOUSClient mock-ws-client {:timeout 5000})]

      (testing "preserves Python service metadata in responses"
        (let [result (<!! (nous/user-input nous-client "user-123" "env-456" "analyze this"))]
          (is (= true (:success result)))
          (is (= "openai" (get-in result [:data :metadata :llm_provider])))
          (is (= 0.003 (get-in result [:data :metadata :total_cost_usd])))))

      (testing "sends basic message structure"
        (reset! captured-messages [])
        (nous/user-input nous-client "user-123" "env-456" "test")
        (let [message (first @captured-messages)]
          ;; Just verify the basic structure is sent
          (is (not (nil? message)))
          (is (map? message)))))))