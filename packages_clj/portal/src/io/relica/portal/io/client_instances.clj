(ns io.relica.portal.io.client-instances
  (:require [io.relica.common.io.archivist-client :as archivist]
            [io.relica.common.io.clarity-client :as clarity]
            [io.relica.common.io.aperture-client :as aperture]
            [io.relica.common.io.nous-client :as nous]
            ;; [io.relica.common.websocket.client :as ws]
            [io.relica.common.events.core :as events]
            [clojure.tools.logging :as log]
            [io.relica.portal.config :refer [app-config]]
            ))

;; ARCHIVIST

(defonce archivist-client (archivist/create-client
                           {:host (get-in app-config [:archivist :host])
                            :port (get-in app-config [:archivist :port])}))

;; CLARITY

(defonce clarity-client (clarity/create-client
                         {:host (get-in app-config [:clarity :host])
                          :port (get-in app-config [:clarity :port])}))

;; APERTURE

(def aperture-handlers
  {:handle-facts-loaded (fn [msg]
                          (tap> "Facts loaded:")
                          (tap> msg)
                          (events/publish-event {:type :facts-loaded
                                                 :payload msg}))
   :handle-facts-unloaded (fn [msg]
                            (tap> "Facts unloaded:")
                            (tap> msg)
                            (events/publish-event {:type :facts-unloaded :payload msg})) :handle-entity-selected (fn [msg] (events/publish-event {:type :entity-selected :payload msg}))
   :handle-entity-selected-none(fn [msg]
                                  (events/publish-event {:type :entity-selected-none
                                                         :payload msg}))})

;; Create Aperture client with handlers
(defonce aperture-client (aperture/create-client
                          {:host (get-in app-config [:aperture :host])
                           :port (get-in app-config [:aperture :port])
                           :handlers aperture-handlers}))

;; (ws/connect! aperture-client)

;; (ws/register-handler! aperture-client :entity/selected (fn [msg]
;;                                                               (tap> "Selected MUTHER FUCKING entity:")
;;                                                                (tap> msg)))


;; NOUS

(def nous-handlers
  {:handle-final-answer (fn [msg]
                          (println "Final answer:")
                          (println msg)
                          (events/publish-event {:type :final-answer
                                                 :payload msg}))
   ;; "heartbeat" (fn [msg]
   ;;              (tap> "Heartbeat:")
   ;;              (tap> msg)
   ;;              (events/publish-event {:type :heartbeat
   ;;                                     :payload msg}))
   ;; "question" (fn [msg]
   ;;             (tap> "Question:")
   ;;             (tap> msg)
   ;;             (events/publish-event {:type :question
   ;;                                    :payload msg}))
   }
  )

(defonce nous-client (nous/create-client
                      "ws://localhost:2204/ws"
                      {:handlers (merge
                                  nous-handlers
                                  {:on-connect (fn []
                                                 (tap> "Connected to NOUS")
                                                 (events/publish-event {:type :nous-connected}))
                                   :on-disconnect (fn []
                                                    (tap> "Disconnected from NOUS")
                                                    (events/publish-event {:type :nous-disconnected}))
                                   :on-message (fn [event-type payload]
                                                 (tap> "Received message from NOUS")
                                                 (events/publish-event {:type :nous-message-received
                                                                        :payload payload}))})}))
