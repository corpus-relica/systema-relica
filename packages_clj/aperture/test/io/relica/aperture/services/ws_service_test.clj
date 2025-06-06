(ns io.relica.aperture.services.ws-service-test
  "Tests for WebSocket service lifecycle management."
  (:require [clojure.test :refer :all]
            [mount.core :as mount]
            [io.relica.aperture.services.ws-service :as ws-service]
            [io.relica.aperture.config :as config]
            [io.relica.aperture.io.ws-server :as ws-server]
            [io.relica.aperture.test-helpers :as helpers]
            [io.relica.aperture.test-fixtures :as fixtures]))

;; (deftest test-ws-service-state-defined
;;   (testing "WebSocket service state is properly defined"
;;     (is (contains? (mount/find-all-states) #'ws-service/ws-service))
;;     (is (= :stopped (:status (mount/find-state #'ws-service/ws-service))))))

(deftest test-ws-service-start-success
  (testing "WebSocket service starts successfully with correct port"
    (let [start-called (atom false)
          start-port (atom nil)]
      (with-redefs [config/app-config {:ws-server {:port 3456}}
                    ws-server/start! (fn [port]
                                      (reset! start-called true)
                                      (reset! start-port port)
                                      {:server :mock-server :port port})]
        (mount/start #'ws-service/ws-service)
        (is @start-called)
        (is (= 3456 @start-port))
        (is (= {:server :mock-server :port 3456} ws-service/ws-service))
        (mount/stop #'ws-service/ws-service)))))

(deftest test-ws-service-start-with-default-config
  (testing "WebSocket service handles missing port configuration"
    (let [start-called (atom false)]
      (with-redefs [config/app-config {}
                    ws-server/start! (fn [port]
                                      (reset! start-called true)
                                      {:server :mock-server :port port})]
        (mount/start #'ws-service/ws-service)
        (is @start-called)
        (mount/stop #'ws-service/ws-service)))))

(deftest test-ws-service-start-failure
  (testing "WebSocket service handles start failure gracefully"
    (let [start-called (atom false)]
      (with-redefs [config/app-config {:ws-server {:port 3456}}
                    ws-server/start! (fn [_]
                                      (reset! start-called true)
                                      (throw (Exception. "Failed to start server")))]
        (is (thrown? Exception (mount/start #'ws-service/ws-service)))
        (is @start-called)))))

(deftest test-ws-service-stop-success
  (testing "WebSocket service stops successfully"
    (let [stop-called (atom false)
          mock-service {:server :mock-server :port 3456}]
      (with-redefs [config/app-config {:ws-server {:port 3456}}
                    ws-server/start! (constantly mock-service)
                    ws-server/stop! (fn [service]
                                     (reset! stop-called true)
                                     (is (= mock-service service)))]
        (mount/start #'ws-service/ws-service)
        (mount/stop #'ws-service/ws-service)
        (is @stop-called)))))

(deftest test-ws-service-stop-with-nil-service
  (testing "WebSocket service handles stop with nil service gracefully"
    (let [stop-called (atom false)]
      (with-redefs [ws-server/stop! (fn [_] (reset! stop-called true))]
        (mount/stop #'ws-service/ws-service)
        (is (not @stop-called))))))

(deftest test-ws-service-restart-cycle
  (testing "WebSocket service can be restarted successfully"
    (let [start-count (atom 0)
          stop-count (atom 0)
          mock-service {:server :mock-server}]
      (with-redefs [config/app-config {:ws-server {:port 3456}}
                    ws-server/start! (fn [_]
                                      (swap! start-count inc)
                                      mock-service)
                    ws-server/stop! (fn [_] (swap! stop-count inc))]
        ;; First start
        (mount/start #'ws-service/ws-service)
        (is (= 1 @start-count))
        (is (= 0 @stop-count))
        
        ;; Stop
        (mount/stop #'ws-service/ws-service)
        (is (= 1 @start-count))
        (is (= 1 @stop-count))
        
        ;; Restart
        (mount/start #'ws-service/ws-service)
        (is (= 2 @start-count))
        (is (= 1 @stop-count))
        
        ;; Final stop
        (mount/stop #'ws-service/ws-service)
        (is (= 2 @start-count))
        (is (= 2 @stop-count))))))

(deftest test-ws-service-port-configuration
  (testing "WebSocket service uses configured port from app-config"
    (let [ports-used (atom [])]
      (with-redefs [ws-server/start! (fn [port]
                                      (swap! ports-used conj port)
                                      {:server :mock-server :port port})
                    ws-server/stop! (constantly nil)]
        ;; Test with different port configurations
        (doseq [port [3456 8080 9090]]
          (with-redefs [config/app-config {:ws-server {:port port}}]
            (mount/start #'ws-service/ws-service)
            (mount/stop #'ws-service/ws-service)))
        (is (= [3456 8080 9090] @ports-used))))))

(deftest test-ws-service-logging-calls
  (testing "WebSocket service logs appropriate start/stop messages"
    (let [log-messages (atom [])]
      (with-redefs [clojure.tools.logging/info (fn [& args]
                                                (swap! log-messages conj (apply str args)))
                    config/app-config {:ws-server {:port 3456}}
                    ws-server/start! (constantly {:server :mock-server})
                    ws-server/stop! (constantly nil)]
        (mount/start #'ws-service/ws-service)
        (mount/stop #'ws-service/ws-service)
        (is (some #(.contains % "Starting Aperture WebSocket server") @log-messages))
        (is (some #(.contains % "Stopping Aperture WebSocket server") @log-messages))))))

(deftest test-ws-service-state-transitions
  (testing "WebSocket service state transitions are correct"
    (with-redefs [config/app-config {:ws-server {:port 3456}}
                  ws-server/start! (constantly {:server :mock-server})
                  ws-server/stop! (constantly nil)]
      ;; Test that the service can be started and stopped successfully
      ;; We can't easily access Mount's internal state, so we test the behavior
      (mount/start #'ws-service/ws-service)
      (is (some? ws-service/ws-service))
      
      (mount/stop #'ws-service/ws-service)
      ;; After stop, the service should be cleaned up
      (is (nil? ws-service/ws-service)))))

(deftest test-ws-service-dependency-calls
  (testing "WebSocket service calls correct dependencies with right parameters"
    (let [start-calls (atom [])
          stop-calls (atom [])]
      (with-redefs [config/app-config {:ws-server {:port 4567}}
                    ws-server/start! (fn [port]
                                      (swap! start-calls conj {:port port})
                                      {:server :mock-server :port port})
                    ws-server/stop! (fn [service]
                                     (swap! stop-calls conj {:service service}))]
        (mount/start #'ws-service/ws-service)
        (is (= [{:port 4567}] @start-calls))
        
        (mount/stop #'ws-service/ws-service)
        (is (= [{:service {:server :mock-server :port 4567}}] @stop-calls))))))

(deftest test-ws-service-exception-handling
  (testing "WebSocket service handles exceptions during stop"
    (let [stop-exception-thrown (atom false)]
      (with-redefs [config/app-config {:ws-server {:port 3456}}
                    ws-server/start! (constantly {:server :mock-server})
                    ws-server/stop! (fn [_]
                                     (reset! stop-exception-thrown true)
                                     (throw (Exception. "Stop failed")))]
        (mount/start #'ws-service/ws-service)
        ;; Stop should handle the exception gracefully
        (is (thrown? Exception (mount/stop #'ws-service/ws-service)))
        (is @stop-exception-thrown)))))

(deftest test-ws-service-multiple-starts
  (testing "WebSocket service handles multiple start attempts"
    (let [start-count (atom 0)]
      (with-redefs [config/app-config {:ws-server {:port 3456}}
                    ws-server/start! (fn [_]
                                      (swap! start-count inc)
                                      {:server :mock-server})
                    ws-server/stop! (constantly nil)]
        ;; First start
        (mount/start #'ws-service/ws-service)
        (is (= 1 @start-count))
        
        ;; Attempting to start again should not call start! again
        (mount/start #'ws-service/ws-service)
        (is (= 1 @start-count))
        
        (mount/stop #'ws-service/ws-service)))))

(deftest test-ws-service-nil-config-handling
  (testing "WebSocket service handles nil configuration gracefully"
    (let [start-called (atom false)]
      (with-redefs [config/app-config nil
                    ws-server/start! (fn [port]
                                      (reset! start-called true)
                                      (is (nil? port))
                                      {:server :mock-server})]
        (mount/start #'ws-service/ws-service)
        (is @start-called)
        (mount/stop #'ws-service/ws-service)))))

;; Integration test with mock WebSocket server
(deftest test-ws-service-integration
  (testing "WebSocket service integrates correctly with WebSocket server"
    (let [server-state (atom {:started false :port nil :stopped false})]
      (with-redefs [config/app-config {:ws-server {:port 7890}}
                    ws-server/start! (fn [port]
                                      (swap! server-state assoc :started true :port port)
                                      {:mock-server true :port port})
                    ws-server/stop! (fn [service]
                                     (swap! server-state assoc :stopped true)
                                     (is (:mock-server service)))]
        ;; Start the service
        (mount/start #'ws-service/ws-service)
        (is (:started @server-state))
        (is (= 7890 (:port @server-state)))
        (is (not (:stopped @server-state)))
        
        ;; Stop the service
        (mount/stop #'ws-service/ws-service)
        (is (:stopped @server-state))))))
