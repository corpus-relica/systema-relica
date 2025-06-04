(ns io.relica.common.io.clarity-client-test
  "Comprehensive tests for the Clarity client including message identifiers, error handling,
   model retrieval operations, and cross-language compatibility."
  (:require [midje.sweet :refer :all]
            [io.relica.common.io.clarity-client :as clarity]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test.midje-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout <!! close! alts!]]))

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

         (fact "get-model uses standardized message identifier"
               (clarity/get-model clarity-client "model-123")
               (first @captured-messages) => (contains {:type :clarity.model/get}))

         (fact "get-kind-model uses standardized message identifier"
               (reset! captured-messages [])
               (clarity/get-kind-model clarity-client "kind-456")
               (first @captured-messages) => (contains {:type :clarity.kind/get}))

         (fact "get-individual-model uses standardized message identifier"
               (reset! captured-messages [])
               (clarity/get-individual-model clarity-client "individual-789")
               (first @captured-messages) => (contains {:type :clarity.individual/get}))

         (fact "send-heartbeat! uses standardized message identifier"
               (reset! captured-messages [])
               (clarity/send-heartbeat! clarity-client)
               (first @captured-messages) => (contains {:type :relica.app/heartbeat}))))

(facts "About Clarity client factory function"
       (let [captured-messages (atom [])
             handlers {:on-connect (fn [_] nil)
                       :handle-model-received (fn [_] nil)}
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
                       clarity/start-heartbeat-scheduler! (fn [_ _] #())] ; Disable the scheduler
           (let [client (clarity/create-client {:host "localhost"
                                                :port 3000
                                                :handlers handlers})]

             (fact "Client uses standardized heartbeat message identifier"
                   (reset! captured-messages [])
                   (clarity/send-heartbeat! client)
                   (first @captured-messages) => (contains {:type :relica.app/heartbeat}))))))

(facts "About Clarity client error handling"
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
                                       :error {:code "MODEL_NOT_FOUND"
                                               :message "Model with UID 'invalid-123' not found"}}
                                      :clarity.kind/get
                                      {:success false
                                       :error {:code "KIND_NOT_FOUND"
                                               :message "Kind with ID 'unknown-kind' not found"}}
                                      :clarity.individual/get
                                      {:success false
                                       :error {:code "INDIVIDUAL_NOT_FOUND"
                                               :message "Individual with ID 'missing-individual' not found"}}
                                      {:success false
                                       :error {:code "UNKNOWN_ERROR"}}))))
             clarity-client (clarity/->ClarityClient mock-ws-client {:timeout 5000})]

         (fact "handles model not found errors gracefully"
               (let [result (<!! (clarity/get-model clarity-client "invalid-123"))]
                 (:success result) => false
                 (get-in result [:error :code]) => "MODEL_NOT_FOUND"))

         (fact "handles kind not found errors"
               (let [result (<!! (clarity/get-kind-model clarity-client "unknown-kind"))]
                 (:success result) => false
                 (get-in result [:error :code]) => "KIND_NOT_FOUND"
                 (get-in result [:error :message]) => (contains "Kind with ID")))

         (fact "handles individual not found errors"
               (let [result (<!! (clarity/get-individual-model clarity-client "missing-individual"))]
                 (:success result) => false
                 (get-in result [:error :code]) => "INDIVIDUAL_NOT_FOUND"
                 (get-in result [:error :message]) => (contains "Individual with ID"))))

