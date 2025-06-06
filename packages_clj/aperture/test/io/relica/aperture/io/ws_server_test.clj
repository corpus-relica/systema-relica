(ns io.relica.aperture.io.ws-server-test
  "Tests for WebSocket server functionality and message handling."
  (:require [clojure.test :refer :all]
            [io.relica.aperture.io.ws-server :as ws-server]
            [io.relica.common.websocket.server :as common-ws]
            [io.relica.aperture.test-helpers :as helpers]
            [io.relica.aperture.test-fixtures :as fixtures]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]))

;; App state management tests
(deftest test-app-state-initialization
  (testing "App state is properly initialized"
    (let [state @ws-server/app-state]
      (is (contains? state :clients))
      (is (contains? state :last-status))
      (is (contains? state :files))
      (is (map? (:clients state)))
      (is (map? (:last-status state)))
      (is (map? (:files state)))
      (is (= "OK" (get-in state [:last-status :status])))
      (is (number? (get-in state [:last-status :timestamp])))
      (is (= 0 (get-in state [:last-status :active-users]))))))

(deftest test-app-state-client-tracking
  (testing "App state tracks clients correctly"
    (let [original-state @ws-server/app-state]
      (try
        ;; Reset state for test
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK"
                                                  :timestamp (System/currentTimeMillis)
                                                  :active-users 0}
                                    :files {}})
        
        ;; Add a client
        (swap! ws-server/app-state assoc-in [:clients "test-client"]
               {:connected-at (System/currentTimeMillis)
                :last-active (System/currentTimeMillis)})
        
        (let [state @ws-server/app-state]
          (is (contains? (:clients state) "test-client"))
          (is (number? (get-in state [:clients "test-client" :connected-at])))
          (is (number? (get-in state [:clients "test-client" :last-active]))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

;; Server lifecycle tests
(deftest test-server-start-success
  (testing "Server starts successfully with correct configuration"
    (let [start-calls (atom [])
          create-calls (atom [])
          mock-server {:server :mock-server :port 3456}]
      (with-redefs [common-ws/create-server (fn [config]
                                             (swap! create-calls conj config)
                                             mock-server)
                    common-ws/start! (fn [server]
                                      (swap! start-calls conj server))]
        (let [result (ws-server/start! 3456)]
          (is (= mock-server result))
          (is (= 1 (count @create-calls)))
          (is (= 3456 (:port (first @create-calls))))
          (is (fn? (:event-msg-handler (first @create-calls))))
          (is (= 1 (count @start-calls)))
          (is (= mock-server (first @start-calls)))
          ;; Check that server is stored in app state
          (is (= mock-server (:server @ws-server/app-state))))))))

(deftest test-server-stop-success
  (testing "Server stops successfully and cleans up state"
    (let [stop-calls (atom [])
          mock-server {:server :mock-server}
          original-state @ws-server/app-state]
      (try
        ;; Set up server in state
        (swap! ws-server/app-state assoc :server mock-server)
        
        (with-redefs [common-ws/stop! (fn [server]
                                       (swap! stop-calls conj server))]
          (ws-server/stop! mock-server)
          (is (= 1 (count @stop-calls)))
          (is (= mock-server (first @stop-calls)))
          ;; Check that server is removed from app state
          (is (nil? (:server @ws-server/app-state))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

(deftest test-server-start-with-different-ports
  (testing "Server can be started with different port configurations"
    (let [create-calls (atom [])]
      (with-redefs [common-ws/create-server (fn [config]
                                             (swap! create-calls conj config)
                                             {:mock-server true})
                    common-ws/start! (constantly nil)]
        (doseq [port [2175 8080 9090]]
          (ws-server/start! port))
        (is (= 3 (count @create-calls)))
        (is (= [2175 8080 9090] (map :port @create-calls)))))))

;; Message handler tests
(deftest test-request-status-handler
  (testing "Request status handler updates client activity and responds"
    (let [original-state @ws-server/app-state
          reply-calls (atom [])
          mock-reply-fn (fn [response] (swap! reply-calls conj response))]
      (try
        ;; Reset state for test
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "TEST_OK"
                                                  :timestamp 123456
                                                  :active-users 0}
                                    :files {}})
        
        ;; Test the handler
        (common-ws/handle-ws-message {:type :app/request-status
                                     :uid "test-client"
                                     :?reply-fn mock-reply-fn})
        
        ;; Verify client activity was updated
        (let [state @ws-server/app-state]
          (is (contains? (:clients state) "test-client"))
          (is (number? (get-in state [:clients "test-client" :last-active]))))
        
        ;; Verify reply was sent
        (is (= 1 (count @reply-calls)))
        (is (= {:status "TEST_OK" :timestamp 123456 :active-users 0} (first @reply-calls)))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

(deftest test-heartbeat-handler
  (testing "Heartbeat handler updates client activity"
    (let [original-state @ws-server/app-state]
      (try
        ;; Reset state for test
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}})
        
        ;; Test the handler
        (common-ws/handle-ws-message {:type :relica.app/heartbeat
                                     :uid "heartbeat-client"
                                     :?data {:timestamp (System/currentTimeMillis)}})
        
        ;; Verify client activity was updated
        (let [state @ws-server/app-state]
          (is (contains? (:clients state) "heartbeat-client"))
          (is (number? (get-in state [:clients "heartbeat-client" :last-active]))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

(deftest test-client-connection-handler
  (testing "Client connection handler tracks new clients"
    (let [original-state @ws-server/app-state]
      (try
        ;; Reset state for test
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}})
        
        ;; Test the handler
        (common-ws/handle-ws-message {:type :chsk/uidport-open
                                     :uid "new-client"})
        
        ;; Verify client was added and counts updated
        (let [state @ws-server/app-state]
          (is (contains? (:clients state) "new-client"))
          (is (number? (get-in state [:clients "new-client" :connected-at])))
          (is (number? (get-in state [:clients "new-client" :last-active])))
          (is (= 1 (get-in state [:last-status :active-users]))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

(deftest test-client-disconnection-handler
  (testing "Client disconnection handler removes clients and updates counts"
    (let [original-state @ws-server/app-state]
      (try
        ;; Reset state with existing client
        (reset! ws-server/app-state {:clients {"existing-client" {:connected-at 123456}}
                                    :last-status {:status "OK" :active-users 1}
                                    :files {}})
        
        ;; Test the handler
        (common-ws/handle-ws-message {:type :chsk/uidport-close
                                     :uid "existing-client"})
        
        ;; Verify client was removed and counts updated
        (let [state @ws-server/app-state]
          (is (not (contains? (:clients state) "existing-client")))
          (is (= 0 (get-in state [:last-status :active-users]))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

(deftest test-multiple-client-management
  (testing "Multiple clients can be managed simultaneously"
    (let [original-state @ws-server/app-state]
      (try
        ;; Reset state for test
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}})
        
        ;; Connect multiple clients
        (doseq [client-id ["client-1" "client-2" "client-3"]]
          (common-ws/handle-ws-message {:type :chsk/uidport-open
                                       :uid client-id}))
        
        ;; Verify all clients are tracked
        (let [state @ws-server/app-state]
          (is (= 3 (count (:clients state))))
          (is (= 3 (get-in state [:last-status :active-users])))
          (doseq [client-id ["client-1" "client-2" "client-3"]]
            (is (contains? (:clients state) client-id))))
        
        ;; Disconnect one client
        (common-ws/handle-ws-message {:type :chsk/uidport-close
                                     :uid "client-2"})
        
        ;; Verify count is updated
        (let [state @ws-server/app-state]
          (is (= 2 (count (:clients state))))
          (is (= 2 (get-in state [:last-status :active-users])))
          (is (not (contains? (:clients state) "client-2"))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

;; Broadcast functionality tests
(deftest test-broadcast-with-server
  (testing "Broadcast sends messages when server is available"
    (let [broadcast-calls (atom [])
          mock-server {:server :mock-server}
          original-state @ws-server/app-state]
      (try
        ;; Set up server in state
        (swap! ws-server/app-state assoc :server mock-server)
        
        (with-redefs [common-ws/broadcast! (fn [server message]
                                            (swap! broadcast-calls conj {:server server :message message}))]
          (ws-server/broadcast! "Test message" "info")
          
          (is (= 1 (count @broadcast-calls)))
          (let [call (first @broadcast-calls)]
            (is (= mock-server (:server call)))
            (is (= "Test message" (:message call)))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

(deftest test-broadcast-without-server
  (testing "Broadcast handles missing server gracefully"
    (let [broadcast-calls (atom [])
          original-state @ws-server/app-state]
      (try
        ;; Ensure no server in state
        (swap! ws-server/app-state dissoc :server)
        
        (with-redefs [common-ws/broadcast! (fn [server message]
                                            (swap! broadcast-calls conj {:server server :message message}))]
          (ws-server/broadcast! "Test message" "info")
          
          ;; Should not call broadcast when no server
          (is (= 0 (count @broadcast-calls))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

(deftest test-broadcast-message-format
  (testing "Broadcast formats messages correctly"
    (let [broadcast-calls (atom [])
          mock-server {:server :mock-server}
          original-state @ws-server/app-state]
      (try
        ;; Set up server in state
        (swap! ws-server/app-state assoc :server mock-server)
        
        (with-redefs [common-ws/broadcast! (fn [server message]
                                            (swap! broadcast-calls conj {:server server :message message}))]
          (ws-server/broadcast! "Alert message" "warning")
          
          (is (= 1 (count @broadcast-calls)))
          (let [call (first @broadcast-calls)]
            (is (= "Alert message" (:message call)))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

;; Integration tests
(deftest test-server-lifecycle-integration
  (testing "Complete server lifecycle works correctly"
    (let [server-ops (atom [])
          mock-server {:server :mock-server :port 4567}
          original-state @ws-server/app-state]
      (try
        (with-redefs [common-ws/create-server (fn [config]
                                               (swap! server-ops conj {:op :create :config config})
                                               mock-server)
                      common-ws/start! (fn [server]
                                        (swap! server-ops conj {:op :start :server server}))
                      common-ws/stop! (fn [server]
                                       (swap! server-ops conj {:op :stop :server server}))]
          
          ;; Start server
          (let [started-server (ws-server/start! 4567)]
            (is (= mock-server started-server))
            (is (= mock-server (:server @ws-server/app-state))))
          
          ;; Stop server
          (ws-server/stop! mock-server)
          (is (nil? (:server @ws-server/app-state)))
          
          ;; Verify operation sequence
          (is (= 3 (count @server-ops)))
          (is (= :create (:op (nth @server-ops 0))))
          (is (= :start (:op (nth @server-ops 1))))
          (is (= :stop (:op (nth @server-ops 2)))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

(deftest test-client-connection-lifecycle
  (testing "Client connection and disconnection lifecycle"
    (let [original-state @ws-server/app-state]
      (try
        ;; Reset state for test
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}})
        
        ;; Simulate client connection
        (common-ws/handle-ws-message {:type :chsk/uidport-open
                                     :uid "lifecycle-client"})
        
        ;; Verify client is connected
        (let [state @ws-server/app-state]
          (is (= 1 (count (:clients state))))
          (is (= 1 (get-in state [:last-status :active-users]))))
        
        ;; Simulate client activity
        (common-ws/handle-ws-message {:type :relica.app/heartbeat
                                     :uid "lifecycle-client"
                                     :?data {:timestamp (System/currentTimeMillis)}})
        
        ;; Verify activity was recorded
        (let [state @ws-server/app-state]
          (is (number? (get-in state [:clients "lifecycle-client" :last-active]))))
        
        ;; Simulate client disconnection
        (common-ws/handle-ws-message {:type :chsk/uidport-close
                                     :uid "lifecycle-client"})
        
        ;; Verify client is removed
        (let [state @ws-server/app-state]
          (is (= 0 (count (:clients state))))
          (is (= 0 (get-in state [:last-status :active-users]))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

;; Error handling tests
(deftest test-server-start-error-handling
  (testing "Server start handles errors gracefully"
    (let [error-thrown (atom false)]
      (with-redefs [common-ws/create-server (fn [_]
                                             (reset! error-thrown true)
                                             (throw (Exception. "Server creation failed")))
                    common-ws/start! (constantly nil)]
        (is (thrown? Exception (ws-server/start! 3456)))
        (is @error-thrown)))))

(deftest test-server-stop-error-handling
  (testing "Server stop handles errors gracefully"
    (let [error-thrown (atom false)
          mock-server {:server :mock-server}]
      (with-redefs [common-ws/stop! (fn [_]
                                     (reset! error-thrown true)
                                     (throw (Exception. "Server stop failed")))]
        (is (thrown? Exception (ws-server/stop! mock-server)))
        (is @error-thrown)))))

(deftest test-message-handler-with-nil-data
  (testing "Message handlers handle nil data gracefully"
    (let [original-state @ws-server/app-state]
      (try
        ;; Reset state for test
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}})
        
        ;; Test handlers with nil data
        (is (nil? (common-ws/handle-ws-message {:type :relica.app/heartbeat
                                               :uid "test-client"
                                               :?data nil})))
        
        (is (nil? (common-ws/handle-ws-message {:type :app/request-status
                                               :uid "test-client"
                                               :?reply-fn nil})))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

;; Performance tests
(deftest test-high-volume-client-connections
  (testing "Server handles high volume of client connections"
    (let [original-state @ws-server/app-state
          client-count 100]
      (try
        ;; Reset state for test
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}})
        
        ;; Connect many clients
        (dotimes [i client-count]
          (common-ws/handle-ws-message {:type :chsk/uidport-open
                                       :uid (str "perf-client-" i)}))
        
        ;; Verify all clients are tracked
        (let [state @ws-server/app-state]
          (is (= client-count (count (:clients state))))
          (is (= client-count (get-in state [:last-status :active-users]))))
        
        ;; Disconnect all clients
        (dotimes [i client-count]
          (common-ws/handle-ws-message {:type :chsk/uidport-close
                                       :uid (str "perf-client-" i)}))
        
        ;; Verify all clients are removed
        (let [state @ws-server/app-state]
          (is (= 0 (count (:clients state))))
          (is (= 0 (get-in state [:last-status :active-users]))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))

(deftest test-concurrent-message_handling
  (testing "Server handles concurrent message processing"
    (let [original-state @ws-server/app-state
          message-count 50]
      (try
        ;; Reset state for test
        (reset! ws-server/app-state {:clients {}
                                    :last-status {:status "OK" :active-users 0}
                                    :files {}})
        
        ;; Send many concurrent messages
        (let [futures (doall (for [i (range message-count)]
                              (future
                                (common-ws/handle-ws-message {:type :relica.app/heartbeat
                                                             :uid (str "concurrent-client-" i)
                                                             :?data {:timestamp (System/currentTimeMillis)}}))))]
          ;; Wait for all futures to complete
          (doseq [f futures]
            @f))
        
        ;; Verify all clients were processed
        (let [state @ws-server/app-state]
          (is (= message-count (count (:clients state)))))
        
        (finally
          ;; Restore original state
          (reset! ws-server/app-state original-state))))))
