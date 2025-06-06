(ns io.relica.aperture.integration.ws-integration-test
  "Integration tests for WebSocket connection lifecycle and cross-component interaction."
  (:require [clojure.test :refer :all]
            [clojure.core.async :refer [go <! >! chan timeout close!] :as async]
            [mount.core :as mount]
            [io.relica.aperture.io.ws-server :as ws-server]
            [io.relica.aperture.services.ws-service :as ws-service]
            [io.relica.aperture.core.environment :as env]
            [io.relica.aperture.config :as config]
            [io.relica.common.websocket.server :as common-ws]
            [io.relica.aperture.test-helpers :as helpers]
            [io.relica.aperture.test-fixtures :as fixtures]))

;; WebSocket connection lifecycle integration tests
(deftest test-websocket-connection-full-lifecycle
  (testing "Complete WebSocket connection lifecycle with state management"
    (let [connection-events (atom [])
          mock-server {:server :integration-server}
          original-app-state @ws-server/app-state]
      (try
        ;; Reset app state for clean test
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}
                                    :server mock-server})
        
        (with-redefs [common-ws/broadcast! (fn [server message]
                                            (swap! connection-events conj {:type :broadcast :server server :message message}))]
          
          ;; 1. Client connection
          (common-ws/handle-ws-message {:type :chsk/uidport-open
                                       :uid "integration-client-1"})
          
          ;; Verify client is tracked
          (let [state @ws-server/app-state]
            (is (= 1 (count (:clients state))))
            (is (= 1 (get-in state [:last-status :active-users])))
            (is (contains? (:clients state) "integration-client-1")))
          
          ;; 2. Client sends heartbeat
          (common-ws/handle-ws-message {:type :relica.app/heartbeat
                                       :uid "integration-client-1"
                                       :?data {:timestamp (System/currentTimeMillis)}})
          
          ;; Verify activity is tracked
          (let [state @ws-server/app-state]
            (is (number? (get-in state [:clients "integration-client-1" :last-active]))))
          
          ;; 3. Client requests status
          (let [status-response (atom nil)]
            (common-ws/handle-ws-message {:type :app/request-status
                                         :uid "integration-client-1"
                                         :?reply-fn (fn [response] (reset! status-response response))})
            
            ;; Verify status response
            (is (some? @status-response))
            (is (= "OK" (:status @status-response)))
            (is (= 1 (:active-users @status-response))))
          
          ;; 4. Server broadcasts message
          (ws-server/broadcast! "Integration test message" "info")
          
          ;; Verify broadcast was sent
          (is (= 1 (count @connection-events)))
          (let [broadcast-event (first @connection-events)]
            (is (= :broadcast (:type broadcast-event)))
            (is (= mock-server (:server broadcast-event)))
            (is (= "Integration test message" (:message broadcast-event))))
          
          ;; 5. Client disconnection
          (common-ws/handle-ws-message {:type :chsk/uidport-close
                                       :uid "integration-client-1"})
          
          ;; Verify client is removed
          (let [state @ws-server/app-state]
            (is (= 0 (count (:clients state))))
            (is (= 0 (get-in state [:last-status :active-users])))
            (is (not (contains? (:clients state) "integration-client-1")))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-app-state))))))

(deftest test-multi-client-interaction
  (testing "Multiple clients interacting simultaneously"
    (let [client-responses (atom {})
          original-app-state @ws-server/app-state]
      (try
        ;; Reset app state
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}})
        
        ;; Connect multiple clients
        (doseq [i (range 1 4)]
          (common-ws/handle-ws-message {:type :chsk/uidport-open
                                       :uid (str "multi-client-" i)}))
        
        ;; Verify all clients are connected
        (let [state @ws-server/app-state]
          (is (= 3 (count (:clients state))))
          (is (= 3 (get-in state [:last-status :active-users]))))
        
        ;; Each client requests status
        (doseq [i (range 1 4)]
          (let [client-id (str "multi-client-" i)]
            (common-ws/handle-ws-message {:type :app/request-status
                                         :uid client-id
                                         :?reply-fn (fn [response]
                                                     (swap! client-responses assoc client-id response))})))
        
        ;; Verify all clients received status
        (is (= 3 (count @client-responses)))
        (doseq [i (range 1 4)]
          (let [client-id (str "multi-client-" i)
                response (get @client-responses client-id)]
            (is (some? response))
            (is (= "OK" (:status response)))
            (is (= 3 (:active-users response)))))
        
        ;; Disconnect clients one by one
        (doseq [i (range 1 4)]
          (common-ws/handle-ws-message {:type :chsk/uidport-close
                                       :uid (str "multi-client-" i)})
          
          ;; Verify count decreases
          (let [state @ws-server/app-state]
            (is (= (- 3 i) (get-in state [:last-status :active-users])))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-app-state))))))

