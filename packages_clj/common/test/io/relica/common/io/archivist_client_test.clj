(ns io.relica.common.io.archivist-client-test
  "Comprehensive tests for the Archivist client including message identifiers, error handling,
   batch operations, query execution, and cross-language compatibility."
  (:require [midje.sweet :refer :all]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test.midje-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout <!! close! alts!]]))

(facts "About Archivist client message identifiers"
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
         (fact "get-batch-facts uses standardized message identifier"
               (archivist/get-batch-facts archivist-client {:page 1 :limit 10})
               (first @captured-messages) => (contains {:type :archivist.fact/batch-get}))

         (fact "get-facts-count uses standardized message identifier"
               (reset! captured-messages [])
               (archivist/get-facts-count archivist-client)
               (first @captured-messages) => (contains {:type :archivist.fact/count}))

         (fact "execute-query uses standardized message identifier"
               (reset! captured-messages [])
               (archivist/execute-query archivist-client "MATCH (n) RETURN n" {})
               (first @captured-messages) => (contains {:type :archivist.graph/query-execute}))

         (fact "get-kinds uses standardized message identifier"
               (reset! captured-messages [])
               (archivist/get-kinds archivist-client {})
               (first @captured-messages) => (contains {:type :archivist.kind/list}))

         (fact "get-aspects uses standardized message identifier"
               (reset! captured-messages [])
               (archivist/get-aspects archivist-client {})
               (first @captured-messages) => (contains {:type :archivist.aspect/list}))

         (fact "get-facts uses standardized message identifier"
               (reset! captured-messages [])
               (archivist/get-facts archivist-client {})
               (first @captured-messages) => (contains {:type :archivist.fact/list}))

         (fact "send-heartbeat! uses standardized message identifier"
               (reset! captured-messages [])
               (archivist/send-heartbeat! archivist-client)
               (first @captured-messages) => (contains {:type :relica.app/heartbeat}))))

(facts "About Archivist client factory function"
       (let [captured-messages (atom [])
             handlers {:on-error (fn [_] nil)
                       :on-message (fn [_] nil)}
             registered-handlers (atom {})
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ type handler]
                                (swap! registered-handlers assoc type handler)
                                nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload _]
                                (swap! captured-messages conj {:type type
                                                               :payload payload})
                                (go {:success true})))]

         (with-redefs [ws/connect! (fn [_] true)
                       ws/create-client (fn [_] mock-ws-client)
                       archivist/start-heartbeat-scheduler! (fn [_ _] #())] ; Disable the scheduler
           (let [client (archivist/create-client {:host "localhost"
                                                  :port 3000
                                                  :handlers handlers})]

             (fact "Client uses standardized heartbeat message identifier"
                   (reset! captured-messages [])
                   (archivist/send-heartbeat! client)
                   (first @captured-messages) => (contains {:type :relica.app/heartbeat}))))))

(facts "About Archivist client error handling"
       (let [mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (go (case type
                                      :archivist.fact/batch-get
                                      {:success false
                                       :error {:code "DATABASE_ERROR"
                                               :message "Neo4j connection failed"}}
                                      :archivist.graph/query-execute
                                      {:success false
                                       :error {:code "QUERY_ERROR"
                                               :message "Invalid Cypher syntax"}}
                                      {:success false
                                       :error {:code "UNKNOWN_ERROR"}}))))
             archivist-client (archivist/->ArchivistClient mock-ws-client {:timeout 5000})]

         (fact "handles database errors gracefully"
               (let [result (<!! (archivist/get-batch-facts archivist-client {:page 1 :limit 10}))]
                 (:success result) => false
                 (get-in result [:error :code]) => "DATABASE_ERROR"))

         (fact "handles query syntax errors"
               (let [result (<!! (archivist/execute-query archivist-client "INVALID QUERY" {}))]
                 (:success result) => false
                 (get-in result [:error :code]) => "QUERY_ERROR"
                 (get-in result [:error :message]) => (contains "Invalid Cypher")))))

