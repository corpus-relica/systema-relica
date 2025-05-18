(ns io.relica.prism.io.ws-handlers-test
  (:require [midje.sweet :refer [fact facts contains anything]]
            [io.relica.prism.io.ws-handlers :as handlers]
            [io.relica.common.websocket.server :as ws-server]
            [io.relica.prism.test-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]))

;; Test that WebSocket message identifiers are correctly defined
(fact "System operations are correctly defined"
      (methods ws-server/handle-ws-message) => (contains {:relica.app/heartbeat fn?}))

(fact "Setup operations are correctly defined"
      (methods ws-server/handle-ws-message) => (contains {:prism.setup/get-status fn?})
      (methods ws-server/handle-ws-message) => (contains {:prism.setup/start fn?})
      (methods ws-server/handle-ws-message) => (contains {:prism.setup/create-user fn?}))