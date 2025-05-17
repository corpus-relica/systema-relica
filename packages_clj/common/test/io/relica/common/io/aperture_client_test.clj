(ns io.relica.common.io.aperture-client-test
  "Tests for the Aperture client to verify it uses standardized message identifiers."
  (:require [midje.sweet :refer :all]
            [io.relica.common.io.aperture-client :as aperture]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test.midje-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]))

(facts "About Aperture client message identifiers"
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
             aperture-client (aperture/->ApertureClient mock-ws-client {:timeout 5000})]

         ;; Test environment operations
         (fact "get-environment uses standardized message identifier"
               (aperture/get-environment aperture-client "user-123" "env-456")
               (first @captured-messages) => (contains {:type :aperture.environment/get}))

         (fact "list-environments uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/list-environments aperture-client "user-123")
               (first @captured-messages) => (contains {:type :aperture.environment/list}))

         (fact "create-environment uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/create-environment aperture-client "user-123" "New Environment")
               (first @captured-messages) => (contains {:type :aperture.environment/create}))

         (fact "clear-environment-entities uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/clear-environment-entities aperture-client "user-123" "env-456")
               (first @captured-messages) => (contains {:type :aperture.environment/clear}))

         (fact "update-environment! uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/update-environment! aperture-client "user-123" "env-456" {:name "Updated Name"})
               (first @captured-messages) => (contains {:type :aperture.environment/update}))

         ;; Test entity operations
         (fact "load-entities uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/load-entities aperture-client "user-123" "env-456" ["entity-1" "entity-2"])
               (first @captured-messages) => (contains {:type :aperture.entity/load-multiple}))

         (fact "unload-entity uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/unload-entity aperture-client "user-123" "env-456" "entity-1")
               (first @captured-messages) => (contains {:type :aperture.entity/unload}))

         (fact "unload-entities uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/unload-entities aperture-client "user-123" "env-456" ["entity-1" "entity-2"])
               (first @captured-messages) => (contains {:type :aperture.entity/unload-multiple}))

         (fact "select-entity uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/select-entity aperture-client "user-123" "env-456" "entity-1")
               (first @captured-messages) => (contains {:type :aperture.entity/select}))

         (fact "select-entity-none uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/select-entity-none aperture-client "user-123" "env-456")
               (first @captured-messages) => (contains {:type :aperture.entity/deselect-all}))

         ;; Test specialized operations
         (fact "load-specialization-hierarchy uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/load-specialization-hierarchy aperture-client "user-123" "entity-1")
               (first @captured-messages) => (contains {:type :aperture.specialization/load}))

         (fact "load-all-related-facts uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/load-all-related-facts aperture-client "user-123" "env-456" "entity-1")
               (first @captured-messages) => (contains {:type :aperture.fact/load-related}))

         (fact "load-subtypes-cone uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/load-subtypes-cone aperture-client "user-123" "env-456" "entity-1")
               (first @captured-messages) => (contains {:type :aperture.subtype/load-cone}))

         (fact "unload-subtypes-cone uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/unload-subtypes-cone aperture-client "user-123" "env-456" "entity-1")
               (first @captured-messages) => (contains {:type :aperture.subtype/unload-cone}))

         (fact "load-composition uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/load-composition aperture-client "user-123" "env-456" "entity-1")
               (first @captured-messages) => (contains {:type :aperture.composition/load}))

         (fact "load-composition-in uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/load-composition-in aperture-client "user-123" "env-456" "entity-1")
               (first @captured-messages) => (contains {:type :aperture.composition/load-in}))

         (fact "load-connections uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/load-connections aperture-client "user-123" "env-456" "entity-1")
               (first @captured-messages) => (contains {:type :aperture.connection/load}))

         (fact "load-connections-in uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/load-connections-in aperture-client "user-123" "env-456" "entity-1")
               (first @captured-messages) => (contains {:type :aperture.connection/load-in}))

         (fact "send-heartbeat! uses standardized message identifier"
               (reset! captured-messages [])
               (aperture/send-heartbeat! aperture-client)
               (first @captured-messages) => (contains {:type :aperture.app/heartbeat}))))

(facts "About Aperture client factory function"
       (with-redefs [ws/connect! (fn [_] true)]
         (let [handlers {:on-connect (fn [_] nil)
                         :handle-facts-loaded (fn [_] nil)
                         :handle-facts-unloaded (fn [_] nil)
                         :handle-entity-selected (fn [_] nil)
                         :handle-entity-selected-none (fn [_] nil)}
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
             (let [client (aperture/create-client {:host "localhost"
                                                   :port 3000
                                                   :handlers handlers})]

               (fact "Client registers handlers with standardized message identifiers"
                     (keys @registered-handlers) => (contains [:aperture.facts/loaded
                                                               :aperture.facts/unloaded
                                                               :aperture.entity/selected
                                                               :aperture.entity/deselected]
                                                              :in-any-order)))))))