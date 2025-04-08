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
            [io.relica.portal.auth.jwt :refer [validate-jwt]]
            [io.relica.common.io.aperture-client :as aperture]
            [io.relica.common.io.nous-client :as nous]
            [io.relica.portal.io.client-instances :refer [aperture-client nous-client]]
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
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            result (<! (aperture/select-entity aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "Entity selected"})
      (catch Exception e
        (log/error "Failed to select entity:" e)
        {:error "Failed to select entity"}))))

(defn handle-select-entity-none [{:keys [client-id] :as message}]
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
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            ;; _ (tap> "FOUND ENVIRONMENT ID")
            ;; _ (tap> environment-id)
            ;; _ (tap> @connected-clients)
            result (<! (aperture/clear-environment-entities aperture-client (:user-id message) environment-id))]
        {:success true
         :message "Environment entities cleared"})
      (catch Exception e
        (log/error "Failed to clear environment entities:" e)
        {:error "Failed to clear environment entities"}))))

(defn handle-load-all-related-facts [{:keys [uid] :as message}]
  (go
    (try
      (let [environment-id (get-environment-id (:client-id message))
            result (<! (aperture/load-all-related-facts aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "All related facts loaded"
         :facts result})
      (catch Exception e
        (log/error "Failed to load all related facts:" e)
        {:error "Failed to load all related facts"}))))

(defn handle-load-entity [{:keys [uid client-id] :as message}])

(defn handle-unload-entity [{:keys [uid client-id] :as message}]
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            result (<! (aperture/unload-entity aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "Entity unloaded"})
      (catch Exception e
        (log/error "Failed to unload entity:" e)
        {:error "Failed to unload entity"}))))

(defn handle-load-entities [{:keys [uids client-id] :as message}]
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            result (<! (aperture/load-entities aperture-client (:user-id message) environment-id uids))]
        {:success true
         :message "Entities loaded"})
      (catch Exception e
        (log/error "Failed to load entities:" e)
        {:error "Failed to load entities"}))))

(defn handle-unload-entities [{:keys [uids client-id] :as message}]
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            result (<! (aperture/unload-entities aperture-client (:user-id message) environment-id uids))]
        {:success true
         :message "Entities unloaded"})
      (catch Exception e
        (log/error "Failed to unload entities:" e)
        {:error "Failed to unload entities"}))))

(defn handle-load-subtypes-cone [{:keys [uid client-id] :as message}]
  (tap> "LOAD SUBTYPES CONE")
  (tap> uid)
  (tap> message)
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            result (<! (aperture/load-subtypes-cone aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "Subtypes cone loaded"
         :subtypes result})
      (catch Exception e
        (log/error "Failed to load subtypes cone:" e)
        {:error "Failed to load subtypes cone"}))))

(defn handle-unload-subtypes-cone [{:keys [uid client-id] :as message}]
  (tap> "UNLOAD SUBTYPES CONE")
  (tap> uid)
  (tap> message)
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            ;; Now we have a dedicated function for unloading subtypes cone in aperture
            result (<! (aperture/unload-subtypes-cone aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "Subtypes cone unloaded"})
      (catch Exception e
        (log/error "Failed to unload subtypes cone:" e)
        {:error "Failed to unload subtypes cone"}))))

(defn handle-chat-user-input [{:keys [client-id message user-id]}]
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            _ (print "CHAT USER INPUT")
            _ (print message)
            _ (print user-id)
            _ (print client-id)
            _ (print environment-id)
            result (<! (nous/user-input nous-client user-id environment-id message))]
        {:success true
         :message "Chat user input processed"
         :response result})
      (catch Exception e
        (log/error "Failed to process chat user input:" e)
        {:error "Failed to process chat user input"}))))

(defn handle-load-composition [{:keys [uid client-id] :as message}]
      (println "LOAD COMPOSITION" message)
  (go
    (try
      (println "LOAD COMPOSITION" message)
      (let [environment-id (get-environment-id client-id)
            _ (println "ENVIRONMENT ID" environment-id uid message client-id)
            result (<! (aperture/load-composition aperture-client (:user-id message) environment-id uid))
            ]
        {:success true
         :message "Composition loaded"
         :composition {:foo "bar"}});;result})
      (catch Exception e
        (println "Failed to load composition:" e)
        {:error "Failed to load composition"})))
  )

(defn handle-load-composition-in [{:keys [uid client-id] :as message}]
      (println "LOAD COMPOSITION IN" message)
  (go
    (try
      (println "LOAD COMPOSITION IN" message)
      (let [environment-id (get-environment-id client-id)
            _ (println "ENVIRONMENT ID" environment-id uid message client-id)
            result (<! (aperture/load-composition-in aperture-client (:user-id message) environment-id uid))
            ]
        {:success true
         :message "Composition In loaded"
         :composition {:foo "bar"}});;result})
      (catch Exception e
        (println "Failed to load composition:" e)
        {:error "Failed to load composition"})))
  )

(defn handle-load-connections [{:keys [uid client-id] :as message}]
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            result (<! (aperture/load-connections aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "Connections loaded"
         :connections result})
      (catch Exception e
        (log/error "Failed to load connections:" e)
        {:error "Failed to load connections"}))))

(defn handle-load-connections-in [{:keys [uid client-id] :as message}]
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            result (<! (aperture/load-connections-in aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "Connections loaded"
         :connections result})
      (catch Exception e
        (log/error "Failed to load connections:" e)
        {:error "Failed to load connections"}))))

;; Event handlers

(defn handle-entity-selected-event [payload]
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

(defn handle-final-answer-event [payload]
  (let [environment-id (:environment-id payload)]
    (println "FINAL ANSWER EVENT")
    (println payload)
    (broadcast-to-environment 1 ;;environment-id
                              {:id "system"
                               :type "portal:finalAnswer"
                               :payload {
                                         :type (:type payload)
                                         :answer (:payload payload)
                                         :user_id 7
                                         :environment_id 1
                                         }})))

;; Core

(defn handle-ping [_]
  (go
    {:success true
     :message "Pong"}))

(defn handle-ws-message [channel data]
  ;; (tap> "HANDLING MESSAGE !")
  ;; (tap> data)
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
              ;; (tap> "SENDING RESPONSE !!!!!!!!!!!!!!!!!!!!!!!!!!11")
              ;; (tap> response)
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
   "loadEntities" handle-load-entities
   "unloadEntities" handle-unload-entities
   "loadSubtypesCone" handle-load-subtypes-cone
   "unloadSubtypesCone" handle-unload-subtypes-cone
   ;;----
   "loadComposition" handle-load-composition
   "loadCompositionIn" handle-load-composition-in
   "loadConnections" handle-load-connections
   "loadConnectionsIn" handle-load-connections-in

   "chatUserInput" handle-chat-user-input

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
          :final-answer (handle-final-answer-event (:payload event))
          ;; finally
          (tap> "Unknown event type:" (:type event)))
        (recur)))))
