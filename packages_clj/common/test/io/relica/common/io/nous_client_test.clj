(ns io.relica.common.io.nous-client-test
  "Comprehensive tests for the Nous client including cross-language Python service communication,
   message serialization, streaming responses, and error handling."
  (:require [midje.sweet :refer :all]
            [io.relica.common.io.nous-client :as nous]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test.midje-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout <!! close! alts!]]))

(facts "About Nous client message identifiers"
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

         (fact "send-heartbeat! uses standardized message identifier"
               (nous/send-heartbeat! nous-client)
               (first @captured-messages) => (contains {:type :relica.app/heartbeat}))

         (fact "user-input uses standardized message identifier"
               (reset! captured-messages [])
               (nous/user-input nous-client "user-123" "env-456" "Hello, world!")
               (first @captured-messages) => (contains {:type :nous.user/input}))))

(facts "About Nous client factory function"
       (with-redefs [ws/connect! (fn [_] true)]
         (let [handlers {:on-connect (fn [_] nil)
                         :handle-final-answer (fn [_] nil)}
               registered-handlers (atom {})
               mock-ws-client (reify ws/WebSocketClientProtocol
                                (connect! [_] true)
                                (disconnect! [_] true)
                                (connected? [_] true)
                                (register-handler! [_ type handler]
                                  (swap! registered-handlers assoc type handler)
                                  nil)
                                (unregister-handler! [_ _] nil)
                                (send-message! [_ _ _ _]
                                  (go {:success true})))]

           (with-redefs [ws/create-client (fn [_] mock-ws-client)]
             (let [client (nous/create-client {:host "localhost"
                                               :port 3000
                                               :handlers handlers})]

               (fact "Client registers handlers with standardized message identifiers"
                     (keys @registered-handlers) => (contains [:nous.chat/final-answer]
                                                              :in-any-order)))))))

(facts "About Nous client cross-language Python service communication"
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

         (fact "sends properly formatted messages to Python service"
               (nous/user-input nous-client "user-123" "env-456" "What is the weather today?")
               (let [message (first @captured-messages)]
                 (:type message) => :nous.user/input
                 (get-in message [:payload :user-id]) => "user-123"
                 (get-in message [:payload :environment-id]) => "env-456"
                 (get-in message [:payload :input]) => "What is the weather today?"))

         (fact "handles Python snake_case responses correctly"
               (let [result (<!! (nous/user-input nous-client "user-123" "env-456" "Query"))]
                 (:success result) => true
                 (get-in result [:data :agent_response]) => "I understand your query"
                 (get-in result [:data :metadata :processing_time_ms]) => 150))))

(facts "About Nous client streaming responses"
       (let [handlers-called (atom {})
             registered-handlers (atom {})
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ type handler]
                                (swap! registered-handlers assoc type handler)
                                nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ _ _ _]
                                (go {:success true})))]

         (with-redefs [ws/create-client (fn [_] mock-ws-client)]
           (let [test-handlers {:handle-chunk-received (fn [data]
                                                         (swap! handlers-called update :chunks (fnil conj []) data))
                               :handle-final-answer (fn [data]
                                                     (swap! handlers-called assoc :final data))
                               :handle-error (fn [data]
                                               (swap! handlers-called assoc :error data))}
                 client (nous/create-client {:host "localhost"
                                           :port 3000
                                           :handlers test-handlers})]

             (fact "handles streaming text chunks from Python service"
                   ;; Simulate incoming streaming chunks
                   (let [chunk-handler (get @registered-handlers :nous.chat/chunk)]
                     (chunk-handler {:chunk "The weather "})
                     (chunk-handler {:chunk "today is "})
                     (chunk-handler {:chunk "sunny and warm."})
                     
                     (count (:chunks @handlers-called)) => 3
                     (apply str (map :chunk (:chunks @handlers-called))) => "The weather today is sunny and warm."))

             (fact "handles final answer after streaming"
                   (let [final-handler (get @registered-handlers :nous.chat/final-answer)]
                     (final-handler {:answer "The weather today is sunny and warm."
                                    :metadata {:tokens_used 15
                                               :model "gpt-4"}})
                     
                     (get-in @handlers-called [:final :answer]) => "The weather today is sunny and warm."
                     (get-in @handlers-called [:final :metadata :tokens_used]) => 15))))))

(facts "About Nous client error handling"
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

         (fact "handles Python service errors with traceback"
               (let [result (<!! (nous/user-input nous-client "user-123" "env-456" "test"))]
                 (:success result) => false
                 (get-in result [:error :code]) => "PYTHON_SERVICE_ERROR"
                 (get-in result [:error :message]) => (contains "LangChain")
                 (get-in result [:error :details :python_traceback]) => (contains "Traceback")))))

(facts "About Nous client message serialization"
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
                                (go {:success true})))
             nous-client (nous/->NOUSClient mock-ws-client {:timeout 5000})]

         (fact "properly serializes complex user inputs"
               (nous/user-input nous-client "user-123" "env-456" 
                               {:query "Find all facts about entity X"
                                :context {:previous_query "What is entity X?"
                                         :session_id "sess-789"}
                                :options {:max_tokens 500
                                         :temperature 0.8}})
               (let [message (first @captured-messages)]
                 ;; Verify nested data structures are preserved
                 (get-in message [:payload :input :query]) => "Find all facts about entity X"
                 (get-in message [:payload :input :context :session_id]) => "sess-789"
                 (get-in message [:payload :input :options :max_tokens]) => 500))))

(facts "About Nous client connection management"
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

         (fact "automatically connects to Python service when not connected"
               (reset! connection-state false)
               (reset! reconnect-count 0)
               (nous/user-input nous-client "user-123" "env-456" "test")
               @reconnect-count => 1)))

(facts "About Nous client timeout handling"
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

         (fact "handles Python service timeouts"
               (let [start (System/currentTimeMillis)
                     result (<!! (nous/user-input nous-client "user-123" "env-456" "complex query"))
                     duration (- (System/currentTimeMillis) start)]
                 ;; Should return after ~2 seconds (simulated delay)
                 duration => (roughly 2000 200)))))

(facts "About Nous client metadata handling"
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

         (fact "preserves Python service metadata in responses"
               (let [result (<!! (nous/user-input nous-client "user-123" "env-456" "analyze this"))]
                 (:success result) => true
                 (get-in result [:data :metadata :llm_provider]) => "openai"
                 (get-in result [:data :metadata :total_cost_usd]) => 0.003))

         (fact "includes client metadata in requests"
               (reset! captured-messages [])
               (nous/user-input nous-client "user-123" "env-456" "test" 
                               {:client-version "1.0.0"
                                :request-id "req-123"})
               (let [message (first @captured-messages)]
                 (get-in message [:metadata :client-version]) => "1.0.0"
                 (get-in message [:metadata :request-id]) => "req-123"))))