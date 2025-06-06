(ns io.relica.aperture.io.ws-handlers-test
  (:require [clojure.test :refer :all]
            [io.relica.aperture.io.ws-handlers :as handlers]
            [io.relica.common.websocket.server :as ws-server]
            [io.relica.aperture.test-helpers :as helpers]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]))

(deftest test-get-operations-defined
  (testing "Get operations are correctly defined"
    (let [methods (methods ws-server/handle-ws-message)]
      (is (contains? methods :aperture.environment/get))
      (is (contains? methods :aperture.environment/list))
      (is (fn? (get methods :aperture.environment/get)))
      (is (fn? (get methods :aperture.environment/list))))))

(deftest test-load-operations-defined
  (testing "Load operations are correctly defined"
    (let [methods (methods ws-server/handle-ws-message)]
      (is (contains? methods :aperture.search/load-text))
      (is (contains? methods :aperture.search/load-uid))
      (is (contains? methods :aperture.specialization/load-fact))
      (is (contains? methods :aperture.specialization/load))
      (is (contains? methods :aperture.fact/load-related))
      (is (contains? methods :aperture.entity/load))
      (is (contains? methods :aperture.entity/load-multiple))
      (is (contains? methods :aperture.subtype/load))
      (is (contains? methods :aperture.subtype/load-cone))
      (is (contains? methods :aperture.classification/load))
      (is (contains? methods :aperture.classification/load-fact))
      (is (contains? methods :aperture.composition/load))
      (is (contains? methods :aperture.composition/load-in))
      (is (contains? methods :aperture.connection/load))
      (is (contains? methods :aperture.connection/load-in))
      
      ;; Verify they are functions
      (is (fn? (get methods :aperture.search/load-text)))
      (is (fn? (get methods :aperture.entity/load)))
      (is (fn? (get methods :aperture.classification/load))))))

(deftest test-unload-operations-defined
  (testing "Unload operations are correctly defined"
    (let [methods (methods ws-server/handle-ws-message)]
      (is (contains? methods :aperture.entity/unload))
      (is (contains? methods :aperture.entity/unload-multiple))
      (is (contains? methods :aperture.subtype/unload-cone))
      (is (contains? methods :aperture.environment/clear))
      
      ;; Verify they are functions
      (is (fn? (get methods :aperture.entity/unload)))
      (is (fn? (get methods :aperture.environment/clear))))))

(deftest test-other-operations-defined
  (testing "Other operations are correctly defined"
    (let [methods (methods ws-server/handle-ws-message)]
      (is (contains? methods :aperture.environment/create))
      (is (contains? methods :aperture.entity/select))
      (is (contains? methods :aperture.entity/deselect))
      
      ;; Verify they are functions
      (is (fn? (get methods :aperture.environment/create)))
      (is (fn? (get methods :aperture.entity/select)))
      (is (fn? (get methods :aperture.entity/deselect))))))