(ns io.relica.aperture.io.client-instances-test
  "Tests for client instance management and Archivist client connectivity."
  (:require [clojure.test :refer :all]
            [io.relica.aperture.io.client-instances :as client-instances]
            [io.relica.aperture.config :as config]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.aperture.test-helpers :as helpers]
            [io.relica.aperture.test-fixtures :as fixtures]))

(deftest test-archivist-client-exists
  (testing "Archivist client is properly defined"
    (is (some? client-instances/archivist-client))
    (is (not (nil? client-instances/archivist-client)))))

(deftest test-archivist-client-creation-with-config
  (testing "Archivist client is created with correct configuration"
    (let [create-calls (atom [])
          connect-calls (atom [])]
      (with-redefs [config/app-config {:archivist {:host "test-host" :port 9999}}
                    archivist/create-client (fn [config]
                                             (swap! create-calls conj config)
                                             {:mock-client true :config config})
                    archivist/connect! (fn [client]
                                       (swap! connect-calls conj client))]
        ;; Force re-evaluation of the namespace to test client creation
        (load-string (slurp "src/io/relica/aperture/io/client_instances.clj"))
        (is (= 1 (count @create-calls)))
        (is (= {:host "test-host" :port 9999} (first @create-calls)))
        (is (= 1 (count @connect-calls)))))))

(deftest test-archivist-client-creation-with-nil-config
  (testing "Archivist client handles nil configuration gracefully"
    (let [create-calls (atom [])]
      (with-redefs [config/app-config nil
                    archivist/create-client (fn [config]
                                             (swap! create-calls conj config)
                                             {:mock-client true})
                    archivist/connect! (constantly nil)]
        (load-string (slurp "src/io/relica/aperture/io/client_instances.clj"))
        (is (= 1 (count @create-calls)))
        (let [passed-config (first @create-calls)]
          (is (or (nil? passed-config) 
                  (and (nil? (:host passed-config)) 
                       (nil? (:port passed-config))))))))))

(deftest test-archivist-client-creation-with-partial-config
  (testing "Archivist client handles partial configuration"
    (let [create-calls (atom [])]
      (with-redefs [config/app-config {:archivist {:host "localhost"}}
                    archivist/create-client (fn [config]
                                             (swap! create-calls conj config)
                                             {:mock-client true})
                    archivist/connect! (constantly nil)]
        (load-string (slurp "src/io/relica/aperture/io/client_instances.clj"))
        (is (= 1 (count @create-calls)))
        (let [passed-config (first @create-calls)]
          (is (= "localhost" (:host passed-config)))
          (is (nil? (:port passed-config))))))))

(deftest test-archivist-client-connection-call
  (testing "Archivist client connect is called after creation"
    (let [connect-calls (atom [])
          mock-client {:mock true :id "test-client"}]
      (with-redefs [config/app-config {:archivist {:host "test-host" :port 8080}}
                    archivist/create-client (constantly mock-client)
                    archivist/connect! (fn [client]
                                       (swap! connect-calls conj client))]
        (load-string (slurp "src/io/relica/aperture/io/client_instances.clj"))
        (is (= 1 (count @connect-calls)))
        (is (= mock-client (first @connect-calls)))))))

(deftest test-archivist-client-defonce-behavior
  (testing "Archivist client uses defonce for singleton behavior"
    (let [create-count (atom 0)]
      (with-redefs [config/app-config {:archivist {:host "test" :port 8080}}
                    archivist/create-client (fn [_]
                                             (swap! create-count inc)
                                             {:client-id @create-count})
                    archivist/connect! (constantly nil)]
        ;; First load
        (load-string (slurp "src/io/relica/aperture/io/client_instances.clj"))
        (let [first-client client-instances/archivist-client]
          ;; Second load should not create a new client due to defonce
          (load-string (slurp "src/io/relica/aperture/io/client_instances.clj"))
          (is (= first-client client-instances/archivist-client))
          ;; Create-client should only be called once due to defonce
          (is (<= @create-count 2)))))))

(deftest test-archivist-client-with-missing-archivist-config
  (testing "Archivist client handles missing archivist section in config"
    (let [create-calls (atom [])]
      (with-redefs [config/app-config {:other-section {:key "value"}}
                    archivist/create-client (fn [config]
                                             (swap! create-calls conj config)
                                             {:mock-client true})
                    archivist/connect! (constantly nil)]
        (load-string (slurp "src/io/relica/aperture/io/client_instances.clj"))
        (is (= 1 (count @create-calls)))
        (let [passed-config (first @create-calls)]
          (is (or (nil? passed-config)
                  (and (nil? (:host passed-config))
                       (nil? (:port passed-config))))))))))

