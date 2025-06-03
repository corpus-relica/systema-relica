(ns io.relica.archivist.io.ws-connection-test
  (:require [midje.sweet :refer :all]
            [clojure.core.async :as async :refer [<! >! go chan <!! >!! timeout]]
            [io.relica.archivist.test-helpers :as helpers]
            [io.relica.archivist.utils.response :as response]
            [io.relica.common.websocket.client :as ws-client]
            [clojure.test :refer [deftest is testing]]
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

;; Connection Lifecycle Tests
(facts "about WebSocket connection lifecycle"
  (background (after :facts (cleanup-test-connections!)))

  (fact "connection can be established successfully"
    (let [conn (create-mock-websocket-connection "test-conn-1")]
      ((:connected? conn)) => false
      ((:connect! conn))
      ((:connected? conn)) => true
      (get-in ((:get-stats conn)) [:connect-time]) => (roughly (System/currentTimeMillis) 1000)))

  (fact "connection can be disconnected gracefully"
    (let [conn (create-mock-websocket-connection "test-conn-2")]
      ((:connect! conn))
      ((:connected? conn)) => true
      ((:disconnect! conn))
      ((:connected? conn)) => false
      (get-in ((:get-stats conn)) [:disconnect-time]) => (roughly (System/currentTimeMillis) 1000)))

  (fact "connection handles auto-disconnect scenarios"
    (let [conn (create-mock-websocket-connection "test-conn-3" :auto-disconnect-after 100)]
      ((:connect! conn))
      ((:connected? conn)) => true
      ;; Wait for auto-disconnect
      (<!! (timeout 150))
      ((:connected? conn)) => false))

  (fact "connection tracks message sending when connected"
    (let [conn (create-mock-websocket-connection "test-conn-4")]
      ((:connect! conn))
      (let [response (<!! ((:send-message! conn) :test/ping {:ping "test"}))]
        (:success response) => true
        (count (get-in ((:get-stats conn)) [:messages-sent])) => 1
        (get-in ((:get-stats conn)) [:messages-sent 0 :type]) => :test/ping)))

  (fact "connection handles message sending when disconnected"
    (let [conn (create-mock-websocket-connection "test-conn-5")]
      ;; Don't connect
      (let [response (<!! ((:send-message! conn) :test/ping {:ping "test"}))]
        (:success response) => false
        (get-in response [:error :type]) => "connection-error"
        (count (get-in ((:get-stats conn)) [:errors])) => 1)))

  (fact "connection heartbeat works when connected"
    (let [conn (create-mock-websocket-connection "test-conn-6")]
      ((:connect! conn))
      ((:heartbeat! conn)) => true
      (get-in ((:get-stats conn)) [:last-heartbeat]) => (roughly (System/currentTimeMillis) 1000)))

  (fact "connection heartbeat fails when disconnected"
    (let [conn (create-mock-websocket-connection "test-conn-7")]
      ;; Don't connect
      ((:heartbeat! conn)) => falsy)))

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

(facts "about WebSocket message queuing and delivery"
  (fact "messages can be enqueued successfully"
    (let [queue (create-message-queue-mock)]
      ((:enqueue! queue) {:type :test/message :data {:test "data"}})
      (count (get-in ((:get-stats queue)) [:pending])) => 1
      (get-in ((:get-stats queue)) [:pending 0 :type]) => :test/message))

  (fact "messages are delivered with high success rate"
    (let [queue (create-message-queue-mock)]
      ((:enqueue! queue) {:type :test/message1 :data {:test "data1"}})
      ((:enqueue! queue) {:type :test/message2 :data {:test "data2"}})
      ((:enqueue! queue) {:type :test/message3 :data {:test "data3"}})
      ((:process-pending! queue) 1.0) ; 100% success rate
      (count (get-in ((:get-stats queue)) [:delivered])) => 3
      (count (get-in ((:get-stats queue)) [:pending])) => 0
      (count (get-in ((:get-stats queue)) [:failed])) => 0))

  (fact "failed messages can be retried"
    (let [queue (create-message-queue-mock)]
      ((:enqueue! queue) {:type :test/message1 :data {:test "data1"}})
      ((:enqueue! queue) {:type :test/message2 :data {:test "data2"}})
      ((:process-pending! queue) 0.0) ; 0% success rate - all fail
      (count (get-in ((:get-stats queue)) [:failed])) => 2
      (count (get-in ((:get-stats queue)) [:pending])) => 0
      
      ;; Retry failed messages
      ((:retry-failed! queue))
      (count (get-in ((:get-stats queue)) [:pending])) => 2
      (count (get-in ((:get-stats queue)) [:failed])) => 0
      
      ;; Process with 100% success rate
      ((:process-pending! queue) 1.0)
      (count (get-in ((:get-stats queue)) [:delivered])) => 2)))

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

(facts "about WebSocket performance characteristics"
  (fact "system can handle moderate message throughput"
    (let [results (simulate-high-throughput-scenario 100 5)]
      (:messages-sent results) => 100
      (:messages-delivered results) => 100
      (:errors results) => 0
      (:throughput results) => (checker [actual] (> actual 10)))) ; At least 10 messages per second

  (fact "system maintains performance under concurrent connections"
    (let [results (simulate-high-throughput-scenario 200 10)]
      (:messages-sent results) => 200
      (:messages-delivered results) => 200
      (:errors results) => 0
      (:throughput results) => (checker [actual] (> actual 5)))) ; At least 5 messages per second

  (fact "system provides performance metrics"
    (let [results (simulate-high-throughput-scenario 50 3)]
      (contains? results :start-time) => true
      (contains? results :end-time) => true
      (contains? results :throughput) => true
      (< (:start-time results) (:end-time results)) => true)))

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

(facts "about WebSocket error recovery"
  (background (after :facts (cleanup-test-connections!)))

  (fact "connection can recover from network failures"
    (let [conn (create-unreliable-connection "recovery-conn-1" 0.7)] ; 70% failure rate
      ((:connect! conn))
      
      ;; Send multiple messages, expect some failures
      (let [responses (doall (for [i (range 10)]
                               (<!! ((:send-message! conn) :test/recovery {:attempt i}))))]
        (some #(not (:success %)) responses) => true ; At least one failure expected
        
        ;; Check that failures were recorded
        (get-in ((:get-extended-stats conn)) [:failure-count]) => (checker [actual] (> actual 0)))
      
      ;; Attempt recovery
      ((:recover! conn))
      (get-in ((:get-extended-stats conn)) [:recovery-attempts]) => 1))

  (fact "connection tracks failure patterns for diagnostics"
    (let [conn (create-unreliable-connection "recovery-conn-2" 0.5)] ; 50% failure rate
      ((:connect! conn))
      
      ;; Send messages and track patterns
      (doseq [i (range 20)]
        (<!! ((:send-message! conn) :test/pattern {:attempt i})))
      
      (let [stats ((:get-extended-stats conn))]
        (:failure-count stats) => (checker [actual] (and (> actual 0) (< actual 20)))
        (count (:messages-sent stats)) => (checker [actual] (> actual 0))))))

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

(facts "about WebSocket reconnection logic"
  (background (after :facts (cleanup-test-connections!)))

  (fact "connection attempts reconnection after disconnect"
    (let [conn (create-reconnecting-connection "reconnect-conn-1" 3 50)]
      ((:connect! conn))
      ((:connected? conn)) => true
      
      ;; Simulate disconnect
      ((:simulate-disconnect! conn))
      ((:connected? conn)) => false
      
      ;; Start auto-reconnection
      ((:auto-reconnect! conn))
      
      ;; Wait for reconnection attempts
      (<!! (timeout 200))
      
      (let [stats ((:get-reconnection-stats conn))]
        (:retry-count stats) => (checker [actual] (> actual 0))
        (count (:reconnection-attempts stats)) => (checker [actual] (> actual 0)))))

  (fact "connection respects maximum retry limits"
    (let [conn (create-reconnecting-connection "reconnect-conn-2" 2 30)]
      ;; Don't connect initially so reconnection will fail
      ((:auto-reconnect! conn))
      
      ;; Wait for all retry attempts
      (<!! (timeout 150))
      
      (let [stats ((:get-reconnection-stats conn))]
        (:retry-count stats) => 2 ; Should not exceed max-retries
        (count (:reconnection-attempts stats)) => 2))))