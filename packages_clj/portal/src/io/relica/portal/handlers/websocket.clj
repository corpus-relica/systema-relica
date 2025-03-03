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

;; Helper functions

(defn get-environment-id [client-id]
  (tap> @connected-clients)
  (get-in @connected-clients [client-id :environment-id]))

(defn broadcast-to-environment [environment-id message]
  (doseq [[client-id client-data] @connected-clients]
    (when (= environment-id (:environment-id client-data))
      (let [channel (:channel client-data)]
        (http/send! channel (json/generate-string message))))))

;; Message handlers

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
      (let [environment-id (get-environment-id client-id)
            ;; _ (tap> "FOUND ENVIRONMENT ID")
            ;; _ (tap> environment-id)
            ;; _ (tap> @connected-clients)
            result (<! (aperture/select-entity aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "Entity selected"})
      (catch Exception e
        (log/error "Failed to select entity:" e)
        {:error "Failed to select entity"}))))

(defn handle-select-entity-none [{:keys [client-id] :as message}]
  (tap> "SELECT NONE")
  (tap> message)
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            ;; _ (tap> "FOUND ENVIRONMENT ID")
            ;; _ (tap> environment-id)
            ;; _ (tap> @connected-clients)
            result (<! (aperture/select-entity-none aperture-client (:user-id message) environment-id))]
        {:success true
         :message "Entity deselected"})
      (catch Exception e
        (log/error "Failed to deselect entity:" e)
        {:error "Failed to deselect entity"})))
  )

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


(defn handle-clear-environment-entities [{:keys [client-id] :as message}]
  (tap> "CLEARING ENVIRONMENT ENTITIES")
  (tap> message)
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            _ (tap> "FOUND ENVIRONMENT ID")
            _ (tap> environment-id)
            _ (tap> @connected-clients)
            result (<! (aperture/clear-environment-entities aperture-client (:user-id message) environment-id))]
        {:success true
         :message "Environment entities cleared"})
      (catch Exception e
        (log/error "Failed to clear environment entities:" e)
        {:error "Failed to clear environment entities"}))))

(defn handle-load-all-related-facts [{:keys [uid] :as message}]
  (tap> "LOADING ALL RELATED FACTS")
  (tap> uid)
  (tap> message)
  (go
    (try
      (let [environment-id (get-environment-id (:client-id message))
            _ (tap> "FOUND ENVIRONMENT ID")
            _ (tap> environment-id)
            result (<! (aperture/load-all-related-facts aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "All related facts loaded"
         :facts result})
      (catch Exception e
        (log/error "Failed to load all related facts:" e)
        {:error "Failed to load all related facts"}))))

;; Event handlers

(defn handle-entity-selected-event [payload]
  ;; Your logic here with access to all websocket context
  ;; (tap> "ENTITY SELECTED EVENT")
  ;; (tap> payload)
  (let [environment-id (:environment-id payload)]
    (broadcast-to-environment environment-id
                              {:id "system"
                               :type "portal:entitySelected"
                               :payload {
                                         :type (:type payload)
                                         :entity_uid (:entity-uid payload)
                                         :user_id (:user-id payload)
                                         :environment_id (:environment-id payload)
                                         }})))

(defn handle-entity-selected-none-event [payload]
  ;; Your logic here with access to all websocket context
  ;; (tap> "ENTITY SELECTED NONE EVENT")
  ;; (tap> payload)
  (let [environment-id (:environment-id payload)]
    (broadcast-to-environment environment-id
                              {:id "system"
                               :type "portal:entitySelectedNone"
                               :payload {
                                         :type (:type payload)
                                         :user_id (:user-id payload)
                                         :environment_id (:environment-id payload)
                                         }})))

(defn handle-facts-loaded-event [payload]
  ;; Your logic here with access to all websocket context
  (tap> "FACTS LOADED EVENT")
  (tap> payload)
  (let [environment-id (:environment-id payload)]
    (broadcast-to-environment environment-id
                              {:id "system"
                               :type "portal:factsLoaded"
                               :payload {
                                         :type (:type payload)
                                         :facts (:facts payload)
                                         :user_id (:user-id payload)
                                         :environment_id (:environment-id payload)
                                         }})))

(defn handle-facts-unloaded-event [payload]
  ;; Your logic here with access to all websocket context
  (tap> "FACTS UNLOADED EVENT")
  (tap> payload)
  (let [environment-id (:environment-id payload)]
    (broadcast-to-environment environment-id
                              {:id "system"
                               :type "portal:factsUnloaded"
                               :payload {
                                         :type (:type payload)
                                         :fact_uids (:fact-uids payload)
                                         :user_id (:user-id payload)
                                         :environment_id (:environment-id payload)
                                         }})))

(defn handle-load-entity [{:keys [uid client-id] :as message}])

(defn handle-unload-entity [{:keys [uid client-id] :as message}]
  (tap> "UNLOAD ENTITY")
  (tap> uid)
  (tap> message)
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            ;; _ (tap> "FOUND ENVIRONMENT ID")
            ;; _ (tap> environment-id)
            ;; _ (tap> @connected-clients)
            result (<! (aperture/unload-entity aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "Entity unloaded"})
      (catch Exception e
        (log/error "Failed to unload entity:" e)
        {:error "Failed to unload entity"}))))

