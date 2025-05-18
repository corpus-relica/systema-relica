(ns io.relica.common.io.prism-client-test
  "Tests for the Prism client to verify it uses standardized message identifiers."
  (:require [midje.sweet :refer :all]
            [io.relica.common.io.prism-client :as prism]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test.midje-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]))

(facts "About Prism client message identifiers"
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
             prism-client (prism/->PrismClient mock-ws-client {:timeout 5000})]

         ;; Test setup operations
         (fact "get-setup-status uses standardized message identifier"
               (prism/get-setup-status prism-client)
               (first @captured-messages) => (contains {:type :prism.setup/get-status}))

         (fact "start-setup uses standardized message identifier"
               (reset! captured-messages [])
               (prism/start-setup prism-client)
               (first @captured-messages) => (contains {:type :prism.setup/start}))

         (fact "create-admin-user uses standardized message identifier"
               (reset! captured-messages [])
               (prism/create-admin-user prism-client "admin" "password" "password")
               (first @captured-messages) => (contains {:type :prism.setup/create-user}))

         (fact "process-setup-stage uses standardized message identifier"
               (reset! captured-messages [])
               (prism/process-setup-stage prism-client)
               (first @captured-messages) => (contains {:type :prism.setup/process-stage}))

         (fact "send-heartbeat! uses standardized message identifier"
               (reset! captured-messages [])
               (prism/send-heartbeat! prism-client)
               (first @captured-messages) => (contains {:type :relica.app/heartbeat}))))

(facts "About Prism client factory function"
       (with-redefs [ws/connect! (fn [_] true)]
         (let [handlers {:on-connect (fn [_] nil)
                         :handle-setup-state-update (fn [_] nil)}
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
             (let [client (prism/create-client {:host "localhost"
                                                :port 3000
                                                :handlers handlers})]

               (fact "Client registers handlers with standardized message identifiers"
                     (keys @registered-handlers) => (contains [:prism.setup/update]
                                                              :in-any-order)))))))