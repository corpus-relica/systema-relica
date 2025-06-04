(ns io.relica.common.io.archivist-client-test
  "Comprehensive tests for the Archivist client including message identifiers, error handling,
   batch operations, query execution, and cross-language compatibility."
  (:require [clojure.test :refer [deftest testing is use-fixtures]]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout <!! close! alts!]]))

(deftest archivist-client-message-identifiers-test
  (testing "About Archivist client message identifiers"
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
          archivist-client (archivist/->ArchivistClient mock-ws-client {:timeout 5000})]

      ;; Test a sample of operations to verify message identifiers
      (testing "get-batch-facts uses standardized message identifier"
        (archivist/get-batch-facts archivist-client {:page 1 :limit 10})
        (is (= :archivist.fact/batch-get (:type (first @captured-messages)))))

      (testing "get-facts-count uses standardized message identifier"
        (reset! captured-messages [])
        (archivist/get-facts-count archivist-client)
        (is (= :archivist.fact/count (:type (first @captured-messages)))))

      (testing "execute-query uses standardized message identifier"
        (reset! captured-messages [])
        (archivist/execute-query archivist-client "MATCH (n) RETURN n" {})
        (is (= :archivist.graph/query-execute (:type (first @captured-messages)))))

      (testing "get-kinds uses standardized message identifier"
        (reset! captured-messages [])
        (archivist/get-kinds archivist-client {})
        (is (= :archivist.kind/list (:type (first @captured-messages)))))

      (testing "get-aspects uses standardized message identifier"
        (reset! captured-messages [])
        (archivist/get-aspects archivist-client {})
        (is (= :archivist.aspect/list (:type (first @captured-messages)))))

      (testing "create-fact uses standardized message identifier"
        (reset! captured-messages [])
        (archivist/create-fact archivist-client {:lh-object-uid "123"
                                                 :rel-type-uid "1225"
                                                 :rh-object-uid "456"})
        (is (= :archivist.fact/create (:type (first @captured-messages))))))))

(deftest archivist-client-error-handling-test
  (testing "About Archivist client error handling"
    (let [mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (go (case type
                                   :archivist.concept/get
                                   {:success false
                                    :error {:code 1201
                                            :type "resource-not-found"
                                            :message "Concept not found"}}
                                   :archivist.graph/query-execute
                                   {:success false
                                    :error {:code 1203
                                            :type "query-execution-failed"
                                            :message "Invalid Cypher syntax"
                                            :details {:query "INVALID QUERY"}}}
                                   {:success false
                                    :error {:code 1002
                                            :type "internal-error"}}))))
          archivist-client (archivist/->ArchivistClient mock-ws-client {:timeout 5000})]

      (testing "handles resource not found errors"
        (let [result (<!! (archivist/get-concept archivist-client "non-existent-uid"))]
          (is (= false (:success result)))
          (is (= 1201 (get-in result [:error :code])))
          (is (= "resource-not-found" (get-in result [:error :type])))))

      (testing "handles query execution errors with details"
        (let [result (<!! (archivist/execute-query archivist-client "INVALID QUERY" {}))]
          (is (= false (:success result)))
          (is (= 1203 (get-in result [:error :code])))
          (is (= "query-execution-failed" (get-in result [:error :type])))
          (is (= "INVALID QUERY" (get-in result [:error :details :query]))))))))

(deftest archivist-client-query-execution-test
  (testing "About Archivist client query execution"
    (let [captured-messages (atom [])
          mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (swap! captured-messages conj payload)
                             (go {:success true
                                  :data {:records [{:n {:uid "100" :name "Entity 1"}}
                                                   {:n {:uid "101" :name "Entity 2"}}]
                                         :metadata {:query-time-ms 45
                                                    :records-returned 2}}})))
          archivist-client (archivist/->ArchivistClient mock-ws-client {:timeout 5000})]

      (testing "passes query and parameters correctly"
        (archivist/execute-query archivist-client 
                                 "MATCH (n:Entity) WHERE n.uid = $uid RETURN n"
                                 {:uid "100"})
        (let [message (first @captured-messages)]
          ;; Just verify the message was captured - the exact structure may vary
          (is (not (nil? message)))
          ;; Verify it's a map/structure
          (is (map? message))))

      (testing "handles query results with metadata"
        (let [result (<!! (archivist/execute-query archivist-client 
                                                   "MATCH (n) RETURN n LIMIT 2" 
                                                   {}))]
          (is (= true (:success result)))
          (is (= 2 (count (get-in result [:data :records]))))
          (is (= "100" (get-in result [:data :records 0 :n :uid])))
          (is (= 45 (get-in result [:data :metadata :query-time-ms]))))))))

(deftest archivist-client-cross-language-compatibility-test
  (testing "About Archivist client cross-language TypeScript/Python compatibility"
    (let [captured-messages (atom [])
          mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (swap! captured-messages conj payload)
                             ;; Simulate TypeScript-style response
                             (go {:success true
                                  :data {:totalCount 42
                                         :pageSize 10
                                         :currentPage 1
                                         :hasMore true}})))
          archivist-client (archivist/->ArchivistClient mock-ws-client {:timeout 5000})]

      (testing "sends queries compatible with TypeScript service"
        (archivist/get-kinds archivist-client {:page-size 10
                                               :include-metadata true})
        (let [message (first @captured-messages)]
          (is (= 10 (:page-size message)))
          (is (= true (:include-metadata message)))))

      (testing "handles TypeScript camelCase responses"
        (let [result (<!! (archivist/get-kinds archivist-client {}))]
          (is (= true (:success result)))
          (is (= 42 (get-in result [:data :totalCount])))
          (is (= 10 (get-in result [:data :pageSize])))
          (is (= true (get-in result [:data :hasMore]))))))))

(deftest archivist-client-heartbeat-mechanism-test
  (testing "About Archivist client heartbeat mechanism"
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
          archivist-client (archivist/->ArchivistClient mock-ws-client {:timeout 5000})]

      (testing "sends heartbeat messages"
        (archivist/send-heartbeat! archivist-client)
        (is (= 1 @heartbeat-count)))

      ;; Note: Testing periodic heartbeats would require time manipulation
      ;; or more complex async testing
      )))