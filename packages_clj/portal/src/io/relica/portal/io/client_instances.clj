(ns io.relica.portal.io.client-instances
  (:require [io.relica.common.io.archivist-client :as archivist]
            [io.relica.common.io.clarity-client :as clarity]
            [io.relica.common.io.aperture-client :as aperture]
            ;; [io.relica.common.websocket.client :as ws]
            [io.relica.common.events.core :as events]
            [clojure.tools.logging :as log]
            ))

;; ARCHIVIST

(defonce archivist-client (archivist/create-client))
(archivist/connect! archivist-client)

;; CLARITY

(defonce clarity-client (clarity/create-client
                         "http://localhost:2176"
                         {}))

;; APERTURE

(def aperture-handlers
  {:handle-entity-selected (fn [msg]
                             (tap> "Selected entity GGGGGGOOOOOOODDDDDDAAAAAAAMMMMMMMNNNNNNIIIIIITTTTT!!!!!:")
                             (tap> msg)
                             (events/publish-event {:type :entity-selected
                                                    :payload msg}))
   :handle-entity-selected-none(fn [msg]
                                  (tap> "Deselected entity GGGGGGOOOOOOODDDDDDAAAAAAAMMMMMMMNNNNNNIIIIIITTTTT!!!!!:")
                                  (tap> msg)
                                  (events/publish-event {:type :entity-selected-none
                                                         :payload msg}))})

;; Create Aperture client with handlers
(defonce aperture-client (aperture/create-client
                          "http://localhost:2175"
                          {:handlers aperture-handlers}))

;; (ws/connect! aperture-client)

;; (ws/register-handler! aperture-client :entity/selected (fn [msg]
;;                                                               (tap> "Selected MUTHER FUCKING entity:")
;;                                                                (tap> msg)))
