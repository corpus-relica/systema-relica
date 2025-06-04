(ns io.relica.archivist.ws-interface-test
  (:require [clojure.test :refer [deftest testing is use-fixtures]]
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

(use-fixtures :each (fn [f] (setup-tests) (f) (disconnect-client!)))

;; ==========================================================================
;; Interface Tests (Run these against a live server)
;; ==========================================================================

(deftest ^:live websocket-interface-test
  (testing "can connect to the WebSocket server"
    (let [client (get-client)]
      (is (ws/connected? client))))

  (testing "fetching facts batch returns standardized success response"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.fact/batch-get 
                                 {:limit 5 
                                  :request_id request-id} 
                                 5000)]
      (is (has-valid-success-format? response))
      (is (= request-id (:request_id response)))
      (is (vector? (get-in response [:data])))))

  (testing "fetching entity type returns standardized success response"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.entity/type-get
                                 {:uid 1 ; Use a known UID
                                  :request_id request-id}
                                 5000)]
      (is (has-valid-success-format? response))
      (is (= request-id (:request_id response)))
      (is (contains? (:data response) :type))))

  (testing "invalid query returns standardized error response"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.graph/query-execute
                                 {:query "INVALID QUERY SYNTAX"
                                  :request_id request-id}
                                 5000)]
      (is (has-valid-error-format? response))
      (is (= request-id (:request_id response)))
      (is (contains? (:error response) :code))
      (is (contains? (:error response) :message))))

  (testing "fetching non-existent entity returns error with appropriate code"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.entity/type-get
                                 {:uid 99999999 ; Non-existent UID
                                  :request_id request-id}
                                 5000)]
      (is (has-valid-error-format? response))
      (is (= request-id (:request_id response)))
      (is (= 404 (get-in response [:error :code])))))

  (testing "message timeout handling works correctly"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.slow/operation ; Non-existent operation
                                 {:request_id request-id}
                                 100)] ; Very short timeout
      (is (false? (:success response)))
      (is (= "timeout" (get-in response [:error :type])))))

  (testing "can handle multiple concurrent requests"
    (let [request-ids (repeatedly 5 gen-request-id)
          responses (pmap (fn [req-id]
                          (send-and-wait :archivist.entity/type-get
                                        {:uid 1
                                         :request_id req-id}
                                        5000))
                        request-ids)]
      (is (= 5 (count responses)))
      (is (every? has-valid-success-format? responses))
      (is (= (set request-ids) 
             (set (map :request_id responses))))))

  (testing "error responses include helpful details"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.fact/create
                                 {:invalid "data structure"
                                  :request_id request-id}
                                 5000)]
      (when (has-valid-error-format? response)
        (is (string? (get-in response [:error :message])))
        (is (number? (get-in response [:error :code])))
        (is (string? (get-in response [:error :type]))))))

  (testing "request and response format consistency"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.fact/batch-get
                                 {:limit 1
                                  :request_id request-id}
                                 5000)]
      (is (= request-id (:request_id response)))
      (is (contains? response :success))
      (if (:success response)
        (is (contains? response :data))
        (is (contains? response :error)))))

  (testing "can handle large response payloads"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.fact/batch-get
                                 {:limit 100
                                  :request_id request-id}
                                 10000)] ; Longer timeout for large responses
      (is (has-valid-success-format? response))
      (is (= request-id (:request_id response)))
      (is (vector? (get-in response [:data])))))

  (testing "server maintains connection state properly"
    (let [client (get-client)]
      (is (ws/connected? client))
      ;; Send multiple messages to verify connection stays alive
      (dotimes [i 3]
        (let [response (send-and-wait :archivist.entity/type-get
                                     {:uid 1
                                      :request_id (gen-request-id)}
                                     5000)]
          (is (has-valid-success-format? response))))
      (is (ws/connected? client)))))

;; ==========================================================================
;; Performance Tests
;; ==========================================================================

(deftest ^:live ^:performance websocket-performance-test
  (testing "can handle burst of concurrent requests"
    (let [start-time (System/currentTimeMillis)
          num-requests 20
          request-ids (repeatedly num-requests gen-request-id)
          responses (pmap (fn [req-id]
                          (send-and-wait :archivist.entity/type-get
                                        {:uid 1
                                         :request_id req-id}
                                        10000))
                        request-ids)
          end-time (System/currentTimeMillis)
          duration (- end-time start-time)]
      
      (is (= num-requests (count responses)))
      (is (every? has-valid-success-format? responses))
      (is (< duration 15000)) ; Should complete within 15 seconds
      (is (= (set request-ids) 
             (set (map :request_id responses))))))

  (testing "maintains reasonable response times under load"
    (let [response-times (atom [])
          num-requests 10]
      (dotimes [i num-requests]
        (let [start (System/currentTimeMillis)
              response (send-and-wait :archivist.entity/type-get
                                     {:uid 1
                                      :request_id (gen-request-id)}
                                     5000)
              end (System/currentTimeMillis)
              duration (- end start)]
          (when (has-valid-success-format? response)
            (swap! response-times conj duration))))
      
      (let [times @response-times
            avg-time (/ (reduce + times) (count times))]
        (is (> (count times) (* num-requests 0.8))) ; At least 80% success rate
        (is (< avg-time 2000))))) ; Average response time under 2 seconds

;; ==========================================================================
;; Error Handling Tests
;; ==========================================================================

(deftest ^:live websocket-error-handling-test
  (testing "gracefully handles malformed requests"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.invalid/endpoint
                                 {:request_id request-id}
                                 5000)]
      (is (has-valid-error-format? response))
      (is (= request-id (:request_id response)))))

  (testing "handles missing required fields appropriately"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.fact/create
                                 {:request_id request-id} ; Missing required fields
                                 5000)]
      (is (has-valid-error-format? response))
      (is (contains? (:error response) :details))))

  (testing "provides meaningful error messages"
    (let [request-id (gen-request-id)
          response (send-and-wait :archivist.graph/query-execute
                                 {:query ""  ; Empty query
                                  :request_id request-id}
                                 5000)]
      (when (has-valid-error-format? response)
        (is (string? (get-in response [:error :message])))
        (is (not (empty? (get-in response [:error :message]))))))))