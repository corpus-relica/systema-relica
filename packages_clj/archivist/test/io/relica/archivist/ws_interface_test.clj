(ns io.relica.archivist.ws-interface-test
  (:require [midje.sweet :refer :all]
            [clojure.core.async :as async :refer [<! >! go chan <!! >!!]]
            [io.relica.common.websocket.client :as ws]
            [io.relica.archivist.utils.response :as response]
            [clojure.string :as str]))

;; ==========================================================================
;; WebSocket Client Setup
;; ==========================================================================

(defonce ^:private client-config-atom (atom nil))
(defonce ^:private client-atom (atom nil))

(defn set-config!
  "Set the WebSocket client configuration"
  [config]
  (reset! client-config-atom config))

(defn get-client
  "Get a connected WebSocket client, connecting if necessary"
  []
  (when (nil? @client-atom)
    (if-let [config @client-config-atom]
      (let [client (ws/create-client config)]
        (ws/connect! client)
        (reset! client-atom client))
      (throw (ex-info "WebSocket client not configured. Call set-config! first." {}))))
  @client-atom)

(defn disconnect-client!
  "Disconnect the WebSocket client if connected"
  []
  (when-let [client @client-atom]
    (when (ws/connected? client)
      (ws/disconnect! client))
    (reset! client-atom nil)))

;; ==========================================================================
;; Test Helpers
;; ==========================================================================

(defn send-message
  "Send a message to the WebSocket server and wait for a response"
  [msg-type data timeout-ms]
  (let [client (get-client)
        result-ch (ws/send-message! client msg-type data timeout-ms)]
    result-ch))

(defn wait-for-response
  "Wait for a response on the given channel with timeout"
  [ch timeout-ms]
  (let [timeout-ch (async/timeout timeout-ms)
        [result port] (async/alts!! [ch timeout-ch])]
    (if (= port timeout-ch)
      {:success false 
       :error {:code 1003, :type "timeout", :message "Request timed out"}}
      result)))

(defn send-and-wait
  "Send a message and wait for response"
  [msg-type data timeout-ms]
  (let [response-ch (send-message msg-type data timeout-ms)]
    (wait-for-response response-ch timeout-ms)))

(defn has-valid-success-format? [response]
  (and (map? response)
       (true? (:success response))
       (contains? response :data)))

(defn has-valid-error-format? [response]
  (and (map? response)
       (false? (:success response))
       (map? (:error response))
       (contains? (:error response) :code)
       (contains? (:error response) :type)
       (contains? (:error response) :message)))

;; ==========================================================================
;; Test Data Generators
;; ==========================================================================

(defn gen-request-id []
  (str "test-" (java.util.UUID/randomUUID)))

;; ==========================================================================
;; Test Setup
;; ==========================================================================

(defn setup-tests
  "Setup for WebSocket interface tests. 
   Host defaults to localhost if not provided."
  ([] (setup-tests "localhost"))
  ([host] (setup-tests host 3000))
  ([host port]
   (set-config! {:uri (str "ws://" host ":" port "/ws")
                 :service-name "archivist-test-client"
                 :handlers {:on-message (fn [msg] (println "Received message:" msg))
                            :on-error (fn [e] (println "Error:" e))}})))

;; ==========================================================================
;; Interface Tests (Run these against a live server)
;; ==========================================================================

(facts "about WebSocket interface"
  :live ; tag these tests as 'live' so they can be run selectively

  (background 
    (before :facts (setup-tests))
    (after :facts (disconnect-client!)))

  (fact "can connect to the WebSocket server"
    (let [client (get-client)]
      (ws/connected? client) => true))

  (fact "fetching facts batch returns standardized success response"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.fact/batch-get 
                                 {:limit 5 
                                  :request_id request-id} 
                                 5000)]
      (has-valid-success-format? response) => true
      (:request_id response) => request-id
      (vector? (get-in response [:data])) => true))

  (fact "fetching entity type returns standardized success response"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.entity/type-get
                                 {:uid 1 ; Use a known UID
                                  :request_id request-id}
                                 5000)]
      (has-valid-success-format? response) => true
      (:request_id response) => request-id
      (contains? (:data response) :type) => true))

  (fact "invalid query returns standardized error response"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.graph/query-execute
                                 {:query "INVALID QUERY SYNTAX"
                                  :request_id request-id}
                                 5000)]
      (has-valid-error-format? response) => true
      (:request_id response) => request-id
      (contains? (:error response) :code) => true
      (contains? (:error response) :message) => true))

  (fact "fetching non-existent entity returns error with appropriate code"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.entity/type-get
                                 {:uid 99999999 ; Non-existent UID
                                  :request_id request-id}
                                 5000)]
      (has-valid-error-format? response) => true
      (= 1201 (get-in response [:error :code])) => true ; resource-not-found code
      ))

  (fact "request with missing required field returns validation error"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.fact/create
                                 {:request_id request-id
                                  ; Missing required fields
                                 }
                                 5000)]
      (has-valid-error-format? response) => true
      (= 1102 (get-in response [:error :code])) => true ; missing-required-field code
      )))

