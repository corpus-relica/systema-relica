(ns io.relica.aperture.io.ws-handlers-test
  (:require [clojure.test :refer :all]
            [io.relica.aperture.io.ws-handlers :as handlers]
            [io.relica.common.websocket.server :as ws-server]
            [clojure.core.async :refer [go <! >! chan timeout]]))

(deftest test-message-identifiers
  (testing "WebSocket message identifiers are correctly defined"
    ;; Get operations
    (is (contains? (methods ws-server/handle-ws-message) :aperture.environment/get))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.environment/list))

    ;; Load operations
    (is (contains? (methods ws-server/handle-ws-message) :aperture.search/load-text))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.search/load-uid))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.specialization/load-fact))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.specialization/load))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.fact/load-related))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.entity/load))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.entity/load-multiple))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.subtype/load))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.subtype/load-cone))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.classification/load))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.classification/load-fact))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.composition/load))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.composition/load-in))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.connection/load))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.connection/load-in))

    ;; Unload operations
    (is (contains? (methods ws-server/handle-ws-message) :aperture.entity/unload))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.entity/unload-multiple))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.subtype/unload-cone))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.environment/clear))

    ;; Other operations
    (is (contains? (methods ws-server/handle-ws-message) :aperture.environment/create))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.entity/select))
    (is (contains? (methods ws-server/handle-ws-message) :aperture.entity/deselect))))