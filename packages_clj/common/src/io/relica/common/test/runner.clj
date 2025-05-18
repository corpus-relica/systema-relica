(ns io.relica.common.test.runner
  "Common test runner for Midje tests across all Relica modules.
   This can be used as a main entry point for running tests from the command line."
  (:require [midje.repl :as midje]
            [clojure.tools.namespace.find :as find]
            [clojure.java.io :as io]
            [clojure.string :as str])
  (:gen-class))

(defn find-test-namespaces
  "Find all test namespaces in the given directory."
  [dir]
  (filter #(re-find #"-test$" (name %))
          (find/find-namespaces-in-dir (io/file dir))))

(defn run-tests
  "Run all tests in the given namespaces."
  [namespaces]
  (println "Running tests in namespaces:" (str/join ", " namespaces))
  (doseq [ns namespaces]
    (println "Loading namespace:" ns)
    (try
      (require ns)
      (catch Exception e
        (println "Error loading namespace:" ns)
        (println (.getMessage e)))))

  (let [results (midje/check-facts)]
    (println "Test results:" results)
    (if (and results (zero? (:failures results 0)))
      (System/exit 0)
      (System/exit 1))))

(defn run-tests-in-dir
  "Run all tests in the given directory."
  [dir]
  (let [namespaces (find-test-namespaces dir)]
    (run-tests namespaces)))

(defn -main
  "Run all tests in the test directory.
   Usage: clojure -M:midje -m io.relica.common.test.runner [test-dir]
   If test-dir is not provided, defaults to 'test'."
  [& args]
  (let [test-dir (or (first args) "test")]
    (println "Running tests in directory:" test-dir)
    (run-tests-in-dir test-dir)))

;; Example usage in a module's deps.edn:
;;
;; :aliases {:test {:extra-paths ["test"]
;;                  :extra-deps {midje/midje {:mvn/version "1.10.9"}
;;                               org.clojure/tools.namespace {:mvn/version "1.4.4"}}
;;                  :main-opts ["-m" "io.relica.common.test.runner"]}}