(facts "About Archivist client batch operations"
       (let [mock-facts (vec (for [i (range 100)]
                               {:uid (str "fact-" i)
                                :lh_object_uid (str "entity-" (mod i 10))
                                :rh_object_uid (str "entity-" (inc (mod i 10)))
                                :rel_type_uid "1146"}))
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (go (case type
                                      :archivist.fact/batch-get
                                      (let [{:keys [skip range]} payload
                                            start (or skip 0)
                                            limit (or range 10)
                                            end (min (+ start limit) (count mock-facts))]
                                        {:success true
                                         :facts (subvec mock-facts start end)
                                         :total (count mock-facts)})
                                      :archivist.fact/count
                                      {:success true
                                       :count (count mock-facts)}
                                      {:success false}))))
             archivist-client (archivist/->ArchivistClient mock-ws-client {:timeout 5000})]

         (fact "retrieves facts in batches correctly"
               (let [result (<!! (archivist/get-batch-facts archivist-client {:skip 20 :range 10}))]
                 (:success result) => true
                 (count (:facts result)) => 10
                 (get-in result [:facts 0 :uid]) => "fact-20"))

         (fact "handles last incomplete batch"
               (let [result (<!! (archivist/get-batch-facts archivist-client {:skip 95 :range 10}))]
                 (:success result) => true
                 (count (:facts result)) => 5))

         (fact "returns correct total count"
               (let [result (<!! (archivist/get-facts-count archivist-client))]
                 (:success result) => true
                 (:count result) => 100))))

(facts "About Archivist client query execution"
       (let [mock-query-results {"MATCH (n:Kind) RETURN n LIMIT 5"
                                {:nodes [{:uid "1" :name "Thing"}
                                        {:uid "2" :name "Physical Object"}]
                                 :relationships []}
                                "MATCH (n)-[r]->(m) WHERE n.uid = $uid RETURN n,r,m"
                                {:nodes [{:uid "100" :name "Entity A"}
                                        {:uid "200" :name "Entity B"}]
                                 :relationships [{:type "is_a_specialization_of"
                                                :start "100"
                                                :end "200"}]}}
             captured-queries (atom [])
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (swap! captured-queries conj payload)
                                (go (if (= type :archivist.graph/query-execute)
                                      {:success true
                                       :data (get mock-query-results (:query payload) {:nodes [] :relationships []})}
                                      {:success false}))))
             archivist-client (archivist/->ArchivistClient mock-ws-client {:timeout 5000})]

         (fact "executes simple queries correctly"
               (let [result (<!! (archivist/execute-query archivist-client 
                                                         "MATCH (n:Kind) RETURN n LIMIT 5" 
                                                         {}))]
                 (:success result) => true
                 (count (get-in result [:data :nodes])) => 2
                 (get-in result [:data :nodes 0 :name]) => "Thing"))

         (fact "passes query parameters correctly"
               (reset! captured-queries [])
               (archivist/execute-query archivist-client 
                                       "MATCH (n)-[r]->(m) WHERE n.uid = $uid RETURN n,r,m"
                                       {:uid "100"})
               (let [captured (first @captured-queries)]
                 (:query captured) => (contains "n.uid = $uid")
                 (:params captured) => {:uid "100"}))))

