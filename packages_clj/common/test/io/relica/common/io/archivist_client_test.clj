(ns io.relica.common.io.archivist-client-test
  "Tests for the Archivist client to verify it uses standardized message identifiers."
  (:require [midje.sweet :refer :all]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test.midje-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]))

(facts "About Archivist client message identifiers"
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
             archivist-client (archivist/->ArchivistClient mock-ws-client {:timeout 5000})]

         ;; Test a sample of operations to verify message identifiers
         (fact "get-batch-facts uses standardized message identifier"
               (archivist/get-batch-facts archivist-client {:page 1 :limit 10})
               (first @captured-messages) => (contains {:type :archivist.fact/batch-get}))

         (fact "get-facts-count uses standardized message identifier"
               (reset! captured-messages [])
               (archivist/get-facts-count archivist-client)
               (first @captured-messages) => (contains {:type :archivist.fact/count}))

         (fact "execute-query uses standardized message identifier"
               (reset! captured-messages [])
               (archivist/execute-query archivist-client "MATCH (n) RETURN n" {})
               (first @captured-messages) => (contains {:type :archivist.graph/query-execute}))

         (fact "get-kinds uses standardized message identifier"
               (reset! captured-messages [])
               (archivist/get-kinds archivist-client {})
               (first @captured-messages) => (contains {:type :archivist.kind/list}))

         (fact "get-aspects uses standardized message identifier"
               (reset! captured-messages [])
               (archivist/get-aspects archivist-client {})
               (first @captured-messages) => (contains {:type :archivist.aspect/list}))

         (fact "get-facts uses standardized message identifier"
               (reset! captured-messages [])
               (archivist/get-facts archivist-client {})
               (first @captured-messages) => (contains {:type :archivist.fact/list}))

         (fact "send-heartbeat! uses standardized message identifier"
               (reset! captured-messages [])
               (archivist/send-heartbeat! archivist-client)
               (first @captured-messages) => (contains {:type :relica.app/heartbeat}))))

(facts "About Archivist client factory function"
       (let [captured-messages (atom [])
             handlers {:on-error (fn [_] nil)
                       :on-message (fn [_] nil)}
             registered-handlers (atom {})
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ type handler]
                                (swap! registered-handlers assoc type handler)
                                nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload _]
                                (swap! captured-messages conj {:type type
                                                               :payload payload})
                                (go {:success true})))]

         (with-redefs [ws/connect! (fn [_] true)
                       ws/create-client (fn [_] mock-ws-client)
                       archivist/start-heartbeat-scheduler! (fn [_ _] #())] ; Disable the scheduler
           (let [client (archivist/create-client {:host "localhost"
                                                  :port 3000
                                                  :handlers handlers})]

             (fact "Client uses standardized heartbeat message identifier"
                   (reset! captured-messages [])
                   (archivist/send-heartbeat! client)
                   (first @captured-messages) => (contains {:type :relica.app/heartbeat}))))))