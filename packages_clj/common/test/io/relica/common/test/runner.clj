(ns io.relica.common.test.runner
  (:require [midje.repl :as midje]))

(defn -main [& args]
  (midje/load-facts))