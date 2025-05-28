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
            [io.relica.common.io.prism-client :as prism]
            [io.relica.portal.io.client-instances :refer [aperture-client nous-client prism-client]]
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

(defn handle-guest-auth [_]
  (go
    (let [socket-token (generate-socket-token)
          guest-id "guest-user"]
      (swap! socket-tokens assoc socket-token
             {:user-id guest-id
              :created-at (System/currentTimeMillis)
              :is-guest true})
      {:success true
       :token socket-token
       :user-id guest-id})))

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
        {:error "Failed to deselect entity"}))))


(defn load-specialization-hierarchy [{:keys [uid] :as message}]
  (go
    (try
      (let [response (<! (aperture/load-specialization-hierarchy aperture-client (:user-id message) uid))]
        {:success true
         :message "Specialization hierarchy loaded"
         :environment response})
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
            response (<! (aperture/load-all-related-facts aperture-client (:user-id message) environment-id uid))
            result (get-in response [:data])]
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
            response (<! (aperture/unload-entity aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "Entity unloaded"})
      (catch Exception e
        (log/error "Failed to unload entity:" e)
        {:error "Failed to unload entity"}))))

(defn handle-load-entities [{:keys [uids client-id] :as message}]
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            response (<! (aperture/load-entities aperture-client (:user-id message) environment-id uids))]
        {:success true
         :message "Entities loaded"})
      (catch Exception e
        (log/error "Failed to load entities:" e)
        {:error "Failed to load entities"}))))

(defn handle-unload-entities [{:keys [uids client-id] :as message}]
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            response (<! (aperture/unload-entities aperture-client (:user-id message) environment-id uids))]
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
            response (<! (aperture/load-subtypes-cone aperture-client (:user-id message) environment-id uid))
            result (get-in response [:data])]
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
            _ (println "CHAT USER INPUT")
            _ (println message)
            _ (println user-id)
            _ (println client-id)
            _ (println environment-id)
            response (<! (nous/user-input nous-client user-id environment-id message))
            _ (println "CHAT USER INPUT RESPONSE")
            _ (println response)
            result (get-in response [:data])]
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
            response (<! (aperture/load-composition aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "Composition loaded"
         :composition (or (get-in response [:data]) {:foo "bar"})})
      (catch Exception e
        (println "Failed to load composition:" e)
        {:error "Failed to load composition"}))))


(defn handle-load-composition-in [{:keys [uid client-id] :as message}]
  (println "LOAD COMPOSITION IN" message)
  (go
    (try
      (println "LOAD COMPOSITION IN" message)
      (let [environment-id (get-environment-id client-id)
            _ (println "ENVIRONMENT ID" environment-id uid message client-id)
            response (<! (aperture/load-composition-in aperture-client (:user-id message) environment-id uid))]
        {:success true
         :message "Composition In loaded"
         :composition (or (get-in response [:data]) {:foo "bar"})})
      (catch Exception e
        (println "Failed to load composition:" e)
        {:error "Failed to load composition"}))))


(defn handle-load-connections [{:keys [uid client-id] :as message}]
  (go
    (try
      (let [environment-id (get-environment-id client-id)
            response (<! (aperture/load-connections aperture-client (:user-id message) environment-id uid))
            result (get-in response [:data])]
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
            response (<! (aperture/load-connections-in aperture-client (:user-id message) environment-id uid))
            result (get-in response [:data])]
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
                               :payload {:type (:type payload)
                                         :entity_uid (:entity-uid payload)
                                         :user_id (:user-id payload)
                                         :environment_id (:environment-id payload)}})))


(defn handle-entity-selected-none-event [payload]
  (let [environment-id (:environment-id payload)]
    (broadcast-to-environment environment-id
                              {:id "system"
                               :type "portal:entitySelectedNone"
                               :payload {:type (:type payload)
                                         :user_id (:user-id payload)
                                         :environment_id (:environment-id payload)}})))


(defn handle-facts-loaded-event [payload]
  (let [environment-id (:environment-id payload)]
    (broadcast-to-environment environment-id
                              {:id "system"
                               :type "portal:factsLoaded"
                               :payload {:type (:type payload)
                                         :facts (:facts payload)
                                         :user_id (:user-id payload)
                                         :environment_id (:environment-id payload)}})))


(defn handle-facts-unloaded-event [payload]
  (let [environment-id (:environment-id payload)]
    (broadcast-to-environment environment-id
                              {:id "system"
                               :type "portal:factsUnloaded"
                               :payload {:type (:type payload)
                                         :fact_uids (:fact-uids payload)
                                         :user_id (:user-id payload)
                                         :environment_id (:environment-id payload)}})))


