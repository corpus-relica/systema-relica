(ns io.relica.common.io.prism-client-test
  "Comprehensive tests for the Prism client including message identifiers, error handling,
   setup operations, cache management, and cross-language compatibility."
  (:require [midje.sweet :refer :all]
            [io.relica.common.io.prism-client :as prism]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test.midje-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout <!! close! alts!]]))

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

(facts "About Prism client error handling"
       (let [mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (go (case type
                                      :prism.setup/get-status
                                      {:success false
                                       :error {:code "SETUP_ERROR"
                                               :message "Database connection failed"}}
                                      :prism.setup/create-user
                                      {:success false
                                       :error {:code "USER_CREATION_ERROR"
                                               :message "Password validation failed"}}
                                      :prism.setup/start
                                      {:success false
                                       :error {:code "SETUP_ALREADY_RUNNING"
                                               :message "Setup process is already in progress"}}
                                      {:success false
                                       :error {:code "UNKNOWN_ERROR"}}))))
             prism-client (prism/->PrismClient mock-ws-client {:timeout 5000})]

         (fact "handles setup errors gracefully"
               (let [result (<!! (prism/get-setup-status prism-client))]
                 (:success result) => false
                 (get-in result [:error :code]) => "SETUP_ERROR"))

         (fact "handles user creation errors"
               (let [result (<!! (prism/create-admin-user prism-client "admin" "weak" "weak"))]
                 (:success result) => false
                 (get-in result [:error :code]) => "USER_CREATION_ERROR"
                 (get-in result [:error :message]) => (contains "Password validation")))

         (fact "handles concurrent setup attempts"
               (let [result (<!! (prism/start-setup prism-client))]
                 (:success result) => false
                 (get-in result [:error :code]) => "SETUP_ALREADY_RUNNING")))

(facts "About Prism client setup operations"
       (let [mock-setup-state {:status "in-progress"
                              :current-stage "database-initialization"
                              :completed-stages ["configuration" "validation"]
                              :total-stages 5
                              :progress-percentage 60}
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (go (case type
                                      :prism.setup/get-status
                                      {:success true
                                       :setup-state mock-setup-state}
                                      :prism.setup/start
                                      {:success true
                                       :message "Setup process initiated"
                                       :setup-id "setup-12345"}
                                      :prism.setup/create-user
                                      {:success true
                                       :user {:username (:username payload)
                                             :role "admin"
                                             :created-at (System/currentTimeMillis)}}
                                      :prism.setup/process-stage
                                      {:success true
                                       :stage-result {:stage "current-stage"
                                                     :status "completed"
                                                     :next-stage "next-stage"}}
                                      {:success false}))))
             prism-client (prism/->PrismClient mock-ws-client {:timeout 5000})]

         (fact "retrieves setup status correctly"
               (let [result (<!! (prism/get-setup-status prism-client))]
                 (:success result) => true
                 (get-in result [:setup-state :status]) => "in-progress"
                 (get-in result [:setup-state :progress-percentage]) => 60
                 (count (get-in result [:setup-state :completed-stages])) => 2))

         (fact "initiates setup process"
               (let [result (<!! (prism/start-setup prism-client))]
                 (:success result) => true
                 (get-in result [:setup-id]) => "setup-12345"
                 (:message result) => (contains "initiated")))

         (fact "creates admin user successfully"
               (let [result (<!! (prism/create-admin-user prism-client "admin" "strong-password" "strong-password"))]
                 (:success result) => true
                 (get-in result [:user :username]) => "admin"
                 (get-in result [:user :role]) => "admin"))

         (fact "processes setup stages"
               (let [result (<!! (prism/process-setup-stage prism-client))]
                 (:success result) => true
                 (get-in result [:stage-result :status]) => "completed")))

