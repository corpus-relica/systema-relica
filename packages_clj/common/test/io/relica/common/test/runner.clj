(ns io.relica.common.test.runner
  (:require [midje.runner :as runner]))

(defn -main [& args]
  (runner/run-tests))