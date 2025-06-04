(ns io.relica.common.io.aperture-client-test
  "Comprehensive tests for the Aperture client including message identifiers, error handling,
   connection management, and cross-language compatibility."
  (:require [clojure.test :refer [deftest testing is]]
            [io.relica.common.io.aperture-client :as aperture]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.test-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout close! alts! <!!]]))

(deftest aperture-client-message-identifiers-test
  (testing "About Aperture client message identifiers"
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
          aperture-client (aperture/->ApertureClient mock-ws-client {:timeout 5000})]

      ;; Test environment operations
      (testing "get-environment uses standardized message identifier"
        (aperture/get-environment aperture-client "user-123" "env-456")
        (is (= :aperture.environment/get (:type (first @captured-messages)))))

      (testing "send-heartbeat! uses standardized message identifier"
        (reset! captured-messages [])
        (aperture/send-heartbeat! aperture-client)
        (is (= :relica.app/heartbeat (:type (first @captured-messages))))))))

(deftest aperture-client-environment-operations-test
  (testing "About Aperture client environment operations"
    (let [captured-messages (atom [])
          mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (swap! captured-messages conj {:type type :payload payload})
                             (go {:success true
                                  :data (case type
                                          :aperture.environment/get
                                          {:environment-id "env-456"
                                           :user-id "user-123"
                                           :name "Development Environment"
                                           :description "Test environment for development"
                                           :created-at "2024-01-01T12:00:00.000Z"
                                           :entities-count 142}
                                          {})})))
          aperture-client (aperture/->ApertureClient mock-ws-client {:timeout 5000})]

      (testing "retrieves environment data with metadata"
        (let [result (<!! (aperture/get-environment aperture-client "user-123" "env-456"))]
          (is (= true (:success result)))
          (is (= "env-456" (get-in result [:data :environment-id])))
          (is (= "user-123" (get-in result [:data :user-id])))
          (is (= "Development Environment" (get-in result [:data :name])))
          (is (= 142 (get-in result [:data :entities-count])))))

      (testing "passes parameters correctly"
        (aperture/get-environment aperture-client "user-789" "env-123")
        (let [message (first @captured-messages)]
          (is (= "user-789" (:user-id (:payload message))))
          (is (= "env-123" (:environment-id (:payload message)))))))))

(deftest aperture-client-error-handling-test
  (testing "About Aperture client error handling"
    (let [mock-ws-client (reify ws/WebSocketClientProtocol
                           (connect! [_] true)
                           (disconnect! [_] true)
                           (connected? [_] true)
                           (register-handler! [_ _ _] nil)
                           (unregister-handler! [_ _] nil)
                           (send-message! [_ type payload timeout-ms]
                             (go (case type
                                   :aperture.environment/get
                                   {:success false
                                    :error {:code 3201
                                            :type "environment-not-found"
                                            :message "Environment does not exist or access denied"
                                            :details {:environment-id (:environment-id payload)
                                                     :user-id (:user-id payload)}}}
                                   {:success false
                                    :error {:code 3002
                                            :type "internal-error"}}))))
          aperture-client (aperture/->ApertureClient mock-ws-client {:timeout 5000})]

      (testing "handles environment not found errors"
        (let [result (<!! (aperture/get-environment aperture-client "user-123" "non-existent-env"))]
          (is (= false (:success result)))
          (is (= 3201 (get-in result [:error :code])))
          (is (= "environment-not-found" (get-in result [:error :type])))
          (is (= "non-existent-env" (get-in result [:error :details :environment-id])))
          (is (= "user-123" (get-in result [:error :details :user-id]))))))))

(deftest aperture-client-cross-language-compatibility-test
  (testing "About Aperture client cross-language compatibility"
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
                                  :data {:environmentId "env-456"
                                         :userId "user-123"
                                         :displayName "My Environment"
                                         :isActive true
                                         :lastAccessed "2024-01-01T12:00:00.000Z"
                                         :entitiesCount 42}})))
          aperture-client (aperture/->ApertureClient mock-ws-client {:timeout 5000})]

      (testing "sends requests compatible with TypeScript service"
        (aperture/get-environment aperture-client "user-123" "env-456")
        (let [message (first @captured-messages)]
          (is (= "user-123" (:user-id message)))
          (is (= "env-456" (:environment-id message)))))

      (testing "handles TypeScript camelCase responses"
        (let [result (<!! (aperture/get-environment aperture-client "user-123" "env-456"))]
          (is (= true (:success result)))
          (is (= "env-456" (get-in result [:data :environmentId])))
          (is (= "user-123" (get-in result [:data :userId])))
          (is (= true (get-in result [:data :isActive])))
          (is (= 42 (get-in result [:data :entitiesCount])))))))

(deftest aperture-client-heartbeat-mechanism-test
  (testing "About Aperture client heartbeat mechanism"
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
          aperture-client (aperture/->ApertureClient mock-ws-client {:timeout 5000})]

      (testing "sends heartbeat messages"
        (aperture/send-heartbeat! aperture-client)
        (is (= 1 @heartbeat-count)))))))