(defn handle-final-answer-event [payload]
  (let [environment-id (:environment-id payload)]
    (println "FINAL ANSWER EVENT")
    (println payload)
    (broadcast-to-environment 1 ;;environment-id
                              {:id "system"
                               :type "portal:finalAnswer"
                               :payload {:type (:type payload)
                                         :answer (:payload payload)
                                         :user_id 7
                                         :environment_id 1}})))


;; Prism setup handlers

(defn handle-prism-setup-update-event [payload]
  (broadcast-to-environment nil
                            {:id "system"
                             :type "portal:prismSetupUpdate"
                             :payload payload}))

;; (defn handle-prism-setup-status [_]
;;   (go
;;     (try
;;       (let [result (<! (prism/get-setup-status prism-client))]
;;         {:success true
;;          :status result})
;;       (catch Exception e
;;         (log/error "Error getting Prism setup status:" e)
;;         {:success false
;;          :error (.getMessage e)}))))

(defn handle-prism-start-setup [_]
  (go
    (try
      (let [response (<! (prism/start-setup prism-client))]
        {:success true
         :result (get-in response [:data])})
      (catch Exception e
        (log/error "Error starting Prism setup:" e)
        {:success false
         :error (.getMessage e)}))))

(defn handle-prism-create-user [{:keys [username password confirmPassword]}]
  (go
    (try
      (let [response (<! (prism/create-admin-user prism-client username password confirmPassword))]
        {:success true
         :result (get-in response [:data])})
      (catch Exception e
        (log/error "Error creating Prism admin user:" e)
        {:success false
         :error (.getMessage e)}))))

(defn handle-prism-process-stage [_]
  (go
    (try
      (let [response (<! (prism/process-setup-stage prism-client))]
        {:success true
         :result (get-in response [:data])})
      (catch Exception e
        (log/error "Error processing Prism setup stage:" e)
        {:success false
         :error (.getMessage e)}))))

;; Cache rebuild handlers

(defn handle-cache-rebuild [{:keys [cache-types]}]
  (go
    (try
      (let [response (<! (prism/rebuild-cache prism-client cache-types))]
        {:success true
         :message "Cache rebuild initiated"})
      (catch Exception e
        (log/error "Error initiating cache rebuild:" e)
        {:success false
         :error (.getMessage e)}))))

(defn handle-cache-rebuild-cancel [_]
  (go
    (try
      (let [response (<! (prism/cancel-cache-rebuild prism-client))]
        {:success true
         :message "Cache rebuild cancelled"})
      (catch Exception e
        (log/error "Error cancelling cache rebuild:" e)
        {:success false
         :error (.getMessage e)}))))

;; Cache rebuild event handlers

(defn handle-cache-rebuild-start-event [payload]
  (broadcast-to-environment 1;nil
                            {:id "system"
                             :type ":prism.cache/rebuild-start"
                             :payload payload}))

(defn handle-cache-rebuild-progress-event [payload]
  (print "RICKKY TICKY TAVY !!!!!!!!!!!!!!!!!!!!!!!!111 ")
  (broadcast-to-environment 1;nil
                            {:id "system"
                             :type ":prism.cache/rebuild-progress"
                             :payload payload}))

(defn handle-cache-rebuild-complete-event [payload]
  (broadcast-to-environment 1;nil
                            {:id "system"
                             :type ":prism.cache/rebuild-complete"
                             :payload payload}))

(defn handle-cache-rebuild-error-event [payload]
  (broadcast-to-environment 1;nil
                            {:id "system"
                             :type ":prism.cache/rebuild-error"
                             :payload payload}))

;; Core

(defn handle-ping [_]
  (go
    {:success true
     :message "Pong"}))

;; Error codes for WebSocket responses (aligned with Archivist)
(def error-codes
  {;; System errors (1001-1099)
   :service-unavailable            1001
   :internal-error                 1002
   :timeout                        1003
   :service-overloaded             1004

   ;; Validation errors (1101-1199)
   :validation-error               1101
   :missing-required-field         1102
   :invalid-field-format           1103
   :invalid-reference              1104
   :constraint-violation           1105

   ;; Authorization errors
   :unauthorized                   1301
   :forbidden                      1302

   ;; Generic errors
   :not-found                      1401
   :bad-request                    1402
   :unknown-message-type           1403
   :invalid-message-format         1404})


