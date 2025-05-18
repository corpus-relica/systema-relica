(ns io.relica.portal.handlers.websocket-test
  (:require [midje.sweet :refer [fact facts contains anything]]
            [io.relica.portal.handlers.websocket :as handlers]
            [io.relica.common.websocket.server :as ws-server]
            [io.relica.portal.test-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]
            [cheshire.core :as json]))

;; Test that WebSocket message identifiers are correctly defined
(fact "Authentication operations are correctly defined"
      (get handlers/ws-handlers "auth") => fn?
      (get handlers/ws-handlers "ping") => fn?)

(fact "Entity operations are correctly defined"
      (get handlers/ws-handlers "selectEntity") => fn?
      (get handlers/ws-handlers "selectNone") => fn?
      (get handlers/ws-handlers "loadSpecializationHierarchy") => fn?
      (get handlers/ws-handlers "clearEnvironmentEntities") => fn?
      (get handlers/ws-handlers "loadAllRelatedFacts") => fn?
      (get handlers/ws-handlers "unloadEntity") => fn?
      (get handlers/ws-handlers "loadEntities") => fn?
      (get handlers/ws-handlers "unloadEntities") => fn?
      (get handlers/ws-handlers "loadSubtypesCone") => fn?
      (get handlers/ws-handlers "unloadSubtypesCone") => fn?
      (get handlers/ws-handlers "loadComposition") => fn?
      (get handlers/ws-handlers "loadCompositionIn") => fn?
      (get handlers/ws-handlers "loadConnections") => fn?
      (get handlers/ws-handlers "loadConnectionsIn") => fn?)

(fact "Chat operations are correctly defined"
      (get handlers/ws-handlers "chatUserInput") => fn?)

(fact "Prism setup operations are correctly defined"
      (get handlers/ws-handlers "prism/startSetup") => fn?
      (get handlers/ws-handlers "prism/createUser") => fn?
      (get handlers/ws-handlers "prism/processStage") => fn?
      (get handlers/ws-handlers "setup/update") => fn?)

;; Test that event handlers correctly process standardized event types
(fact "Event handlers correctly process standardized event types"
      ;; Mock the event handlers to record when they're called
      (with-redefs [handlers/handle-facts-loaded-event (fn [payload]
                                                         (helpers/record-handler-call handlers/handle-facts-loaded-event)
                                                         (handlers/handle-facts-loaded-event payload))
                    handlers/handle-facts-unloaded-event (fn [payload]
                                                           (helpers/record-handler-call handlers/handle-facts-unloaded-event)
                                                           (handlers/handle-facts-unloaded-event payload))
                    handlers/handle-entity-selected-event (fn [payload]
                                                            (helpers/record-handler-call handlers/handle-entity-selected-event)
                                                            (handlers/handle-entity-selected-event payload))
                    handlers/handle-entity-selected-none-event (fn [payload]
                                                                 (helpers/record-handler-call handlers/handle-entity-selected-none-event)
                                                                 (handlers/handle-entity-selected-none-event payload))
                    handlers/handle-final-answer-event (fn [payload]
                                                         (helpers/record-handler-call handlers/handle-final-answer-event)
                                                         (handlers/handle-final-answer-event payload))
                    handlers/handle-prism-setup-update-event (fn [payload]
                                                               (helpers/record-handler-call handlers/handle-prism-setup-update-event)
                                                               (handlers/handle-prism-setup-update-event payload))]

        (let [events-ch (helpers/mock-events-channel)]
          ;; Test aperture.facts/loaded event
          (helpers/publish-test-event :aperture.facts/loaded {:facts [] :environment-id 1})
          (helpers/wait-for #(helpers/event-handler-called? handlers/handle-facts-loaded-event)) => true

          ;; Test aperture.facts/unloaded event
          (helpers/publish-test-event :aperture.facts/unloaded {:fact-uids [] :environment-id 1})
          (helpers/wait-for #(helpers/event-handler-called? handlers/handle-facts-unloaded-event)) => true

          ;; Test aperture.entity/selected event
          (helpers/publish-test-event :aperture.entity/selected {:entity-uid "test-uid" :environment-id 1})
          (helpers/wait-for #(helpers/event-handler-called? handlers/handle-entity-selected-event)) => true

          ;; Test aperture.entity/deselected event
          (helpers/publish-test-event :aperture.entity/deselected {:environment-id 1})
          (helpers/wait-for #(helpers/event-handler-called? handlers/handle-entity-selected-none-event)) => true

          ;; Test nous.chat/final-answer event
          (helpers/publish-test-event :nous.chat/final-answer {:payload "test answer" :environment-id 1})
          (helpers/wait-for #(helpers/event-handler-called? handlers/handle-final-answer-event)) => true

          ;; Test prism.setup/updated event
          (helpers/publish-test-event :prism.setup/updated {:status "in-progress"})
          (helpers/wait-for #(helpers/event-handler-called? handlers/handle-prism-setup-update-event)) => true)))

;; Test response formatting
(fact "Response formatting follows standardized format"
      (let [response (handlers/create-response "test-id" true {:data "test-data"} "request-123")]
        response => (contains {:id "test-id"
                               :type "response"
                               :success true
                               :request_id "request-123"
                               :data {:data "test-data"}})))

(fact "Error response formatting follows standardized format"
      (let [response (handlers/create-response "test-id" false {:type :validation-error
                                                                :message "Invalid data"
                                                                :details {:field "name"}} "request-123")]
        response => (contains {:id "test-id"
                               :type "response"
                               :success false
                               :request_id "request-123"
                               :error (contains {:code 1101
                                                 :type "validation-error"
                                                 :message "Invalid data"
                                                 :details {:field "name"}})})))

;; Test authentication
(helpers/async-fact "Authentication with valid JWT returns token"
                    (go
                      (let [result (<! (handlers/handle-auth {:jwt "valid-jwt"}))]
                        result => (contains {:success true
                                             :token anything
                                             :user-id anything}))))

(helpers/async-fact "Authentication with invalid JWT returns error"
                    (go
                      (let [result (<! (handlers/handle-auth {:jwt "invalid-jwt"}))]
                        result => (contains {:error "Invalid JWT"}))))

;; Test routing
(fact "WebSocket message routing works correctly"
      (with-redefs [org.httpkit.server/send! (fn [channel message]
                                               (helpers/record-channel-message channel (json/parse-string message true)))]
        (let [channel (helpers/mock-ws-channel)
              message "{\"id\":\"test-id\",\"type\":\"ping\",\"payload\":{}}"]
          (handlers/handle-ws-message channel message)
          (helpers/wait-for #(helpers/channel-received-message? channel)) => true
          (helpers/last-channel-message channel) => (contains {:success true
                                                               :data {:message "Pong"}}))))

(fact "Unknown message type returns error"
      (with-redefs [org.httpkit.server/send! (fn [channel message]
                                               (helpers/record-channel-message channel (json/parse-string message true)))]
        (let [channel (helpers/mock-ws-channel)
              message "{\"id\":\"test-id\",\"type\":\"unknown-type\",\"payload\":{}}"]
          (handlers/handle-ws-message channel message)
          (helpers/wait-for #(helpers/channel-received-message? channel)) => true
          (helpers/last-channel-message channel) => (contains {:success false
                                                               :error (contains {:type "unknown-message-type"})}))))