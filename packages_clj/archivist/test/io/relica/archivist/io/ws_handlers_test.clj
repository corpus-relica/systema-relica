(ns io.relica.archivist.io.ws-handlers-test
  (:require [midje.sweet :refer :all]
            [clojure.core.async :as async :refer [<! >! go chan]]
            [io.relica.archivist.utils.response :as response]
            [io.relica.archivist.test-helpers :as helpers]))

(fact "placeholder test for ws-handlers setup"
  (fact "this is just a placeholder until we implement actual handler tests"
    true => true))