(ns io.relica.portal.io.client-instances
  (:require [io.relica.common.io.archivist-client :as archivist]
            [io.relica.common.io.aperture-client :as aperture]
            [io.relica.common.websocket.client :as ws]
            [io.relica.common.events.core :as events]
            [clojure.tools.logging :as log]
            ))

;; ARCHIVIST

(defonce archivist-client (archivist/create-client))
(archivist/connect! archivist-client)

;; APERTURE

(def aperture-handlers
  {
   ;; :on-connect (fn []
   ;;               (log/info "Connected to Aperture WebSocket"))
   ;; :on-disconnect (fn []
   ;;                  (log/info "Disconnected from Aperture WebSocket"))
   ;; :on-message (fn [msg]
   ;;               (tap> ("Received message from Aperture:" msg))
   ;;               ;; Handle different message types
   ;;               ;; (case (:type msg)
   ;;               ;;   "text_search_result" (handle-text-search-result msg)
   ;;               ;;   ;; Add other message type handlers as needed
   ;;               ;;   (log/warn "Unhandled message type from Aperture:" (:type msg)))
   ;;               )
   ;; :on-error (fn [e]
   ;;             (log/error "Aperture WebSocket error:" e))
   ;; :handle-app-notification (fn [msg]
   ;;                        (tap> "LLEEEEEEEEETTTTTS GOOOOOOOOOOOOOOOOOOOOOOOO - !!!! - *^&#$*()#$&)@( Received app sending notification:")
   ;;                        (tap> msg))
   :handle-entity-selected (fn [msg]
                            (tap> "Selected entity GGGGGGOOOOOOODDDDDDAAAAAAAMMMMMMMNNNNNNIIIIIITTTTT!!!!!:")
                            (tap> msg)
                            (events/publish-event {:type :entity-selected
                                                   :payload msg}))})

;; Create Aperture client with handlers
(defonce aperture-client (aperture/create-client
                          "http://localhost:2175"
                          {:handlers aperture-handlers}))

;; (ws/connect! aperture-client)

;; (ws/register-handler! aperture-client :entity/selected (fn [msg]
;;                                                               (tap> "Selected MUTHER FUCKING entity:")
;;                                                                (tap> msg)))