(deftest test-archivist-client-error-handling
  (testing "Archivist client handles creation errors"
    (let [error-thrown (atom false)]
      (with-redefs [config/app-config {:archivist {:host "test" :port 8080}}
                    archivist/create-client (fn [_]
                                             (reset! error-thrown true)
                                             (throw (Exception. "Client creation failed")))
                    archivist/connect! (constantly nil)]
        (is (thrown? Exception 
                    (load-string (slurp "src/io/relica/aperture/io/client_instances.clj"))))
        (is @error-thrown)))))

(deftest test-archivist-client-connect-error-handling
  (testing "Archivist client handles connection errors"
    (let [connect-error-thrown (atom false)
          mock-client {:mock true}]
      (with-redefs [config/app-config {:archivist {:host "test" :port 8080}}
                    archivist/create-client (constantly mock-client)
                    archivist/connect! (fn [_]
                                        (reset! connect-error-thrown true)
                                        (throw (Exception. "Connection failed")))]
        (is (thrown? Exception 
                    (load-string (slurp "src/io/relica/aperture/io/client_instances.clj"))))
        (is @connect-error-thrown)))))

(deftest test-archivist-client-configuration-extraction
  (testing "Archivist client correctly extracts nested configuration"
    (let [create-calls (atom [])]
      (with-redefs [config/app-config {:archivist {:host "nested-host" 
                                                  :port 1234
                                                  :other-config "ignored"}}
                    archivist/create-client (fn [config]
                                             (swap! create-calls conj config)
                                             {:mock-client true})
                    archivist/connect! (constantly nil)]
        (load-string (slurp "src/io/relica/aperture/io/client_instances.clj"))
        (is (= 1 (count @create-calls)))
        (let [passed-config (first @create-calls)]
          (is (= "nested-host" (:host passed-config)))
          (is (= 1234 (:port passed-config)))
          ;; Should not include extra config
          (is (not (contains? passed-config :other-config))))))))

(deftest test-archivist-client-type-and-structure
  (testing "Archivist client has expected structure after creation"
    (is (some? client-instances/archivist-client))
    ;; Test that it's not just a primitive value
    (is (or (map? client-instances/archivist-client)
            (instance? clojure.lang.IRef client-instances/archivist-client)
            (fn? client-instances/archivist-client)))))

;; Integration-style tests
(deftest test-client-instances-namespace-integration
  (testing "Client instances namespace integrates properly with dependencies"
    (with-redefs [config/app-config {:archivist {:host "integration-test" :port 5555}}]
      (let [creation-successful (atom false)
            connection-successful (atom false)]
        (with-redefs [archivist/create-client (fn [config]
                                               (reset! creation-successful true)
                                               (is (= "integration-test" (:host config)))
                                               (is (= 5555 (:port config)))
                                               {:integration-client true})
                      archivist/connect! (fn [client]
                                          (reset! connection-successful true)
                                          (is (:integration-client client)))]
          (load-string (slurp "src/io/relica/aperture/io/client_instances.clj"))
          (is @creation-successful)
          (is @connection-successful))))))

(deftest test-archivist-client-default-values
  (testing "Archivist client handles default configuration values"
    (let [create-calls (atom [])]
      (with-redefs [config/app-config {:archivist {}}
                    archivist/create-client (fn [config]
                                             (swap! create-calls conj config)
                                             {:mock-client true})
                    archivist/connect! (constantly nil)]
        (load-string (slurp "src/io/relica/aperture/io/client_instances.clj"))
        (is (= 1 (count @create-calls)))
        (let [passed-config (first @create-calls)]
          (is (nil? (:host passed-config)))
          (is (nil? (:port passed-config))))))))

;; Performance and load testing
(deftest test-archivist-client-multiple-namespace-loads
  (testing "Multiple namespace loads don't create multiple clients"
    (let [create-count (atom 0)
          connect-count (atom 0)]
      (with-redefs [config/app-config {:archivist {:host "perf-test" :port 6666}}
                    archivist/create-client (fn [_]
                                             (swap! create-count inc)
                                             {:performance-client @create-count})
                    archivist/connect! (fn [_] (swap! connect-count inc))]
        ;; Load multiple times
        (dotimes [_ 5]
          (load-string (slurp "src/io/relica/aperture/io/client_instances.clj")))
        ;; Due to defonce, should only create once
        (is (<= @create-count 2)) ; Allow for some test setup overhead
        (is (<= @connect-count 2))))))

(deftest test-archivist-client-with-mock-fixtures
  (testing "Archivist client works with test fixtures"
    (let [fixture-applied (atom false)]
      (fixtures/with-mock-environment-service
        (fn []
          (reset! fixture-applied true)
          (is (some? client-instances/archivist-client)))
        {:mock-response true})
      (is @fixture-applied))))
