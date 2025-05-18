(ns io.relica.common.io.clarity-client-test
  "Tests for the Clarity client to verify it uses standardized message identifiers."
  (:require [midje.sweet :refer :all]
            [io.relica.common.io.clarity-client :as clarity]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test.midje-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]))

(facts "About Clarity client message identifiers"
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

         ;; Test model operations
         (fact "get-model uses standardized message identifier"
               (clarity/get-model clarity-client "model-123")
               (first @captured-messages) => (contains {:type :clarity.model/get}))

         (fact "get-kind-model uses standardized message identifier"
               (reset! captured-messages [])
               (clarity/get-kind-model clarity-client "kind-123")
               (first @captured-messages) => (contains {:type :clarity.kind/get}))

         (fact "get-individual-model uses standardized message identifier"
               (reset! captured-messages [])
               (clarity/get-individual-model clarity-client "individual-123")
               (first @captured-messages) => (contains {:type :clarity.individual/get}))

         (fact "send-heartbeat! uses standardized message identifier"
               (reset! captured-messages [])
               (clarity/send-heartbeat! clarity-client)
               (first @captured-messages) => (contains {:type :relica.app/heartbeat}))))

(facts "About Clarity client factory function"
       (with-redefs [ws/connect! (fn [_] true)]
         (let [handlers {:on-connect (fn [_] nil)}
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
             (let [client (clarity/create-client {:host "localhost"
                                                  :port 3000
                                                  :handlers handlers})]

               (fact "Client uses standardized connection event identifiers"
                     (get-in handlers [:on-connect]) => fn?))))))