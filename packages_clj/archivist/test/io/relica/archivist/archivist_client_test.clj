(ns io.relica.archivist.archivist-client-test
  (:require [midje.sweet :refer :all]
            [clojure.core.async :as async :refer [<! >! go chan <!! >!!]]
            [io.relica.common.io.archivist-client :as client]
            [io.relica.archivist.utils.response :as response]))

;; ==========================================================================
;; Test Configuration
;; ==========================================================================

(def ^:dynamic *host* "localhost")
(def ^:dynamic *port* 3000)
(def ^:dynamic *timeout* 5000)

;; ==========================================================================
;; Test utilities
;; ==========================================================================

(defn with-test-client [f]
  (let [client (client/create-client {:host *host*
                                     :port *port*
                                     :timeout *timeout*
                                     :handlers {:on-error (fn [e] (println "Test client error:" e))
                                               :on-message (fn [msg] (println "Test client received:" msg))}})]
    (try
      (f client)
      (finally
        (client/disconnect! client)))))

(defn wait-for-result [ch timeout-ms]
  (let [timeout-ch (async/timeout timeout-ms)]
    (first (async/alts!! [ch timeout-ch]))))

;; ==========================================================================
;; Response format validation
;; ==========================================================================

(defn valid-success-response? [response]
  (and (map? response)
       (true? (:success response))
       (contains? response :data)))

(defn valid-error-response? [response]
  (and (map? response)
       (false? (:success response))
       (map? (:error response))
       (contains? (:error response) :code)
       (contains? (:error response) :type)
       (contains? (:error response) :message)))

;; ==========================================================================
;; Client tests
;; ==========================================================================

(facts "about archivist client connection management"
  :client-connection ; tag for filtering
  
  (fact "client can connect to server"
    (with-test-client
      (fn [client]
        (client/connected? client) => true)))
  
  (fact "client disconnects properly"
    (let [client (client/create-client {:host *host*
                                       :port *port*
                                       :timeout *timeout*})]
      (client/connected? client) => true
      (client/disconnect! client)
      (client/connected? client) => false)))

(facts "about entity operations"
  :entity-ops ; tag for filtering
  
  (fact "can get entity type"
    (with-test-client
      (fn [client]
        (let [result-ch (client/get-entity-type client 1) ; Use a known UID that exists
              response (wait-for-result result-ch *timeout*)]
          (valid-success-response? response) => true
          (contains? (:data response) :type) => true))))
  
  (fact "handles non-existent entity"
    (with-test-client
      (fn [client]
        (let [result-ch (client/get-entity-type client 999999999) ; Non-existent UID
              response (wait-for-result result-ch *timeout*)]
          (valid-error-response? response) => true
          (get-in response [:error :code]) => 1201)))) ; resource-not-found
  
  (fact "can resolve multiple UIDs"
    (with-test-client
      (fn [client]
        (let [result-ch (client/resolve-uids client [1 2 3]) ; Use known UIDs
              response (wait-for-result result-ch *timeout*)]
          (valid-success-response? response) => true
          (map? (:data response)) => true)))))

(facts "about fact operations"
  :fact-ops ; tag for filtering
  
  (fact "can get facts batch"
    (with-test-client
      (fn [client]
        (let [result-ch (client/get-batch-facts client {:limit 5})
              response (wait-for-result result-ch *timeout*)]
          (valid-success-response? response) => true
          (vector? (get-in response [:data])) => true))))
  
  (fact "can get subtypes"
    (with-test-client
      (fn [client]
        (let [result-ch (client/get-subtypes client 1) ; Use a known type UID
              response (wait-for-result result-ch *timeout*)]
          (valid-success-response? response) => true
          (vector? (get-in response [:data :facts])) => true))))
  
  (fact "can get all related facts"
    (with-test-client
      (fn [client]
        (let [result-ch (client/get-all-related client 1) ; Use a known UID
              response (wait-for-result result-ch *timeout*)]
          (valid-success-response? response) => true
          (vector? (get-in response [:data :facts])) => true)))))

