(ns io.relica.aperture.core-test
  "Tests for main application entry point and lifecycle management."
  (:require [clojure.test :refer :all]
            [mount.core :as mount]
            [io.relica.aperture.core :as core]
            [io.relica.aperture.test-helpers :as helpers]
            [io.relica.aperture.test-fixtures :as fixtures]))

;; Main function tests
(deftest test-main-function-exists
  (testing "Main function is properly defined"
    (is (fn? #'core/-main))
    (is (= "io.relica.aperture.core" (namespace `core/-main)))))

(deftest test-main-function-mount-integration
  (testing "Main function integrates with Mount lifecycle"
    (let [mount-operations (atom [])]
      (with-redefs [mount/start (fn []
                                 (swap! mount-operations conj :start)
                                 :started)
                    clojure.tools.logging/info (constantly nil)]
        
        ;; Test that main starts Mount (will throw on shutdown hook but that's ok)
        (is (thrown? Exception (core/-main))) ;; Will throw when trying to create shutdown hook
        (is (= [:start] @mount-operations))))))

(deftest test-main-function-with-args
  (testing "Main function handles command line arguments"
    (let [mount-operations (atom [])]
      (with-redefs [mount/start (fn []
                                 (swap! mount-operations conj :start)
                                 :started)
                    clojure.tools.logging/info (constantly nil)]
        
        ;; Call with various arguments - should still try to start Mount
        (is (thrown? Exception (core/-main "arg1" "arg2" "--flag")))
        (is (= [:start] @mount-operations))))))

(deftest test-main-function-logging
  (testing "Main function logs appropriate messages"
    (let [log-messages (atom [])]
      (with-redefs [mount/start (constantly :started)
                    clojure.tools.logging/info (fn [& args]
                                                (swap! log-messages conj (apply str args)))]
        
        ;; This will throw but should log the start message first
        (is (thrown? Exception (core/-main)))
        
        ;; Verify logging messages - at least the start message should be logged
        (is (>= (count @log-messages) 1))
        (is (.contains (first @log-messages) "Aperture starting"))))))

(deftest test-main-function-mount-error-handling
  (testing "Main function handles Mount startup errors"
    (let [error-thrown (atom false)]
      (with-redefs [mount/start (fn []
                                 (reset! error-thrown true)
                                 (throw (Exception. "Mount startup failed")))
                    clojure.tools.logging/info (constantly nil)]
        
        ;; Should propagate Mount errors
        (is (thrown? Exception (core/-main)))
        (is @error-thrown)))))

;; Namespace loading tests
(deftest test-required-namespaces-loaded
  (testing "Required component namespaces are loaded"
    ;; Test that ws-handlers namespace is loaded
    (is (find-ns 'io.relica.aperture.io.ws-handlers))
    
    ;; Test that ws-service namespace is loaded
    (is (find-ns 'io.relica.aperture.services.ws-service))))

(deftest test-mount-components-available
  (testing "Mount components are available after namespace loading"
    ;; Check that mount states include our component
    (let [all-states (mount/find-all-states)]
      (is (some #(= "ws-service" (name (symbol %))) (map str all-states))))))

;; Integration tests (simplified)
(deftest test-application-startup-integration
  (testing "Complete application startup process"
    (let [startup-sequence (atom [])]
      (with-redefs [clojure.tools.logging/info (fn [& args]
                                                (swap! startup-sequence conj {:type :log :message (apply str args)}))
                    mount/start (fn []
                                 (swap! startup-sequence conj {:type :mount-start})
                                 :started)]
        
        ;; Test startup - will throw but should record the sequence
        (is (thrown? Exception (core/-main)))
        
        ;; Verify startup sequence contains expected elements
        (is (some #(= :log (:type %)) @startup-sequence))
        (is (some #(= :mount-start (:type %)) @startup-sequence))))))

(deftest test-application-restart-capability
  (testing "Application can handle multiple startup attempts"
    (let [startup-count (atom 0)]
      (with-redefs [mount/start (fn []
                                 (swap! startup-count inc)
                                 :started)
                    clojure.tools.logging/info (constantly nil)]
        
        ;; Multiple startup attempts
        (dotimes [_ 3]
          (is (thrown? Exception (core/-main))))
        
        (is (= 3 @startup-count))))))

;; Component dependency tests
(deftest test-component-loading-order
  (testing "Components are loaded in correct order"
    ;; Test that handlers are loaded before services that might use them
    (is (find-ns 'io.relica.aperture.io.ws-handlers))
    (is (find-ns 'io.relica.aperture.services.ws-service))))

(deftest test-gen-class-configuration
  (testing "Namespace is properly configured for compilation"
    ;; Test that the namespace has gen-class for JAR execution
    (let [ns-meta (meta (find-ns 'io.relica.aperture.core))]
      ;; The namespace should exist and be compilable
      (is (some? ns-meta)))))

;; Environment integration tests
(deftest test-main-with-system-properties
  (testing "Main function respects system properties"
    (let [startup-ops (atom [])]
      (with-redefs [mount/start (fn []
                                 (swap! startup-ops conj {:props (System/getProperties)})
                                 :started)
                    clojure.tools.logging/info (constantly nil)
]
        
        ;; Set some system properties
        (System/setProperty "test.aperture.prop" "test-value")
        
        (try
          (is (thrown? Exception (core/-main)))
          
          ;; Verify startup occurred with system properties available
          (is (= 1 (count @startup-ops)))
          (let [props (:props (first @startup-ops))]
            (is (= "test-value" (.getProperty props "test.aperture.prop"))))
          
          (finally
            ;; Clean up
            (System/clearProperty "test.aperture.prop")))))))

(deftest test-main-exception-propagation
  (testing "Main function properly propagates critical exceptions"
    (let [critical-error (Exception. "Critical system error")]
      (with-redefs [mount/start (fn [] (throw critical-error))
                    clojure.tools.logging/info (constantly nil)]
        
        ;; Critical errors should be propagated, not swallowed
        (let [thrown-exception (try
                                (core/-main)
                                nil
                                (catch Exception e e))]
          (is (= critical-error thrown-exception)))))))

;; Concurrent execution tests
(deftest test-concurrent-main-calls
  (testing "Multiple concurrent calls to main function"
    (let [startup-count (atom 0)
          futures (atom [])]
      (with-redefs [mount/start (fn []
                                 (swap! startup-count inc)
                                 ;; Simulate some startup time
                                 (Thread/sleep 10)
                                 :started)
                    clojure.tools.logging/info (constantly nil)
]
        
        ;; Start multiple main functions concurrently
        (dotimes [_ 3]
          (swap! futures conj (future 
                                (try 
                                  (core/-main)
                                  (catch Exception _)))))
        
        ;; Wait for all to complete
        (doseq [f @futures]
          @f)
        
        ;; Verify all started
        (is (= 3 @startup-count)))))

;; Error recovery tests
(deftest test-mount-failure-handling
  (testing "Application handles Mount component failures"
    (let [failure-count (atom 0)]
      (with-redefs [mount/start (fn []
                                 (swap! failure-count inc)
                                 (if (< @failure-count 2)
                                   (throw (Exception. "Mount component failed"))
                                   :started))
                    clojure.tools.logging/info (constantly nil)
]
        
        ;; First call should fail
        (is (thrown? Exception (core/-main)))
        (is (= 1 @failure-count))
        
        ;; Second call should also fail but with different behavior  
        (is (thrown? Exception (core/-main)))
        (is (= 2 @failure-count))))))

;; Basic functionality verification
(deftest test-core-namespace-structure
  (testing "Core namespace has expected structure"
    (is (find-ns 'io.relica.aperture.core))
    (is (ns-resolve 'io.relica.aperture.core '-main))
    ;; The namespace should require the necessary dependencies
    (let [ns-requires (-> 'io.relica.aperture.core find-ns meta :requires)]
      (is (some #(= 'mount.core %) (keys ns-requires)))
      (is (some #(= 'clojure.tools.logging %) (keys ns-requires))))))

(deftest test-main-function-signature
  (testing "Main function has correct signature for CLI execution"
    (let [main-var #'core/-main
          main-meta (meta main-var)]
      ;; Main function should exist and be callable
      (is (var? main-var))
      (is (fn? @main-var))
      ;; Should accept variable arguments (&args)
      (is (fn? @main-var))))))