(facts "About Prism client cache management"
       (let [captured-messages (atom [])
             mock-cache-data {:cache-stats {:hit-rate 0.85
                                           :miss-rate 0.15
                                           :total-requests 1000
                                           :cache-size-mb 24.5}
                             :cached-items [{:key "setup-config" :size-kb 12.3 :ttl 3600}
                                           {:key "user-sessions" :size-kb 8.7 :ttl 1800}]}
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (swap! captured-messages conj {:type type
                                                               :payload payload})
                                (go (case type
                                      :prism.cache/get-stats
                                      {:success true
                                       :cache-data mock-cache-data}
                                      :prism.cache/clear
                                      {:success true
                                       :message "Cache cleared successfully"}
                                      :prism.cache/invalidate
                                      {:success true
                                       :invalidated-keys (:keys payload)}
                                      {:success true}))))
             prism-client (prism/->PrismClient mock-ws-client {:timeout 5000})]

         (fact "retrieves cache statistics"
               (prism/get-cache-stats prism-client)
               (let [result (<!! (prism/get-cache-stats prism-client))]
                 (:success result) => true
                 (get-in result [:cache-data :cache-stats :hit-rate]) => 0.85
                 (count (get-in result [:cache-data :cached-items])) => 2))

         (fact "clears cache with correct message identifier"
               (reset! captured-messages [])
               (prism/clear-cache prism-client)
               (first @captured-messages) => (contains {:type :prism.cache/clear}))

         (fact "invalidates specific cache keys"
               (reset! captured-messages [])
               (prism/invalidate-cache-keys prism-client ["setup-config" "user-sessions"])
               (let [message (first @captured-messages)]
                 (:type message) => :prism.cache/invalidate
                 (get-in message [:payload :keys]) => ["setup-config" "user-sessions"])))

(facts "About Prism client cross-language compatibility"
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
                                            :setup_progress {:current_stage "db_init"
                                                           :stages_completed 3}}})))
             prism-client (prism/->PrismClient mock-ws-client {:timeout 5000})]

         (fact "message format is compatible with TypeScript services"
               (prism/create-admin-user prism-client "admin" "password" "password")
               (let [message (first @captured-messages)]
                 ;; Verify kebab-case conversion for cross-language compatibility
                 (get-in message [:payload :username]) => "admin"
                 (get-in message [:payload :password]) => "password"
                 (:type message) => :prism.setup/create-user))

         (fact "handles snake_case responses from TypeScript"
               (let [result (<!! (prism/get-setup-status prism-client))]
                 (:success result) => true
                 (get-in result [:data :processed_by]) => "typescript-service"
                 (get-in result [:data :setup_progress :current_stage]) => "db_init")))

(facts "About Prism client connection management"
       (let [connection-state (atom false)
             connection-attempts (atom 0)
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_]
                                (swap! connection-attempts inc)
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
                                     :data {:result "ok"}})))
             prism-client (prism/->PrismClient mock-ws-client {:timeout 5000})]

         (fact "automatically connects when not connected"
               (reset! connection-state false)
               (reset! connection-attempts 0)
               (prism/get-setup-status prism-client)
               @connection-attempts => 1)

         (fact "reuses existing connection when connected"
               (reset! connection-state true)
               (reset! connection-attempts 0)
               (prism/start-setup prism-client)
               @connection-attempts => 0))

(facts "About Prism client payload validation"
       (let [captured-payloads (atom [])
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (swap! captured-payloads conj payload)
                                (go {:success true})))
             prism-client (prism/->PrismClient mock-ws-client {:timeout 5000})]

         (fact "validates user creation payload structure"
               (prism/create-admin-user prism-client "admin" "password123" "password123")
               (let [payload (first @captured-payloads)]
                 (:username payload) => "admin"
                 (:password payload) => "password123"
                 (:confirm-password payload) => "password123"))

         (fact "handles empty payloads for status requests"
               (reset! captured-payloads [])
               (prism/get-setup-status prism-client)
               (first @captured-payloads) => {}))

(facts "About Prism client timeout handling"
       (let [slow-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (go
                                  ;; Simulate slow setup process
                                  (<! (timeout 300))
                                  {:success true
                                   :data {:result "setup-completed"}})))
             prism-client (prism/->PrismClient slow-ws-client {:timeout 1000})]

         (fact "completes setup operations within reasonable time"
               (let [start (System/currentTimeMillis)
                     result (<!! (prism/start-setup prism-client))
                     duration (- (System/currentTimeMillis) start)]
                 (:success result) => true
                 duration => (roughly 300 100))))

(facts "About Prism client heartbeat mechanism"
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
                                (go {:success true})))]

         (with-redefs [prism/start-heartbeat-scheduler! 
                       (fn [client interval-ms]
                         ;; Simulate heartbeat scheduler
                         (future
                           (dotimes [_ 3]
                             (Thread/sleep 100)
                             (prism/send-heartbeat! client)))
                         #())] ;; Return stop function
           
           (fact "sends periodic heartbeats"
                 (let [client (prism/create-client {:host "localhost"
                                                   :port 3000
                                                   :ws-client mock-ws-client
                                                   :heartbeat-interval 100})]
                   ;; Wait for heartbeats
                   (Thread/sleep 350)
                   @heartbeat-count => (roughly 3 1))))))