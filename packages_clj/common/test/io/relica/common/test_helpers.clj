(ns io.relica.common.test-helpers
  "Common test helpers for the common module."
  (:require [midje.sweet :refer [fact facts contains anything]]
            [io.relica.common.test.midje-helpers :as midje-helpers]))

;; Re-export all the midje-helpers functions
(def wait-for midje-helpers/wait-for)
(def async-fact midje-helpers/async-fact)
(def mock-ws-message midje-helpers/mock-ws-message)
(def capture-reply midje-helpers/capture-reply)
(def ws-handler-test midje-helpers/ws-handler-test)
(def with-test-db midje-helpers/with-test-db)
(def mock-request midje-helpers/mock-request)
(def mock-response midje-helpers/mock-response)

;; Add any common-specific test helpers below