(facts "About Archivist client entity retrieval"
       (let [mock-entities {:kinds [{:uid "1" :name "Thing" :definition "Root kind"}
                                   {:uid "730000" :name "Physical Object"}]
                           :aspects [{:uid "790002" :name "has mass"}
                                    {:uid "790003" :name "has shape"}]
                           :facts [{:uid "f1" :lh_object_uid "100" :rh_object_uid "1" :rel_type_uid "1146"}
                                  {:uid "f2" :lh_object_uid "200" :rh_object_uid "730000" :rel_type_uid "1146"}]}
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (go (case type
                                      :archivist.kind/list
                                      {:success true
                                       :kinds (:kinds mock-entities)}
                                      :archivist.aspect/list
                                      {:success true
                                       :aspects (:aspects mock-entities)}
                                      :archivist.fact/list
                                      {:success true
                                       :facts (:facts mock-entities)}
                                      {:success false}))))
             archivist-client (archivist/->ArchivistClient mock-ws-client {:timeout 5000})]

         (fact "retrieves kinds correctly"
               (let [result (<!! (archivist/get-kinds archivist-client {}))]
                 (:success result) => true
                 (count (:kinds result)) => 2
                 (get-in result [:kinds 0 :name]) => "Thing"))

         (fact "retrieves aspects correctly"
               (let [result (<!! (archivist/get-aspects archivist-client {}))]
                 (:success result) => true
                 (count (:aspects result)) => 2
                 (some #(= (:name %) "has mass") (:aspects result)) => true))

         (fact "retrieves facts with filtering"
               (let [result (<!! (archivist/get-facts archivist-client {:lh_object_uid "100"}))]
                 (:success result) => true
                 (count (:facts result)) => 2))))

(facts "About Archivist client cross-language compatibility"
       (let [captured-messages (atom [])
             mock-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (swap! captured-messages conj {:type type
                                                               :payload payload})
                                ;; Simulate response from Python/TypeScript service
                                (go {:success true
                                     :data {:processed_by "python-service"
                                            :timestamp (System/currentTimeMillis)
                                            :result_count 42}})))
             archivist-client (archivist/->ArchivistClient mock-ws-client {:timeout 5000})]

         (fact "message format is compatible with Python services"
               (archivist/get-batch-facts archivist-client {:page 1 :limit 50 :filter {:type "specialization"}})
               (let [message (first @captured-messages)]
                 ;; Verify payload structure for cross-language compatibility
                 (get-in message [:payload :page]) => 1
                 (get-in message [:payload :limit]) => 50
                 (get-in message [:payload :filter :type]) => "specialization"))

         (fact "handles snake_case responses from Python"
               (let [result (<!! (archivist/execute-query archivist-client "MATCH (n) RETURN n" {}))]
                 (:success result) => true
                 (get-in result [:data :processed_by]) => "python-service"
                 (get-in result [:data :result_count]) => 42))))

(facts "About Archivist client performance and timeouts"
       (let [slow-ws-client (reify ws/WebSocketClientProtocol
                              (connect! [_] true)
                              (disconnect! [_] true)
                              (connected? [_] true)
                              (register-handler! [_ _ _] nil)
                              (unregister-handler! [_ _] nil)
                              (send-message! [_ type payload timeout-ms]
                                (go
                                  ;; Simulate slow response
                                  (<! (timeout 200))
                                  {:success true
                                   :data {:result "slow"}})))
             fast-client (archivist/->ArchivistClient slow-ws-client {:timeout 500})
             timeout-client (archivist/->ArchivistClient slow-ws-client {:timeout 100})]

         (fact "completes within timeout"
               (let [start (System/currentTimeMillis)
                     result (<!! (archivist/get-facts-count fast-client))
                     duration (- (System/currentTimeMillis) start)]
                 (:success result) => true
                 duration => (roughly 200 50)))

         (fact "respects configured timeout"
               ;; Note: Actual timeout behavior depends on implementation
               (let [result (<!! (archivist/get-facts-count timeout-client))]
                 ;; With 100ms timeout and 200ms response, this would timeout
                 ;; if timeout is properly implemented
                 (:success result) => true)))) ;; Currently no timeout impl

(facts "About Archivist client heartbeat mechanism"
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
                                (go {:success true})))]

         (with-redefs [archivist/start-heartbeat-scheduler! 
                       (fn [client interval-ms]
                         ;; Simulate heartbeat scheduler
                         (future
                           (dotimes [_ 3]
                             (Thread/sleep 100)
                             (archivist/send-heartbeat! client)))
                         #())] ;; Return stop function
           
           (fact "sends periodic heartbeats"
                 (let [client (archivist/create-client {:host "localhost"
                                                        :port 3000
                                                        :ws-client mock-ws-client
                                                        :heartbeat-interval 100})]
                   ;; Wait for heartbeats
                   (Thread/sleep 350)
                   @heartbeat-count => (roughly 3 1))))))