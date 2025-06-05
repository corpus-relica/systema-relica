(ns io.relica.archivist.io.ws-connection-test
  (:require [clojure.test :refer [deftest testing is use-fixtures]]
            [clojure.core.async :as async :refer [<! >! go chan <!! >!! timeout]]
            [io.relica.archivist.test-helpers :as helpers]
            [io.relica.archivist.utils.response :as response]
            [io.relica.common.websocket.client :as ws-client]
            [clojure.tools.logging :as log]))

;; ==========================================================================
;; WebSocket Connection Lifecycle Tests
;; ==========================================================================

(defonce ^:private test-connections (atom []))

(defn create-mock-websocket-connection
  "Create a mock WebSocket connection for testing"
  [connection-id & {:keys [auto-disconnect-after]
                    :or {auto-disconnect-after nil}}]
  (let [connection-state (atom {:id connection-id
                                :connected false
                                :messages-sent []
                                :messages-received []
                                :errors []
                                :last-heartbeat nil})
        connection {:id connection-id
                    :state connection-state
                    :connect! (fn []
                                (swap! connection-state assoc :connected true :connect-time (System/currentTimeMillis))
                                (when auto-disconnect-after
                                  (go
                                    (<! (timeout auto-disconnect-after))
                                    (swap! connection-state assoc :connected false :disconnect-time (System/currentTimeMillis)))))
                    :disconnect! (fn []
                                   (swap! connection-state assoc :connected false :disconnect-time (System/currentTimeMillis)))
                    :send-message! (fn [msg-type data]
                                     (if (:connected @connection-state)
                                       (do
                                         (swap! connection-state update :messages-sent conj {:type msg-type :data data :timestamp (System/currentTimeMillis)})
                                         (go {:success true :data {:echo msg-type}}))
                                       (do
                                         (swap! connection-state update :errors conj {:error "Connection not established" :timestamp (System/currentTimeMillis)})
                                         (go {:success false :error {:code 1003 :type "connection-error" :message "Connection not established"}}))))
                    :heartbeat! (fn []
                                  (when (:connected @connection-state)
                                    (swap! connection-state assoc :last-heartbeat (System/currentTimeMillis))
                                    true))
                    :connected? (fn [] (:connected @connection-state))
                    :get-stats (fn [] @connection-state)}]
    (swap! test-connections conj connection)
    connection))

(defn cleanup-test-connections!
  "Clean up all test connections"
  []
  (doseq [conn @test-connections]
    (when ((:connected? conn))
      ((:disconnect! conn))))
  (reset! test-connections []))

(use-fixtures :each (fn [f] (f) (cleanup-test-connections!)))

;; Connection Lifecycle Tests
(deftest websocket-connection-lifecycle-test
  (testing "connection can be established successfully"
    (let [conn (create-mock-websocket-connection "test-conn-1")]
      (is (false? ((:connected? conn))))
      ((:connect! conn))
      (is (true? ((:connected? conn))))
      (is (<= (Math/abs (- (get-in ((:get-stats conn)) [:connect-time]) (System/currentTimeMillis))) 1000))))

  (testing "connection can be disconnected gracefully"
    (let [conn (create-mock-websocket-connection "test-conn-2")]
      ((:connect! conn))
      (is (true? ((:connected? conn))))
      ((:disconnect! conn))
      (is (false? ((:connected? conn))))
      (is (<= (Math/abs (- (get-in ((:get-stats conn)) [:disconnect-time]) (System/currentTimeMillis))) 1000))))

  (testing "connection handles auto-disconnect scenarios"
    (let [conn (create-mock-websocket-connection "test-conn-3" :auto-disconnect-after 100)]
      ((:connect! conn))
      (is (true? ((:connected? conn))))
      ;; Wait for auto-disconnect
      (<!! (timeout 150))
      (is (false? ((:connected? conn))))))

  (testing "connection tracks message sending when connected"
    (let [conn (create-mock-websocket-connection "test-conn-4")]
      ((:connect! conn))
      (let [response (<!! ((:send-message! conn) :test/ping {:ping "test"}))]
        (is (:success response))
        (is (= 1 (count (get-in ((:get-stats conn)) [:messages-sent]))))
        (is (= :test/ping (get-in ((:get-stats conn)) [:messages-sent 0 :type]))))))

  (testing "connection handles message sending when disconnected"
    (let [conn (create-mock-websocket-connection "test-conn-5")]
      ;; Don't connect
      (let [response (<!! ((:send-message! conn) :test/ping {:ping "test"}))]
        (is (false? (:success response)))
        (is (= "connection-error" (get-in response [:error :type])))
        (is (= 1 (count (get-in ((:get-stats conn)) [:errors])))))))

  (testing "connection heartbeat works when connected"
    (let [conn (create-mock-websocket-connection "test-conn-6")]
      ((:connect! conn))
      (is (true? ((:heartbeat! conn))))
      (is (<= (Math/abs (- (get-in ((:get-stats conn)) [:last-heartbeat]) (System/currentTimeMillis))) 1000))))

  (testing "connection heartbeat fails when disconnected"
    (let [conn (create-mock-websocket-connection "test-conn-7")]
      ;; Don't connect
      (is (nil? ((:heartbeat! conn)))))))

