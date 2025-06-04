(ns io.relica.common.io.prism-client-test
  "Comprehensive tests for the Prism client including message identifiers, error handling,
   setup operations, cache management, and cross-language compatibility."
  (:require [clojure.test :refer [deftest testing is]]
            [io.relica.common.io.prism-client :as prism]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout <!! close! alts!]]))

(deftest prism-client-message-identifiers-test
  (testing "About Prism client message identifiers"
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
      (testing "get-setup-status uses standardized message identifier"
        (prism/get-setup-status prism-client)
        (is (= :prism.setup/get-status (:type (first @captured-messages)))))

      (testing "start-setup uses standardized message identifier"
        (reset! captured-messages [])
        (prism/start-setup prism-client)
        (is (= :prism.setup/start (:type (first @captured-messages)))))

      (testing "create-admin-user uses standardized message identifier"
        (reset! captured-messages [])
        (prism/create-admin-user prism-client "admin" "password" "password")
        (is (= :prism.setup/create-user (:type (first @captured-messages)))))

      (testing "process-setup-stage uses standardized message identifier"
        (reset! captured-messages [])
        (prism/process-setup-stage prism-client)
        (is (= :prism.setup/process-stage (:type (first @captured-messages)))))

      (testing "send-heartbeat! uses standardized message identifier"
        (reset! captured-messages [])
        (prism/send-heartbeat! prism-client)
        (is (= :relica.app/heartbeat (:type (first @captured-messages)))))

      ;; Test cache operations
      (testing "rebuild-cache uses standardized message identifier"
        (reset! captured-messages [])
        (prism/rebuild-cache prism-client ["setup-config" "user-sessions"])
        (is (= :prism.cache/rebuild (:type (first @captured-messages)))))

      (testing "cancel-cache-rebuild uses standardized message identifier"
        (reset! captured-messages [])
        (prism/cancel-cache-rebuild prism-client)
        (is (= :prism.cache/rebuild-cancel (:type (first @captured-messages))))))))

(deftest prism-client-factory-function-test
  (testing "About Prism client factory function"
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

            (testing "Client registers handlers with standardized message identifiers"
              (is (contains? (set (keys @registered-handlers)) :prism.setup/update)))))))))

(deftest prism-client-error-handling-test
  (testing "About Prism client error handling"
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

      (testing "handles setup errors gracefully"
        (let [result (<!! (prism/get-setup-status prism-client))]
          (is (= false (:success result)))
          (is (= "SETUP_ERROR" (get-in result [:error :code])))))

      (testing "handles user creation errors"
        (let [result (<!! (prism/create-admin-user prism-client "admin" "weak" "weak"))]
          (is (= false (:success result)))
          (is (= "USER_CREATION_ERROR" (get-in result [:error :code])))
          (is (.contains (get-in result [:error :message]) "Password validation"))))

      (testing "handles concurrent setup attempts"
        (let [result (<!! (prism/start-setup prism-client))]
          (is (= false (:success result)))
          (is (= "SETUP_ALREADY_RUNNING" (get-in result [:error :code]))))))))

(deftest prism-client-setup-operations-test
  (testing "About Prism client setup operations"
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

      (testing "retrieves setup status correctly"
        (let [result (<!! (prism/get-setup-status prism-client))]
          (is (= true (:success result)))
          (is (= "in-progress" (get-in result [:setup-state :status])))
          (is (= 60 (get-in result [:setup-state :progress-percentage])))
          (is (= 2 (count (get-in result [:setup-state :completed-stages]))))))

      (testing "initiates setup process"
        (let [result (<!! (prism/start-setup prism-client))]
          (is (= true (:success result)))
          (is (= "setup-12345" (get-in result [:setup-id])))
          (is (.contains (:message result) "initiated"))))

      (testing "creates admin user successfully"
        (let [result (<!! (prism/create-admin-user prism-client "admin" "strong-password" "strong-password"))]
          (is (= true (:success result)))
          (is (= "admin" (get-in result [:user :username])))
          (is (= "admin" (get-in result [:user :role])))))

      (testing "processes setup stages"
        (let [result (<!! (prism/process-setup-stage prism-client))]
          (is (= true (:success result)))
          (is (= "completed" (get-in result [:stage-result :status]))))))))

