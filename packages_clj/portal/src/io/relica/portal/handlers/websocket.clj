(ns io.relica.portal.handlers.websocket
  (:require [org.httpkit.server :as http]
            [cheshire.core :as json]
            [clojure.core.async :refer [go go-loop <!]]
            [clojure.tools.logging :as log]
            [io.relica.portal.auth.websocket
             :as ws-auth
             :refer [generate-socket-token
                     socket-tokens
                     connected-clients]]
            [io.relica.portal.handlers.core :as handlers]
            [io.relica.portal.auth.jwt :refer [validate-jwt]]
            [io.relica.common.io.aperture-client :as aperture]
            [io.relica.portal.io.client-instances :refer [aperture-client]]
            [io.relica.common.events.core :as events]))

(declare ws-handlers)

(defn handle-auth [{:keys [jwt]}]
  (go
    (if-let [user-id (validate-jwt jwt)]
      (let [socket-token (generate-socket-token)]
        (swap! socket-tokens assoc socket-token
               {:user-id user-id
                :created-at (System/currentTimeMillis)})
        {:success true
         :token socket-token
         :user-id user-id})
      {:error "Invalid JWT"})))

(defn handle-select-entity [{:keys [uid client-id] :as message}]
  (tap> "SELECT ENTITY")
  (tap> uid)
  (tap> message)
  (go
    (try
      (let [environment-id (get-in @connected-clients [client-id :environment-id])
            _ (tap> "FOUND ENVIRONMENT ID")
            _ (tap> environment-id)
            _ (tap> @connected-clients)
            result (<! (aperture/select-entity aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "Entity selected"})
      (catch Exception e
        (log/error "Failed to select entity:" e)
        {:error "Failed to select entity"}))))

(defn handle-entity-selected-event [payload]
  ;; Your logic here with access to all websocket context
  (tap> "ENTITY SELECTED EVENT")
  (tap> payload)
  (let [environment-id (:environment-id payload)]
    (tap> (str "Looking for clients connected to environment-id: " environment-id))
    (doseq [[client-id client-data] @connected-clients]
      (when (= environment-id (:environment-id client-data))
        (tap> (str "Found client " client-id " connected to environment " environment-id))
        (let [channel (:channel client-data)
              message {:id "system"
                       :type "portal:entitySelected"
                       :payload {
                                 :type (:type payload)
                                 :entity_uid (:entity-uid payload)
                                 :user_id (:user-id payload)
                                 :environment_id (:environment-id payload)
                                 }}]
          (tap> "Sending entity selected event to client")
          (tap> message)
          (http/send! channel (json/generate-string message)))))))

(defn load-specialization-hierarchy [{:keys [uid] :as message}]
  (tap> "LOADING SPECIALIZATION HIERARCHY")
  (tap> uid)
  (tap> message)
  (go
    (try
      (let [result (<! (aperture/load-specialization-hierarchy aperture-client (:user-id message) uid))]
        {:success true
         :message "Specialization hierarchy loaded"
         :hierarchy result})
      (catch Exception e
        (log/error "Failed to load specialization hierarchy:" e)
        {:error "Failed to load specialization hierarchy"}))))

(defn handle-ping [_]
  (tap> "PING")
  (go
    {:success true
     :message "Pong"}))

(defn handle-ws-message [channel data]
  (tap> "HANDLING MESSAGE !")
  (tap> data)
  (try
    (let [message (json/parse-string data true)
          {:keys [id user-id type payload]} message
          handler (get ws-handlers type)]
      (tap> message)
      (if handler
        (go
          (try
            (let [result (<! (handler payload))
                  response {:id id
                            :type "response"
                            :payload result}]
              (tap> "SENDING RESPONSE !!!!!!!!!!!!!!!!!!!!!!!!!!11")
              (tap> response)
              (http/send! channel (json/generate-string response)))
            (catch Exception e
              (log/error "Error processing message:" e)
              (http/send! channel (json/generate-string
                                   {:id id
                                    :type "error"
                                    :error (.getMessage e)})))))
        (do
          (log/warn "No handler found for message type:" type)
          (http/send! channel (json/generate-string
                               {:id id
                                :type "error"
                                :error (str "Unknown message type: " type)})))))
    (catch Exception e
      (log/error "Error parsing message:" e)
      (http/send! channel (json/generate-string
                           {:type "error"
                            :error "Invalid message format"})))))


(def ws-handlers
  {"auth" handle-auth
   ;; "kinds:get" handle-get-kinds
   ;; "entities:resolve" handle-resolve-uids
   ;; "environment:get" handle-get-environment
   "ping" handle-ping
   "selectEntity" handle-select-entity
   "loadSpecializationHierarchy" load-specialization-hierarchy})

;; Set up event listener
(defonce event-listener
  (let [events-ch (events/subscribe)]
    (go-loop []
      (when-let [event (<! events-ch)]
        (tap> "Received event in websocket handler:")
        (tap> event)
        (case (:type event)
          :entity-selected (handle-entity-selected-event (:payload event))
          ;; other event types
          (tap> "Unknown event type:" (:type event)))
        (recur)))))