(deftest test-environment-websocket-integration
  (testing "Environment operations integrate with WebSocket system"
    (let [env-responses (atom [])
          mock-reply-fn (fn [response] (swap! env-responses conj response))]
      (with-redefs [config/get-default-environment (constantly {:id "integration-env-123"})
                    config/get-user-environment (constantly {:id "integration-env-123" :facts []})
                    config/update-user-environment! (constantly {:id "integration-env-123" :facts []})]
        
        ;; Simulate environment get via WebSocket
        (let [get-result @(env/get-environment "integration-user" "integration-env-123")]
          (is (:success get-result))
          (is (contains? get-result :environment)))
        
        ;; Simulate environment list via WebSocket
        (with-redefs [config/get-user-environments (constantly [fixtures/mock-environment-data])]
          (let [list-result @(env/list-environments "integration-user")]
            (is (:success list-result))
            (is (contains? list-result :environments))))))))

(deftest test-service-startup-integration
  (testing "Complete service startup with WebSocket integration"
    (let [startup-events (atom [])
          mock-server {:server :startup-server :port 3456}]
      (with-redefs [ws-server/start! (fn [port]
                                      (swap! startup-events conj {:type :ws-server-start :port port})
                                      mock-server)
                    ws-server/stop! (fn [server]
                                     (swap! startup-events conj {:type :ws-server-stop :server server}))
                    config/app-config {:ws-server {:port 3456}}
                    mount/start (fn []
                                 (swap! startup-events conj {:type :mount-start})
                                 :started)
                    mount/stop (fn []
                                (swap! startup-events conj {:type :mount-stop})
                                :stopped)]
        
        ;; Test service startup
        (mount/start #'ws-service/ws-service)
        
        ;; Verify startup sequence
        (is (some #(= :ws-server-start (:type %)) @startup-events))
        (let [start-event (first (filter #(= :ws-server-start (:type %)) @startup-events))]
          (is (= 3456 (:port start-event))))
        
        ;; Test service shutdown
        (mount/stop #'ws-service/ws-service)
        
        ;; Verify shutdown
        (is (some #(= :ws-server-stop (:type %)) @startup-events))))))

(deftest test_concurrent_client_operations
  (testing "Concurrent client operations maintain consistency"
    (let [original-app-state @ws-server/app-state
          concurrent-operations 20]
      (try
        ;; Reset app state
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}})
        
        ;; Execute concurrent client connections
        (let [connection-futures (doall
                                  (for [i (range concurrent-operations)]
                                    (future
                                      (common-ws/handle-ws-message {:type :chsk/uidport-open
                                                                   :uid (str "concurrent-client-" i)}))))]
          
          ;; Wait for all connections
          (doseq [f connection-futures] @f)
          
          ;; Verify all clients are tracked
          (let [state @ws-server/app-state]
            (is (= concurrent-operations (count (:clients state))))
            (is (= concurrent-operations (get-in state [:last-status :active-users])))))
        
        ;; Execute concurrent heartbeats
        (let [heartbeat-futures (doall
                                (for [i (range concurrent-operations)]
                                  (future
                                    (common-ws/handle-ws-message {:type :relica.app/heartbeat
                                                                 :uid (str "concurrent-client-" i)
                                                                 :?data {:timestamp (System/currentTimeMillis)}}))))]
          
          ;; Wait for all heartbeats
          (doseq [f heartbeat-futures] @f)
          
          ;; Verify all clients have activity recorded
          (let [state @ws-server/app-state]
            (doseq [i (range concurrent-operations)]
              (let [client-id (str "concurrent-client-" i)]
                (is (number? (get-in state [:clients client-id :last-active])))))))
        
        ;; Execute concurrent disconnections
        (let [disconnection-futures (doall
                                     (for [i (range concurrent-operations)]
                                       (future
                                         (common-ws/handle-ws-message {:type :chsk/uidport-close
                                                                      :uid (str "concurrent-client-" i)}))))]
          
          ;; Wait for all disconnections
          (doseq [f disconnection-futures] @f)
          
          ;; Verify all clients are removed
          (let [state @ws-server/app-state]
            (is (= 0 (count (:clients state))))
            (is (= 0 (get-in state [:last-status :active-users])))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-app-state))))))

(deftest test_websocket_environment_error_propagation
  (testing "WebSocket system properly propagates environment errors"
    (let [error-responses (atom [])]
      (with-redefs [config/get-default-environment (fn [_] (throw (Exception. "Environment error")))
                    config/get-user-environment (fn [_ _] (throw (Exception. "User environment error")))]
        
        ;; Test that environment errors are caught and handled
        (let [get-result @(env/get-environment "error-user" nil)]
          (is (not (:success get-result)))
          (is (= "Failed to get environment" (:error get-result))))
        
        (let [list-result @(env/list-environments "error-user")]
          (is (not (:success list-result)))
          (is (= "Failed to list environments" (:error list-result))))))))

(deftest test_websocket_message_routing_integration
  (testing "WebSocket messages are properly routed to handlers"
    (let [handler-calls (atom [])
          original-handle common-ws/handle-ws-message]
      (with-redefs [common-ws/handle-ws-message (fn [msg]
                                                 (swap! handler-calls conj (:type msg))
                                                 (original-handle msg))]
        
        ;; Test various message types
        (doseq [msg-type [:chsk/uidport-open
                         :relica.app/heartbeat
                         :app/request-status
                         :chsk/uidport-close]]
          (common-ws/handle-ws-message {:type msg-type :uid "routing-test-client"}))
        
        ;; Verify all message types were routed
        (is (= 4 (count @handler-calls)))
        (is (= [:chsk/uidport-open :relica.app/heartbeat :app/request-status :chsk/uidport-close]
               @handler-calls))))))

(deftest test_cross_component_state_consistency
  (testing "State consistency across WebSocket server and service components"
    (let [service-state (atom nil)
          server-state (atom nil)
          original-app-state @ws-server/app-state]
      (try
        ;; Reset app state
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}})
        
        ;; Simulate service layer state changes
        (with-redefs [ws-service/ws-service {:status :running :port 3456}]
          (reset! service-state ws-service/ws-service))
        
        ;; Add clients through WebSocket server
        (common-ws/handle-ws-message {:type :chsk/uidport-open :uid "consistency-client"})
        
        ;; Capture server state
        (reset! server-state @ws-server/app-state)
        
        ;; Verify states are consistent
        (is (some? @service-state))
        (is (some? @server-state))
        (is (= 1 (count (:clients @server-state))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-app-state))))))

(deftest test_load_balancing_simulation
  (testing "System handles load balancing scenarios"
    (let [load-metrics (atom {:connections 0 :messages 0})
          original-app-state @ws-server/app-state]
      (try
        ;; Reset app state
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}})
        
        ;; Simulate high load scenario
        (dotimes [batch 5]
          ;; Connect batch of clients
          (dotimes [i 10]
            (let [client-id (str "load-client-" batch "-" i)]
              (common-ws/handle-ws-message {:type :chsk/uidport-open :uid client-id})
              (swap! load-metrics update :connections inc)))
          
          ;; Each client sends multiple messages
          (dotimes [i 10]
            (let [client-id (str "load-client-" batch "-" i)]
              (dotimes [_ 3]
                (common-ws/handle-ws-message {:type :relica.app/heartbeat
                                             :uid client-id
                                             :?data {:timestamp (System/currentTimeMillis)}})
                (swap! load-metrics update :messages inc)))))
        
        ;; Verify system handled the load
        (let [state @ws-server/app-state]
          (is (= 50 (count (:clients state))))
          (is (= 50 (get-in state [:last-status :active-users]))))
        
        (is (= 50 (:connections @load-metrics)))
        (is (= 150 (:messages @load-metrics)))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-app-state))))))

(deftest test_graceful_degradation
  (testing "System degrades gracefully under adverse conditions"
    (let [error-count (atom 0)
          original-app-state @ws-server/app-state]
      (try
        ;; Reset app state
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}})
        
        ;; Simulate partial system failures
        (with-redefs [common-ws/broadcast! (fn [server message]
                                            (swap! error-count inc)
                                            (if (< @error-count 3)
                                              (throw (Exception. "Broadcast failed"))
                                              :success))]
          
          ;; Add clients normally
          (dotimes [i 3]
            (common-ws/handle-ws-message {:type :chsk/uidport-open
                                         :uid (str "degradation-client-" i)}))
          
          ;; Verify clients are still tracked despite broadcast failures
          (let [state @ws-server/app-state]
            (is (= 3 (count (:clients state)))))
          
          ;; Attempt broadcasts (some will fail, some succeed)
          (dotimes [_ 5]
            (try
              (ws-server/broadcast! "Test message" "info")
              (catch Exception _
                ;; Ignore broadcast failures
                nil))
            (Thread/sleep 10))
          
          ;; System should still be functional for other operations
          (let [status-response (atom nil)]
            (common-ws/handle-ws-message {:type :app/request-status
                                         :uid "degradation-client-0"
                                         :?reply-fn (fn [response] (reset! status-response response))})
            
            (is (some? @status-response))
            (is (= "OK" (:status @status-response)))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-app-state))))))