(defn handle-load-entities [{:keys [uids client-id] :as message}]
  (tap> "LOAD ENTITIES")
  (tap> uids)
  (tap> message)
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            ;; _ (tap> "FOUND ENVIRONMENT ID")
            ;; _ (tap> environment-id)
            ;; _ (tap> @connected-clients)
            result (<! (aperture/load-entities aperture-client (:user-id message) environment-id uids))]
        {:success true
         :message "Entities loaded"})
      (catch Exception e
        (log/error "Failed to load entities:" e)
        {:error "Failed to load entities"}))))

(defn handle-unload-entities [{:keys [uids client-id] :as message}]
  (tap> "UNLOAD ENTITIES")
  (tap> uids)
  (tap> message)
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            ;; _ (tap> "FOUND ENVIRONMENT ID")
            ;; _ (tap> environment-id)
            ;; _ (tap> @connected-clients)
            result (<! (aperture/unload-entities aperture-client (:user-id message) environment-id uids))]
        {:success true
         :message "Entities unloaded"})
      (catch Exception e
        (log/error "Failed to unload entities:" e)
        {:error "Failed to unload entities"}))))

;; Core

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

;; Configuration

(def ws-handlers
  {"auth" handle-auth
   ;; "kinds:get" handle-get-kinds
   ;; "entities:resolve" handle-resolve-uids
   ;; "environment:get" handle-get-environment
   "ping" handle-ping
   "selectEntity" handle-select-entity
   "selectNone" handle-select-entity-none
   "loadSpecializationHierarchy" load-specialization-hierarchy
   "clearEnvironmentEntities"handle-clear-environment-entities
   "loadAllRelatedFacts" handle-load-all-related-facts
   "unloadEntity" handle-unload-entity
   "loadEntities"handle-load-entities
   "unloadEntities"handle-unload-entities
   })

;; Set up event listener

(defonce event-listener
  (let [events-ch (events/subscribe)]
    (go-loop []
      (when-let [event (<! events-ch)]
        (tap> "Received event in websocket handler:")
        (tap> event)
        (case (:type event)
          :facts-loaded (handle-facts-loaded-event (:payload event))
          :facts-unloaded (handle-facts-unloaded-event (:payload event))
          :entity-selected (handle-entity-selected-event (:payload event))
          :entity-selected-none (handle-entity-selected-none-event (:payload event))
          ;; other event types
          (tap> "Unknown event type:" (:type event)))
        (recur)))))
