(ns io.relica.aperture.io.ws-handlers-test
  (:require [midje.sweet :refer [fact facts contains anything]]
            [io.relica.aperture.io.ws-handlers :as handlers]
            [io.relica.common.websocket.server :as ws-server]
            [io.relica.aperture.test-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout]]))

;; Test that WebSocket message identifiers are correctly defined
(fact "Get operations are correctly defined"
      (methods ws-server/handle-ws-message) => (contains {:aperture.environment/get fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.environment/list fn?}))

(fact "Load operations are correctly defined"
      (methods ws-server/handle-ws-message) => (contains {:aperture.search/load-text fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.search/load-uid fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.specialization/load-fact fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.specialization/load fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.fact/load-related fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.entity/load fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.entity/load-multiple fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.subtype/load fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.subtype/load-cone fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.classification/load fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.classification/load-fact fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.composition/load fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.composition/load-in fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.connection/load fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.connection/load-in fn?}))

(fact "Unload operations are correctly defined"
      (methods ws-server/handle-ws-message) => (contains {:aperture.entity/unload fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.entity/unload-multiple fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.subtype/unload-cone fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.environment/clear fn?}))

(fact "Other operations are correctly defined"
      (methods ws-server/handle-ws-message) => (contains {:aperture.environment/create fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.entity/select fn?})
      (methods ws-server/handle-ws-message) => (contains {:aperture.entity/deselect fn?}))

;; We'll add more tests for response formatting and error handling in future PRs