(deftest prism-client-cache-management-test
  (testing "About Prism client cache management"
    (let [captured-messages (atom [])
          mock-cache-response {:success true
                              :cache-rebuild {:id "rebuild-123"
                                             :types ["setup-config" "user-sessions"]
                                             :status "started"
                                             :estimated-duration-ms 30000}}
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
                                   :prism.cache/rebuild
                                   mock-cache-response
                                   :prism.cache/rebuild-cancel
                                   {:success true
                                    :message "Cache rebuild cancelled"}
                                   {:success true}))))
          prism-client (prism/->PrismClient mock-ws-client {:timeout 5000})]

      (testing "rebuilds cache with specified types"
        (let [result (<!! (prism/rebuild-cache prism-client ["setup-config" "user-sessions"]))]
          (is (= true (:success result)))
          (is (= ["setup-config" "user-sessions"] (get-in result [:cache-rebuild :types])))))

      (testing "rebuild-cache uses correct message identifier"
        (reset! captured-messages [])
        (prism/rebuild-cache prism-client ["setup-config"])
        (is (= :prism.cache/rebuild (:type (first @captured-messages)))))

      (testing "cancel-cache-rebuild sends correct message"
        (reset! captured-messages [])
        (let [result (<!! (prism/cancel-cache-rebuild prism-client))]
          (is (= true (:success result)))
          (is (= :prism.cache/rebuild-cancel (:type (first @captured-messages)))))))))

(deftest prism-client-cross-language-compatibility-test
  (testing "About Prism client cross-language compatibility"
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

      (testing "message format is compatible with TypeScript services"
        (prism/create-admin-user prism-client "admin" "password" "password")
        (let [message (first @captured-messages)]
          ;; Verify kebab-case conversion for cross-language compatibility
          (is (= "admin" (get-in message [:payload :username])))
          (is (= "password" (get-in message [:payload :password])))
          (is (= :prism.setup/create-user (:type message)))))

      (testing "handles snake_case responses from TypeScript"
        (let [result (<!! (prism/get-setup-status prism-client))]
          (is (= true (:success result)))
          (is (= "typescript-service" (get-in result [:data :processed_by])))
          (is (= "db_init" (get-in result [:data :setup_progress :current_stage]))))))))

(deftest prism-client-connection-management-test
  (testing "About Prism client connection management"
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

      (testing "tracks connection state correctly"
        ;; Start disconnected
        (reset! connection-state false)
        (is (= false (prism/connected? prism-client)))
        
        ;; Connect and verify
        (reset! connection-state true)
        (is (= true (prism/connected? prism-client))))

      (testing "connection state changes are reflected"
        (reset! connection-state true)
        (is (= true (prism/connected? prism-client)))
        (reset! connection-state false)
        (is (= false (prism/connected? prism-client)))))))

(deftest prism-client-payload-validation-test
  (testing "About Prism client payload validation"
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

      (testing "validates user creation payload structure"
        (prism/create-admin-user prism-client "admin" "password123" "password123")
        (let [payload (first @captured-payloads)]
          (is (= "admin" (:username payload)))
          (is (= "password123" (:password payload)))
          (is (= "password123" (:confirmPassword payload)))))

      (testing "handles empty payloads for status requests"
        (reset! captured-payloads [])
        (prism/get-setup-status prism-client)
        (is (= {} (first @captured-payloads))))

      (testing "cache rebuild includes cache types"
        (reset! captured-payloads [])
        (prism/rebuild-cache prism-client ["config" "sessions"])
        (let [payload (first @captured-payloads)]
          (is (= ["config" "sessions"] (:cache-types payload)))
          (is (not (nil? (:timestamp payload)))))))))

(deftest prism-client-timeout-handling-test
  (testing "About Prism client timeout handling"
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

      (testing "completes setup operations within reasonable time"
        (let [start (System/currentTimeMillis)
              result (<!! (prism/start-setup prism-client))
              duration (- (System/currentTimeMillis) start)]
          (is (= true (:success result)))
          (is (> duration 250))  ; At least 250ms
          (is (< duration 500)))))))  ; Less than 500ms

(deftest prism-client-heartbeat-mechanism-test
  (testing "About Prism client heartbeat mechanism"
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
                             (go {:success true})))
          prism-client (prism/->PrismClient mock-ws-client {:timeout 5000})]

      (testing "sends heartbeat messages"
        (prism/send-heartbeat! prism-client)
        (is (= 1 @heartbeat-count)))

      (testing "heartbeat includes timestamp"
        (let [captured-payloads (atom [])
              mock-ws-heartbeat (reify ws/WebSocketClientProtocol
                                (connect! [_] true)
                                (disconnect! [_] true)
                                (connected? [_] true)
                                (register-handler! [_ _ _] nil)
                                (unregister-handler! [_ _] nil)
                                (send-message! [_ type payload timeout-ms]
                                  (swap! captured-payloads conj payload)
                                  (go {:success true})))
              heartbeat-client (prism/->PrismClient mock-ws-heartbeat {:timeout 5000})]
          (prism/send-heartbeat! heartbeat-client)
          (let [payload (first @captured-payloads)]
            (is (not (nil? (:timestamp payload))))))))))
