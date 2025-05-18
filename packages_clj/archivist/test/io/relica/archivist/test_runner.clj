(ns io.relica.archivist.test-runner
  (:require [midje.repl :as midje]
            [clojure.tools.namespace.find :as find]
            [clojure.java.io :as io]))

(defn run-tests []
  (let [namespaces (find/find-namespaces-in-dir (io/file "test"))]
    (println "Running tests in namespaces:" namespaces)
    (doseq [ns namespaces]
      (midje/load-facts ns))
    (midje/check-facts)))

(defn -main [& args]
  (run-tests)
  (System/exit 0))