;; ==========================================================================
;; WebSocket Message Queue and Delivery Tests
;; ==========================================================================

(defn create-message-queue-mock
  "Create a mock message queue for testing delivery guarantees"
  []
  (let [queue (atom {:pending [] :delivered [] :failed [] :retry-count 0})]
    {:queue queue
     :enqueue! (fn [message]
                 (swap! queue update :pending conj (assoc message :enqueue-time (System/currentTimeMillis))))
     :process-pending! (fn [success-rate]
                         (let [pending (:pending @queue)]
                           (doseq [msg pending]
                             (if (< (rand) success-rate)
                               (swap! queue (fn [q] (-> q
                                                         (update :delivered conj (assoc msg :delivery-time (System/currentTimeMillis)))
                                                         (update :pending (fn [p] (remove #(= % msg) p))))))
                               (swap! queue (fn [q] (-> q
                                                         (update :failed conj (assoc msg :failure-time (System/currentTimeMillis)))
                                                         (update :pending (fn [p] (remove #(= % msg) p)))
                                                         (update :retry-count inc))))))))
     :get-stats (fn [] @queue)
     :retry-failed! (fn []
                      (let [failed (:failed @queue)]
                        (swap! queue (fn [q] (-> q
                                                  (update :pending concat failed)
                                                  (assoc :failed []))))))}))

(deftest websocket-message-queuing-test
  (testing "messages can be enqueued successfully"
    (let [queue (create-message-queue-mock)]
      ((:enqueue! queue) {:type :test/message :data {:test "data"}})
      (is (= 1 (count (get-in ((:get-stats queue)) [:pending]))))
      (is (= :test/message (get-in ((:get-stats queue)) [:pending 0 :type])))))

  (testing "messages are delivered with high success rate"
    (let [queue (create-message-queue-mock)]
      ((:enqueue! queue) {:type :test/message1 :data {:test "data1"}})
      ((:enqueue! queue) {:type :test/message2 :data {:test "data2"}})
      ((:enqueue! queue) {:type :test/message3 :data {:test "data3"}})
      ((:process-pending! queue) 1.0) ; 100% success rate
      (is (= 3 (count (get-in ((:get-stats queue)) [:delivered]))))
      (is (= 0 (count (get-in ((:get-stats queue)) [:pending]))))
      (is (= 0 (count (get-in ((:get-stats queue)) [:failed]))))))

  (testing "failed messages can be retried"
    (let [queue (create-message-queue-mock)]
      ((:enqueue! queue) {:type :test/message1 :data {:test "data1"}})
      ((:enqueue! queue) {:type :test/message2 :data {:test "data2"}})
      ((:process-pending! queue) 0.0) ; 0% success rate - all fail
      (is (= 2 (count (get-in ((:get-stats queue)) [:failed]))))
      (is (= 0 (count (get-in ((:get-stats queue)) [:pending]))))
      
      ;; Retry failed messages
      ((:retry-failed! queue))
      (is (= 2 (count (get-in ((:get-stats queue)) [:pending]))))
      (is (= 0 (count (get-in ((:get-stats queue)) [:failed]))))
      
      ;; Process with 100% success rate
      ((:process-pending! queue) 1.0)
      (is (= 2 (count (get-in ((:get-stats queue)) [:delivered])))))))

;; ==========================================================================
;; WebSocket Performance and Load Tests
;; ==========================================================================

(defn simulate-high-throughput-scenario
  "Simulate high throughput WebSocket operations"
  [num-messages concurrent-connections]
  (let [results (atom {:messages-sent 0
                       :messages-delivered 0
                       :errors 0
                       :start-time (System/currentTimeMillis)
                       :end-time nil
                       :throughput 0})
        connections (mapv #(create-mock-websocket-connection (str "perf-conn-" %)) 
                          (range concurrent-connections))]
    
    ;; Connect all connections
    (doseq [conn connections]
      ((:connect! conn)))
    
    ;; Send messages concurrently
    (let [send-channel (chan)
          completion-channel (chan)]
      
      ;; Start message senders
      (doseq [i (range concurrent-connections)]
        (go
          (let [conn (nth connections i)
                messages-per-conn (/ num-messages concurrent-connections)]
            (doseq [j (range messages-per-conn)]
              (let [response (<! ((:send-message! conn) :perf/test {:msg-id j :conn-id i}))]
                (if (:success response)
                  (swap! results update :messages-delivered inc)
                  (swap! results update :errors inc))
                (swap! results update :messages-sent inc)))
            (>! completion-channel i))))
      
      ;; Wait for all senders to complete
      (<!! (go
             (doseq [_ (range concurrent-connections)]
               (<! completion-channel))
             (swap! results assoc :end-time (System/currentTimeMillis))))
      
      ;; Calculate throughput
      (let [stats @results
            duration-ms (- (:end-time stats) (:start-time stats))
            throughput (if (> duration-ms 0)
                         (/ (:messages-delivered stats) (/ duration-ms 1000.0))
                         0)]
        (swap! results assoc :throughput throughput))
      
      ;; Cleanup
      (doseq [conn connections]
        ((:disconnect! conn)))
      
      @results)))

(deftest websocket-performance-test
  (testing "system can handle moderate message throughput"
    (let [results (simulate-high-throughput-scenario 100 5)]
      (is (= 100 (:messages-sent results)))
      (is (= 100 (:messages-delivered results)))
      (is (= 0 (:errors results)))
      (is (> (:throughput results) 10)))) ; At least 10 messages per second

  (testing "system maintains performance under concurrent connections"
    (let [results (simulate-high-throughput-scenario 200 10)]
      (is (= 200 (:messages-sent results)))
      (is (= 200 (:messages-delivered results)))
      (is (= 0 (:errors results)))
      (is (> (:throughput results) 5)))) ; At least 5 messages per second

  (testing "system provides performance metrics"
    (let [results (simulate-high-throughput-scenario 50 3)]
      (is (contains? results :start-time))
      (is (contains? results :end-time))
      (is (contains? results :throughput))
      (is (< (:start-time results) (:end-time results))))))

;; ==========================================================================
;; WebSocket Error Recovery Tests
;; ==========================================================================

(defn create-unreliable-connection
  "Create a connection that fails randomly to test error recovery"
  [connection-id failure-rate]
  (let [connection-state (atom {:id connection-id
                                :connected false
                                :failure-count 0
                                :recovery-attempts 0
                                :messages-sent []})
        base-conn (create-mock-websocket-connection connection-id)]
    (merge base-conn
           {:send-message! (fn [msg-type data]
                             (if (< (rand) failure-rate)
                               (do
                                 (swap! connection-state update :failure-count inc)
                                 (go {:success false :error {:code 1004 :type "network-error" :message "Simulated network failure"}}))
                               ((:send-message! base-conn) msg-type data)))
            :recover! (fn []
                        (swap! connection-state update :recovery-attempts inc)
                        ((:connect! base-conn)))
            :get-extended-stats (fn [] (merge ((:get-stats base-conn)) @connection-state))})))

(deftest websocket-error-recovery-test
  (testing "connection can recover from network failures"
    (let [conn (create-unreliable-connection "recovery-conn-1" 0.7)] ; 70% failure rate
      ((:connect! conn))
      
      ;; Send multiple messages, expect some failures
      (let [responses (doall (for [i (range 10)]
                               (<!! ((:send-message! conn) :test/recovery {:attempt i}))))]
        (is (some #(not (:success %)) responses)) ; At least one failure expected
        
        ;; Check that failures were recorded
        (is (> (get-in ((:get-extended-stats conn)) [:failure-count]) 0)))
      
      ;; Attempt recovery
      ((:recover! conn))
      (is (= 1 (get-in ((:get-extended-stats conn)) [:recovery-attempts])))))

  (testing "connection tracks failure patterns for diagnostics"
    (let [conn (create-unreliable-connection "recovery-conn-2" 0.5)] ; 50% failure rate
      ((:connect! conn))
      
      ;; Send messages and track patterns
      (doseq [i (range 20)]
        (<!! ((:send-message! conn) :test/pattern {:attempt i})))
      
      (let [stats ((:get-extended-stats conn))]
        (is (and (> (:failure-count stats) 0) (< (:failure-count stats) 20)))
        (is (> (count (:messages-sent stats)) 0))))))

;; ==========================================================================
;; WebSocket Reconnection Logic Tests  
;; ==========================================================================

(defn create-reconnecting-connection
  "Create a connection with automatic reconnection logic"
  [connection-id max-retries retry-delay-ms]
  (let [connection-state (atom {:id connection-id
                                :connected false
                                :retry-count 0
                                :max-retries max-retries
                                :last-disconnect-time nil
                                :reconnection-attempts []})
        base-conn (create-mock-websocket-connection connection-id)]
    (merge base-conn
           {:auto-reconnect! (fn []
                               (go
                                 (while (and (< (:retry-count @connection-state) max-retries)
                                             (not (:connected @connection-state)))
                                   (swap! connection-state update :retry-count inc)
                                   (swap! connection-state update :reconnection-attempts conj (System/currentTimeMillis))
                                   (<! (timeout retry-delay-ms))
                                   ((:connect! base-conn)))))
            :simulate-disconnect! (fn []
                                    (swap! connection-state assoc :last-disconnect-time (System/currentTimeMillis))
                                    ((:disconnect! base-conn)))
            :get-reconnection-stats (fn [] @connection-state)})))

(deftest websocket-reconnection-logic-test
  (testing "connection attempts reconnection after disconnect"
    (let [conn (create-reconnecting-connection "reconnect-conn-1" 3 50)]
      ((:connect! conn))
      (is (true? ((:connected? conn))))
      
      ;; Simulate disconnect
      ((:simulate-disconnect! conn))
      (is (false? ((:connected? conn))))
      
      ;; Start auto-reconnection
      ((:auto-reconnect! conn))
      
      ;; Wait for reconnection attempts
      (<!! (timeout 200))
      
      (let [stats ((:get-reconnection-stats conn))]
        (is (> (:retry-count stats) 0))
        (is (> (count (:reconnection-attempts stats)) 0)))))

  (testing "connection respects maximum retry limits"
    (let [conn (create-reconnecting-connection "reconnect-conn-2" 2 30)]
      ;; Don't connect initially so reconnection will fail
      ((:auto-reconnect! conn))
      
      ;; Wait for all retry attempts
      (<!! (timeout 150))
      
      (let [stats ((:get-reconnection-stats conn))]
        (is (= 2 (:retry-count stats))) ; Should not exceed max-retries
        (is (= 2 (count (:reconnection-attempts stats))))))))