;; ==========================================================================
;; Enhanced Connection and Error Testing
;; ==========================================================================

(facts "about WebSocket connection reliability"
  :live
  
  (background 
    (before :facts (setup-tests))
    (after :facts (disconnect-client!)))

  (fact "connection survives multiple rapid requests"
    (let [client (get-client)
          requests (for [i (range 10)]
                     {:type :archivist.fact/count
                      :data {}
                      :request-id (str "rapid-" i)})]
      
      ;; Send requests rapidly
      (let [responses (doall (map #(send-and-wait (:type %) (:data %) 1000) requests))]
        ;; All should succeed
        (every? #(has-valid-success-format? %) responses) => true
        (count responses) => 10)))

  (fact "connection handles concurrent requests properly"
    (let [client (get-client)
          request-count 5
          responses (atom [])]
      
      ;; Send concurrent requests
      (let [channels (for [i (range request-count)]
                       (send-message :archivist.fact/count {} 2000))]
        
        ;; Wait for all responses
        (doseq [ch channels]
          (swap! responses conj (wait-for-response ch 2000)))
        
        ;; All should succeed
        (count @responses) => request-count
        (every? #(has-valid-success-format? %) @responses) => true)))

  (fact "connection properly handles malformed requests"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.invalid/handler
                                 {:invalid "data"
                                  :request_id request-id}
                                 2000)]
      ;; Should receive an error response
      (has-valid-error-format? response) => true
      (:request_id response) => request-id))

  (fact "connection times out properly for hanging requests"
    (let [request-id (gen-request-id)
          start-time (System/currentTimeMillis)
          response (send-and-wait :archivist.fact/batch-get
                                 {:limit 1000000 ; Very large request that might hang
                                  :request_id request-id}
                                 1000)] ; Short timeout
      
      (let [duration (- (System/currentTimeMillis) start-time)]
        ;; Should timeout within reasonable time
        duration => (checker [actual] (< actual 1500))
        
        ;; Response should indicate timeout if it occurred
        (or (has-valid-success-format? response)
            (and (has-valid-error-format? response)
                 (= (get-in response [:error :type]) "timeout"))) => true)))

  (fact "connection maintains state across multiple operations"
    (let [client (get-client)]
      ;; First operation
      (let [response1 (send-and-wait :archivist.fact/count {} 2000)]
        (has-valid-success-format? response1) => true)
      
      ;; Connection should still be active
      (ws/connected? client) => true
      
      ;; Second operation should work
      (let [response2 (send-and-wait :archivist.fact/count {} 2000)]
        (has-valid-success-format? response2) => true))))

(facts "about WebSocket error scenarios"
  :live
  
  (background 
    (before :facts (setup-tests))
    (after :facts (disconnect-client!)))

  (fact "handles requests with missing request IDs gracefully"
    (let [response (send-and-wait :archivist.fact/batch-get
                                 {:limit 5
                                  ; Missing request_id
                                 }
                                 2000)]
      ;; Should still process but may not have request_id in response
      (or (has-valid-success-format? response)
          (has-valid-error-format? response)) => true))

  (fact "handles extremely large data payloads appropriately"
    (let [large-data {:data (apply str (repeat 10000 "x"))} ; 10KB string
          request-id (gen-request-id)
          response (send-and-wait :archivist.fact/create
                                 (assoc large-data :request_id request-id)
                                 5000)]
      ;; Should handle large payload (success or appropriate error)
      (or (has-valid-success-format? response)
          (has-valid-error-format? response)) => true
      
      ;; If error, should be appropriate type
      (when (has-valid-error-format? response)
        (contains? #{:validation-error :payload-too-large :database-error} 
                   (keyword (get-in response [:error :type]))) => true)))

  (fact "handles rapid successive connections and disconnections"
    (let [test-results (atom [])]
      ;; Create and destroy multiple connections rapidly
      (doseq [i (range 5)]
        (try
          (setup-tests)
          (let [client (get-client)]
            (swap! test-results conj {:connected (ws/connected? client)
                                      :iteration i}))
          (disconnect-client!)
          (catch Exception e
            (swap! test-results conj {:error (str e)
                                      :iteration i}))))
      
      ;; Most attempts should succeed
      (let [results @test-results
            successful (count (filter :connected results))]
        successful => (checker [actual] (>= actual 3))))) ; At least 3/5 should work

  (fact "handles connection during server stress conditions"
    ;; Simulate stress by sending many requests quickly
    (let [stress-responses (atom [])
          test-request-id (gen-request-id)]
      
      ;; Create stress
      (doseq [i (range 20)]
        (future
          (try
            (let [response (send-and-wait :archivist.fact/count
                                         {:request_id (str "stress-" i)}
                                         1000)]
              (swap! stress-responses conj response))
            (catch Exception e
              (swap! stress-responses conj {:error (str e)})))))
      
      ;; Wait for stress requests to process
      (Thread/sleep 2000)
      
      ;; Now try normal request
      (let [normal-response (send-and-wait :archivist.fact/batch-get
                                          {:limit 1 :request_id test-request-id}
                                          3000)]
        ;; Normal request should still work despite stress
        (or (has-valid-success-format? normal-response)
            (has-valid-error-format? normal-response)) => true))))

;; ==========================================================================
;; Performance and Load Testing
;; ==========================================================================

(facts "about WebSocket performance characteristics"
  :live :performance ; Additional tag for performance tests
  
  (background 
    (before :facts (setup-tests))
    (after :facts (disconnect-client!)))

  (fact "maintains acceptable response times under normal load"
    (let [start-time (System/currentTimeMillis)
          response (send-and-wait :archivist.fact/batch-get
                                 {:limit 10 :request_id (gen-request-id)}
                                 5000)
          end-time (System/currentTimeMillis)
          response-time (- end-time start-time)]
      
      (has-valid-success-format? response) => true
      response-time => (checker [actual] (< actual 2000)))) ; Under 2 seconds

  (fact "handles batch operations efficiently"
    (let [batch-size 50
          start-time (System/currentTimeMillis)
          response (send-and-wait :archivist.fact/batch-get
                                 {:limit batch-size :request_id (gen-request-id)}
                                 10000)
          end-time (System/currentTimeMillis)
          response-time (- end-time start-time)]
      
      (has-valid-success-format? response) => true
      response-time => (checker [actual] (< actual 5000)) ; Under 5 seconds for 50 items
      
      ;; Should return appropriate amount of data
      (when (has-valid-success-format? response)
        (count (:data response)) => (checker [actual] (<= actual batch-size)))))

  (fact "maintains connection stability during extended sessions"
    (let [client (get-client)
          session-start (System/currentTimeMillis)
          operation-count 15
          results (atom [])]
      
      ;; Perform multiple operations over time
      (doseq [i (range operation-count)]
        (Thread/sleep 200) ; 200ms between operations
        (let [response (send-and-wait :archivist.fact/count
                                     {:request_id (str "session-" i)}
                                     2000)]
          (swap! results conj {:operation i
                               :success (has-valid-success-format? response)
                               :timestamp (System/currentTimeMillis)})))
      
      (let [session-duration (- (System/currentTimeMillis) session-start)
            successful-ops (count (filter :success @results))]
        
        ;; Connection should remain stable
        (ws/connected? client) => true
        
        ;; Most operations should succeed
        successful-ops => (checker [actual] (>= actual (* 0.8 operation-count))) ; 80% success rate
        
        ;; Session should complete in reasonable time
        session-duration => (checker [actual] (< actual 10000))))) ; Under 10 seconds

;; ==========================================================================
;; Run Tests Directly
;; ==========================================================================

(defn run-interface-tests
  "Run the WebSocket interface tests against a specified server"
  ([] (run-interface-tests "localhost" 3000))
  ([host port]
   (println "Running WebSocket interface tests against" host ":" port)
   (setup-tests host port)
   (midje.repl/check-facts :filter :live)
   (disconnect-client!)))

(defn run-performance-tests
  "Run performance-focused WebSocket tests"
  ([] (run-performance-tests "localhost" 3000))
  ([host port]
   (println "Running WebSocket performance tests against" host ":" port)
   (setup-tests host port)
   (midje.repl/check-facts :filter [:live :performance])
   (disconnect-client!)))

(defn run-all-interface-tests
  "Run all WebSocket interface tests including performance"
  ([] (run-all-interface-tests "localhost" 3000))
  ([host port]
   (println "Running all WebSocket interface tests against" host ":" port)
   (setup-tests host port)
   (midje.repl/check-facts 'io.relica.archivist.ws-interface-test)
   (disconnect-client!)))

(comment
  ;; Run these in a REPL
  (run-interface-tests)
  (run-interface-tests "test-server.example.com" 3000)
  
  ;; Run performance tests specifically
  (run-performance-tests)
  
  ;; Run all tests
  (run-all-interface-tests)
  
  ;; Or run individual tests
  (setup-tests)
  (midje.repl/check-facts 'io.relica.archivist.ws-interface-test)
  (disconnect-client!)
  )