(defn create-response
  "Create a standardized WebSocket response"
  ([id success data]
   (create-response id success data nil))
  ([id success data request-id]
   (if success
     {:id id
      :type "response"
      :success true
      :request_id request-id
      :data data}
     (let [error-type (if (map? data) (:type data) :internal-error)
           error-msg (if (map? data) (:message data) (str data))
           error-details (if (map? data) (:details data) nil)
           error-code (get error-codes (keyword error-type) 1002)]
       {:id id
        :type "response"
        :success false
        :request_id request-id
        :error {:code error-code
                :type (name (or error-type :internal-error))
                :message error-msg
                :details error-details}}))))

(defn handle-ws-message [channel data]
  ;; (tap> "HANDLING MESSAGE !")
  ;; (tap> data)
  (try
    (let [message (json/parse-string data true)
          {:keys [id user-id type payload]} message
          handler (get ws-handlers type)
          request-id (get message :request_id)]
      (tap> message)
      (if handler
        (go
          (try
            (let [result (<! (handler payload))
                  ;; Check for error in new standardized format or old format
                  success (if (map? result)
                            (if (contains? result :error)
                              false
                              (if (map? (:error result))
                                false
                                true))
                            true)
                  response (create-response id success result request-id)]
              ;; (tap> "SENDING RESPONSE !!!!!!!!!!!!!!!!!!!!!!!!!!11")
              ;; (tap> response)
              (http/send! channel (json/generate-string response)))
            (catch Exception e
              (log/error "Error processing message:" e)
              (let [error-response (create-response id false
                                                    {:type :internal-error
                                                     :message (.getMessage e)
                                                     :details {:exception (str e)}}
                                                    request-id)]
                (http/send! channel (json/generate-string error-response))))))
        (do
          (log/warn "No handler found for message type:" type)
          (let [error-response (create-response id false
                                                {:type :unknown-message-type
                                                 :message (str "Unknown message type: " type)}
                                                request-id)]
            (http/send! channel (json/generate-string error-response))))))
    (catch Exception e
      (log/error "Error parsing message:" e)
      (let [error-response (create-response nil false
                                            {:type :invalid-message-format
                                             :message "Invalid message format"
                                             :details {:exception (str e)}}
                                            nil)]
        (http/send! channel (json/generate-string error-response))))))

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
   "clearEnvironmentEntities" handle-clear-environment-entities
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

   ;; Prism setup handlers
   ;; "prism/setupStatus" handle-prism-setup-status
   "prism/startSetup" handle-prism-start-setup
   "prism/createUser" handle-prism-create-user
   "prism/processStage" handle-prism-process-stage
   "setup/update" handle-prism-setup-update-event

   ;; Cache rebuild handlers
   ":prism.cache/rebuild" handle-cache-rebuild
   ":prism.cache/rebuild-cancel" handle-cache-rebuild-cancel})


;; Set up event listener

(defonce event-listener
  (let [events-ch (events/subscribe)]
    (go-loop []
      (when-let [event (<! events-ch)]
        (tap> {:message "Received event in websocket handler:"})
        (tap> event)
        (case (:type event)
          :aperture.facts/loaded (handle-facts-loaded-event (:payload event))
          :aperture.facts/unloaded (handle-facts-unloaded-event (:payload event))
          :aperture.entity/selected (handle-entity-selected-event (:payload event))
          :aperture.entity/deselected (handle-entity-selected-none-event (:payload event))
          :nous.chat/final-answer (handle-final-answer-event (:payload event))
          :prism.setup/updated (handle-prism-setup-update-event (:payload event))
          ;; Cache rebuild events
          :prism.cache/rebuild-start (handle-cache-rebuild-start-event (:payload event))
          :prism.cache/rebuild-progress (handle-cache-rebuild-progress-event (:payload event))
          :prism.cache/rebuild-complete (handle-cache-rebuild-complete-event (:payload event))
          :prism.cache/rebuild-error (handle-cache-rebuild-error-event (:payload event))
          ;; Connection events
          :nous/connected (tap> {:message "Nous connected event received"})
          :nous/disconnected (tap> {:message "Nous disconnected event received"})
          :nous/message-received (tap> {:message "Nous message received event"})
          :prism/connected (tap> {:message "Prism connected event received"})
          :prism/disconnected (tap> {:message "Prism disconnected event received"})
          ;; finally
          (tap> {:message "Unknown event type" :type (:type event)}))
        (recur)))))