(facts "About Clarity client model retrieval operations"
       (let [mock-models {:general-model {:uid "model-123"
                                         :name "Complex System Model"
                                         :description "A comprehensive model of the system"
                                         :components [{:id "comp1" :type "Entity"}
                                                     {:id "comp2" :type "Relationship"}]
                                         :metadata {:created_by "system"
                                                   :created_at 1234567890
                                                   :version "1.0"}}
                         :kind-models {"730000" {:kind-id "730000"
                                               :name "Physical Object"
                                               :definition "Objects that have physical presence"
                                               :properties [{:name "mass" :type "float"}
                                                          {:name "volume" :type "float"}]
                                               :relationships ["has_part" "is_part_of"]}
                                     "1146" {:kind-id "1146"
                                           :name "Specialization"
                                           :definition "Hierarchical classification relationship"}}
                         :individual-models {"ind-100" {:individual-id "ind-100"
                                                      :name "Specific Entity"
                                                      :kind "730000"
                                                      :properties {:mass 10.5 :volume 2.3}
                                                      :related_entities ["ind-200" "ind-300"]}}}
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (go (case type
                                      :clarity.model/get
                                      {:success true
                                       :model (get mock-models :general-model)}
                                      :clarity.kind/get
                                      {:success true
                                       :model (get-in mock-models [:kind-models (:kind-id payload)])}
                                      :clarity.individual/get
                                      {:success true
                                       :model (get-in mock-models [:individual-models (:individual-id payload)])}
                                      {:success false}))))
             clarity-client (clarity/->ClarityClient mock-ws-client {:timeout 5000})]

         (fact "retrieves general models correctly"
               (let [result (<!! (clarity/get-model clarity-client "model-123"))]
                 (:success result) => true
                 (get-in result [:model :name]) => "Complex System Model"
                 (count (get-in result [:model :components])) => 2))

         (fact "retrieves kind models with metadata"
               (let [result (<!! (clarity/get-kind-model clarity-client "730000"))]
                 (:success result) => true
                 (get-in result [:model :name]) => "Physical Object"
                 (get-in result [:model :definition]) => (contains "physical presence")
                 (count (get-in result [:model :properties])) => 2))

         (fact "retrieves individual models with specific data"
               (let [result (<!! (clarity/get-individual-model clarity-client "ind-100"))]
                 (:success result) => true
                 (get-in result [:model :name]) => "Specific Entity"
                 (get-in result [:model :properties :mass]) => 10.5
                 (count (get-in result [:model :related_entities])) => 2)))

(facts "About Clarity client cross-language compatibility"
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
                                ;; Simulate response from TypeScript/Python service
                                (go {:success true
                                     :data {:processed_by "typescript-service"
                                            :timestamp (System/currentTimeMillis)
                                            :model_version "2.1"
                                            :visualization_ready true}})))
             clarity-client (clarity/->ClarityClient mock-ws-client {:timeout 5000})]

         (fact "message format is compatible with TypeScript services"
               (clarity/get-kind-model clarity-client "730000")
               (let [message (first @captured-messages)]
                 ;; Verify kebab-case conversion for cross-language compatibility
                 (get-in message [:payload :kind-id]) => "730000"
                 (:type message) => :clarity.kind/get))

         (fact "handles snake_case responses from Python/TypeScript"
               (let [result (<!! (clarity/get-model clarity-client "test-model"))]
                 (:success result) => true
                 (get-in result [:data :processed_by]) => "typescript-service"
                 (get-in result [:data :model_version]) => "2.1"
                 (get-in result [:data :visualization_ready]) => true)))

(facts "About Clarity client connection management"
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
                                     :data {:model "retrieved"}})))
             clarity-client (clarity/->ClarityClient mock-ws-client {:timeout 5000})]

         (fact "automatically connects when not connected"
               (reset! connection-state false)
               (reset! reconnect-count 0)
               (clarity/get-model clarity-client "test-model")
               @reconnect-count => 1)

         (fact "reuses existing connection when already connected"
               (reset! connection-state true)
               (reset! reconnect-count 0)
               (clarity/get-kind-model clarity-client "kind-123")
               @reconnect-count => 0))

(facts "About Clarity client timeout handling"
       (let [slow-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (go
                                  ;; Simulate slow model computation
                                  (<! (timeout 1500))
                                  {:success true
                                   :data {:model "complex-model-computed"}})))
             clarity-client (clarity/->ClarityClient slow-ws-client {:timeout 1000})]

         (fact "handles slow model generation"
               (let [start (System/currentTimeMillis)
                     result (<!! (clarity/get-model clarity-client "complex-model"))
                     duration (- (System/currentTimeMillis) start)]
                 ;; Should complete after ~1.5 seconds (simulated delay)
                 duration => (roughly 1500 200))))