(facts "about validation operations"
  :validation-ops ; tag for filtering
  
  (fact "validation handles invalid input"
    (with-test-client
      (fn [client]
        (let [result-ch (client/validate-entity client {:invalid "data"})
              response (wait-for-result result-ch *timeout*)]
          (valid-error-response? response) => true
          (>= (get-in response [:error :code]) 1101) => true)))) ; validation error codes start at 1101
  
  (fact "validation handles missing required fields"
    (with-test-client
      (fn [client]
        (let [result-ch (client/create-fact client {}) ; Empty fact without required fields
              response (wait-for-result result-ch *timeout*)]
          (valid-error-response? response) => true
          (get-in response [:error :code]) => 1102)))) ; missing-required-field
  )

(facts "about query operations"
  :query-ops ; tag for filtering
  
  (fact "can execute valid query"
    (with-test-client
      (fn [client]
        (let [result-ch (client/execute-query client "MATCH (n) RETURN COUNT(n) as count" {})
              response (wait-for-result result-ch *timeout*)]
          (valid-success-response? response) => true
          (vector? (get-in response [:data :rows])) => true))))
  
  (fact "handles invalid query syntax"
    (with-test-client
      (fn [client]
        (let [result-ch (client/execute-query client "INVALID QUERY SYNTAX" {})
              response (wait-for-result result-ch *timeout*)]
          (valid-error-response? response) => true
          (get-in response [:error :code]) => 1203)))) ; query-execution-failed
  )

(facts "about transaction operations"
  :transaction-ops ; tag for filtering
  
  (fact "can create and commit transaction"
    (with-test-client
      (fn [client]
        (let [create-tx-ch (client/create-transaction client {:user-id "test-user"})
              create-response (wait-for-result create-tx-ch *timeout*)]
          (valid-success-response? create-response) => true
          (let [tx-uid (get-in create-response [:data :uid])
                commit-tx-ch (client/commit-transaction client tx-uid)
                commit-response (wait-for-result commit-tx-ch *timeout*)]
            (valid-success-response? commit-response) => true)))))
  
  (fact "can create and rollback transaction"
    (with-test-client
      (fn [client]
        (let [create-tx-ch (client/create-transaction client {:user-id "test-user"})
              create-response (wait-for-result create-tx-ch *timeout*)]
          (valid-success-response? create-response) => true
          (let [tx-uid (get-in create-response [:data :uid])
                rollback-tx-ch (client/rollback-transaction client tx-uid)
                rollback-response (wait-for-result rollback-tx-ch *timeout*)]
            (valid-success-response? rollback-response) => true))))))

;; ==========================================================================
;; Test runner
;; ==========================================================================

(defn run-client-tests
  "Run tests against a live Archivist server"
  ([] (run-client-tests "localhost" 3000))
  ([host port]
   (binding [*host* host
             *port* port]
     (println "Running Archivist client tests against" host ":" port)
     (midje.repl/check-facts :filter #{:client-connection :entity-ops :fact-ops :validation-ops :query-ops})))
  ([host port transaction-tests?]
   (binding [*host* host
             *port* port]
     (println "Running Archivist client tests against" host ":" port)
     (if transaction-tests?
       (midje.repl/check-facts)
       (midje.repl/check-facts :filter #{:client-connection :entity-ops :fact-ops :validation-ops :query-ops})))))

;; ==========================================================================
;; Command-line entry point 
;; ==========================================================================

(defn -main [& args]
  (let [host (or (first args) "localhost")
        port (if (second args) 
               (Integer/parseInt (second args)) 
               3000)
        with-transactions? (= (nth args 2 "false") "true")]
    
    (println "Running Archivist client tests against" host ":" port)
    (println "Including transaction tests:" with-transactions?)
    
    (run-client-tests host port with-transactions?)
    
    (System/exit 0)))

(comment
  ;; Run from REPL
  (run-client-tests)
  (run-client-tests "test.example.com" 3000)
  (run-client-tests "localhost" 3000 true) ; With transaction tests
  )