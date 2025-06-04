(ns io.relica.archivist.archivist-client-test
  (:require [clojure.test :refer [deftest testing is use-fixtures]]
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

(deftest ^:client-connection client-connection-management-test
  (testing "client can connect to server"
    (with-test-client
      (fn [client]
        (is (client/connected? client)))))
  
  (testing "client disconnects properly"
    (let [client (client/create-client {:host *host*
                                       :port *port*
                                       :timeout *timeout*})]
      (is (client/connected? client))
      (client/disconnect! client)
      (is (not (client/connected? client))))))

(deftest ^:entity-ops entity-operations-test
  (testing "can get entity type"
    (with-test-client
      (fn [client]
        (let [result-ch (client/get-entity-type client 1) ; Use a known UID that exists
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (contains? (:data response) :type))))))
  
  (testing "handles non-existent entity"
    (with-test-client
      (fn [client]
        (let [result-ch (client/get-entity-type client 999999999) ; Non-existent UID
              response (wait-for-result result-ch *timeout*)]
          (is (valid-error-response? response))
          (is (= 1201 (get-in response [:error :code])))))) ; resource-not-found
  
  (testing "can resolve multiple UIDs"
    (with-test-client
      (fn [client]
        (let [result-ch (client/resolve-uids client [1 2 3]) ; Use known UIDs
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (map? (:data response))))))))

(deftest ^:fact-ops fact-operations-test
  (testing "can create a simple fact"
    (with-test-client
      (fn [client]
        (let [fact-data {:lh_object_uid 1001
                         :rh_object_uid 2001
                         :rel_type_uid 1225
                         :rel_type_name "is classified as"}
              result-ch (client/create-fact client fact-data)
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (contains? (:data response) :fact))))))
  
  (testing "can batch create facts"
    (with-test-client
      (fn [client]
        (let [facts-data [{:lh_object_uid 1001
                           :rh_object_uid 2001
                           :rel_type_uid 1225}
                          {:lh_object_uid 1002
                           :rh_object_uid 2002
                           :rel_type_uid 1226}]
              result-ch (client/batch-create-facts client facts-data)
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (vector? (get-in response [:data :facts])))
          (is (= 2 (count (get-in response [:data :facts]))))))))
  
  (testing "can update a fact"
    (with-test-client
      (fn [client]
        (let [fact-data {:fact_uid 12345
                         :lh_object_uid 1001
                         :rh_object_uid 2001
                         :rel_type_uid 1225}
              result-ch (client/update-fact client fact-data)
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (contains? (:data response) :fact))))))
  
  (testing "can delete a fact"
    (with-test-client
      (fn [client]
        (let [result-ch (client/delete-fact client 12345)
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (= "success" (get-in response [:data :result])))))))
  
  (testing "can batch delete facts"
    (with-test-client
      (fn [client]
        (let [result-ch (client/batch-delete-facts client [12345 12346 12347])
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (= "success" (get-in response [:data :result])))))))
  
  (testing "can get facts batch"
    (with-test-client
      (fn [client]
        (let [result-ch (client/get-facts-batch client {:limit 10})
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (vector? (:data response))))))))

(deftest ^:search-ops search-operations-test
  (testing "can perform text search"
    (with-test-client
      (fn [client]
        (let [result-ch (client/text-search client {:search-term "pump"
                                                   :collection-uid nil
                                                   :page 1
                                                   :page-size 10
                                                   :exact-match false})
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (contains? (:data response) :results))))))
  
  (testing "can perform UID search"
    (with-test-client
      (fn [client]
        (let [result-ch (client/uid-search client {:search-uid 1001
                                                  :collection-uid nil
                                                  :page 1
                                                  :page-size 10})
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (contains? (:data response) :results))))))
  
  (testing "handles search with invalid parameters"
    (with-test-client
      (fn [client]
        (let [result-ch (client/text-search client {:search-term "" ; Empty search term
                                                   :page 1
                                                   :page-size 10})
              response (wait-for-result result-ch *timeout*)]
          (if (valid-error-response? response)
            (is (contains? (:error response) :message))
            (is (valid-success-response? response))))))))

(deftest ^:query-ops query-operations-test
  (testing "can execute basic graph query"
    (with-test-client
      (fn [client]
        (let [result-ch (client/execute-query client {:query "MATCH (n) RETURN n LIMIT 1"
                                                     :params {}})
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (contains? (:data response) :results))))))
  
  (testing "handles invalid query syntax"
    (with-test-client
      (fn [client]
        (let [result-ch (client/execute-query client {:query "INVALID QUERY SYNTAX"
                                                     :params {}})
              response (wait-for-result result-ch *timeout*)]
          (is (valid-error-response? response))
          (is (contains? (:error response) :message))))))
  
  (testing "can execute Gellish query"
    (with-test-client
      (fn [client]
        (let [result-ch (client/execute-gel-query client {:gel-query "?1 > 1225.is classified as > 2.?"})
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (contains? (:data response) :results)))))))

(deftest ^:submission-ops submission-operations-test
  (testing "can update definition"
    (with-test-client
      (fn [client]
        (let [result-ch (client/update-definition client {:fact_uid 12345
                                                         :partial_definition "A partial definition"
                                                         :full_definition "A complete definition"})
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (contains? (:data response) :result))))))
  
  (testing "can update collection"
    (with-test-client
      (fn [client]
        (let [result-ch (client/update-collection client {:fact_uid 12345
                                                         :collection_uid 5001
                                                         :collection_name "Test Collection"})
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (contains? (:data response) :result))))))
  
  (testing "can add synonym"
    (with-test-client
      (fn [client]
        (let [result-ch (client/add-synonym client {:uid 12345
                                                   :synonym "Alternative Name"})
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (= 12345 (get-in response [:data :uid])))
          (is (= "Alternative Name" (get-in response [:data :synonym])))))))
  
  (testing "can submit date entity"
    (with-test-client
      (fn [client]
        (let [result-ch (client/submit-date client {:date_uid 12345
                                                   :collection_uid 5001
                                                   :collection_name "Date Collection"})
              response (wait-for-result result-ch *timeout*)]
          (is (valid-success-response? response))
          (is (contains? (:data response) :fact)))))))

(deftest ^:error-handling client-error-handling-test
  (testing "handles timeout gracefully"
    (with-test-client
      (fn [client]
        (let [result-ch (client/get-entity-type client 1)
              response (wait-for-result result-ch 1)] ; Very short timeout
          (if response
            (is (or (valid-success-response? response)
                   (valid-error-response? response)))
            (is (nil? response)))))))
  
  (testing "handles malformed requests"
    (with-test-client
      (fn [client]
        (let [result-ch (client/create-fact client {:invalid "data structure"})
              response (wait-for-result result-ch *timeout*)]
          (is (valid-error-response? response))
          (is (contains? (:error response) :message))))))
  
  (testing "handles missing required fields"
    (with-test-client
      (fn [client]
        (let [result-ch (client/create-fact client {}) ; Missing required fields
              response (wait-for-result result-ch *timeout*)]
          (is (valid-error-response? response))
          (is (contains? (:error response) :details))))))

(deftest ^:performance client-performance-test
  (testing "can handle multiple concurrent requests"
    (with-test-client
      (fn [client]
        (let [num-requests 5
              request-futures (repeatedly num-requests
                                        #(future (wait-for-result 
                                                 (client/get-entity-type client 1)
                                                 *timeout*)))
              responses (map deref request-futures)]
          (is (= num-requests (count responses)))
          (is (every? #(or (valid-success-response? %)
                          (valid-error-response? %))
                     responses))))))
  
  (testing "maintains reasonable response times"
    (with-test-client
      (fn [client]
        (let [start-time (System/currentTimeMillis)
              result-ch (client/get-entity-type client 1)
              response (wait-for-result result-ch *timeout*)
              end-time (System/currentTimeMillis)
              duration (- end-time start-time)]
          (is (< duration 3000)) ; Should complete within 3 seconds
          (is (or (valid-success-response? response)
                 (valid-error-response? response))))))))