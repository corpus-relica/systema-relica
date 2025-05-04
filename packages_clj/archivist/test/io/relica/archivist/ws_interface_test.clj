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

(comment
  ;; Run these in a REPL
  (run-interface-tests)
  (run-interface-tests "test-server.example.com" 3000)
  
  ;; Or run individual tests
  (setup-tests)
  (midje.repl/check-facts 'io.relica.archivist.ws-interface-test)
  (disconnect-client!)
  )