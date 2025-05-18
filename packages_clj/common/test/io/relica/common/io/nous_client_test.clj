(ns io.relica.common.io.nous-client-test
  "Tests for the Nous client to verify it uses standardized message identifiers."
  (:require [midje.sweet :refer :all]
            [io.relica.common.io.nous-client :as nous]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test.midje-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]))

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