(facts "About Clarity client heartbeat mechanism"
       (let [heartbeat-count (atom 0)
             heartbeat-payloads (atom [])
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (when (= type :relica.app/heartbeat)
                                  (swap! heartbeat-count inc)
                                  (swap! heartbeat-payloads conj payload))
                                (go {:success true})))]

         (with-redefs [clarity/start-heartbeat-scheduler! 
                       (fn [client interval-ms]
                         ;; Simulate heartbeat scheduler
                         (future
                           (dotimes [_ 3]
                             (Thread/sleep 100)
                             (clarity/send-heartbeat! client)))
                         #())] ;; Return stop function
           
           (fact "sends periodic heartbeats with timestamps"
                 (let [client (clarity/create-client {:host "localhost"
                                                     :port 3000
                                                     :ws-client mock-ws-client
                                                     :heartbeat-interval 100})]
                   ;; Wait for heartbeats
                   (Thread/sleep 350)
                   @heartbeat-count => (roughly 3 1)
                   ;; Verify heartbeat payloads contain timestamps
                   (every? #(contains? % :timestamp) @heartbeat-payloads) => true))))

(facts "About Clarity client parameter validation"
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
             clarity-client (clarity/->ClarityClient mock-ws-client {:timeout 5000})]

         (fact "validates model UID parameter format"
               (clarity/get-model clarity-client "model-abc-123")
               (let [message (first @captured-messages)]
                 (get-in message [:payload :uid]) => "model-abc-123"))

         (fact "validates kind ID parameter format"
               (reset! captured-messages [])
               (clarity/get-kind-model clarity-client "730000")
               (let [message (first @captured-messages)]
                 (get-in message [:payload :kind-id]) => "730000"))

         (fact "validates individual ID parameter format"
               (reset! captured-messages [])
               (clarity/get-individual-model clarity-client "individual-xyz-789")
               (let [message (first @captured-messages)]
                 (get-in message [:payload :individual-id]) => "individual-xyz-789")))

(facts "About Clarity client response processing"
       (let [mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (go {:success true
                                     :model {:uid "retrieved-model"
                                            :components [{:type "visualization"
                                                        :data {:nodes 50 :edges 100}}
                                                       {:type "analytics"
                                                        :data {:metrics ["accuracy" "performance"]}}]
                                            :metadata {:complexity "high"
                                                     :render_time_ms 250}}})))
             clarity-client (clarity/->ClarityClient mock-ws-client {:timeout 5000})]

         (fact "processes complex model responses correctly"
               (let [result (<!! (clarity/get-model clarity-client "complex-model"))]
                 (:success result) => true
                 (get-in result [:model :uid]) => "retrieved-model"
                 (count (get-in result [:model :components])) => 2
                 (get-in result [:model :components 0 :type]) => "visualization"
                 (get-in result [:model :components 1 :data :metrics]) => ["accuracy" "performance"]
                 (get-in result [:model :metadata :complexity]) => "high")))

(facts "About Clarity client concurrent operations"
       (let [operation-count (atom 0)
             concurrent-results (atom [])
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (let [op-id (swap! operation-count inc)]
                                  (go
                                    ;; Simulate processing time
                                    (<! (timeout 100))
                                    {:success true
                                     :model {:operation-id op-id
                                            :uid (:uid payload)
                                            :processed true}}))))
             clarity-client (clarity/->ClarityClient mock-ws-client {:timeout 5000})]

         (fact "handles concurrent model requests"
               (let [futures (doall
                             (for [i (range 5)]
                               (future
                                 (let [result (<!! (clarity/get-model clarity-client (str "model-" i)))]
                                   (swap! concurrent-results conj result))))]
                 ;; Wait for all futures
                 (doseq [f futures] @f)
                 
                 (count @concurrent-results) => 5
                 ;; All operations should be successful
                 (every? :success @concurrent-results) => true
                 ;; Each should have unique operation ID
                 (count (distinct (map #(get-in % [:model :operation-id]) @concurrent-results))) => 5)))