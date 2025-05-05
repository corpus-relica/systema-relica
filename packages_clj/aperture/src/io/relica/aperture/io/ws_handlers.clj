(ns io.relica.aperture.io.ws-handlers
  (:require [clojure.tools.logging :as log]
            [io.relica.common.websocket.server :as common-ws]
            [io.relica.aperture.io.ws-server :as ws]
            [io.relica.aperture.config :refer [get-default-environment]]
            [io.relica.aperture.services.environment-service :as env-service]
            [clojure.core.async :refer [go <!]]))

;; The environment service will be injected when registering the handlers
(defonce environment-service (atom nil))

;; Function to set the environment service
(defn set-environment-service! [service]
  (reset! environment-service service))

;; Environment Message Handlers
(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/get
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (go
      (println "FUGGING GETTING ENVIRONMENT")
      (println ?data)
      (println (type (:user-id ?data)))
      (let [result (<! (env-service/get-environment @environment-service
                                                  (:user-id ?data)
                                                  (:environment-id ?data)))]
        (println "RESULT")
        ;; (println result)
        (?reply-fn result)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/list
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (go
      (let [result (<! (env-service/list-environments @environment-service (:user-id ?data)))]
        (?reply-fn result)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/create
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (go
      (let [result (<! (env-service/create-environment @environment-service
                                                     (:user-id ?data)
                                                     (:name ?data)))]
        (?reply-fn result)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/text-search-load
  [{:keys [?data ?reply-fn] :as msg}]
  (println "TEXT SEARCH LOAD -- **************************************")
  (println ?data)
  (go
    (let [result (<! (env-service/text-search-load @environment-service
                                                 (:user-id ?data)
                                                 (:term ?data)))]
      (?reply-fn {:environment (:environment result)
                  :facts (:facts result)})
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
          
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-specialization-fact
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/load-specialization-fact
                      @environment-service
                      (:user-id ?data)
                      (:environment-id ?data)
                      (:uid ?data)))]
                      
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (or (:environment-id ?data)
                             (:id (get-default-environment (:user-id ?data))))}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-specialization
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/load-specialization-hierarchy
                      @environment-service
                      (:user-id ?data)
                      (:uid ?data)
                      (:environment-id ?data)))]
      (?reply-fn (:environment result))
      (println "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
      (println result)
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (or (:environment-id ?data)
                             (:id (get-default-environment (:user-id ?data))))}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-all-related-facts
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/load-all-related-facts
                      @environment-service
                      (:user-id ?data)
                      (:entity-uid ?data)
                      (:environment-id ?data)))]
      (?reply-fn result)
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-entity
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/load-entity
                      @environment-service
                      (:user-id ?data)
                      (:entity-uid ?data)
                      (:environment-id ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (or (:environment-id ?data)
                             (:id (get-default-environment (:user-id ?data))))}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/unload-entity
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/unload-entity
                      @environment-service
                      (:user-id ?data)
                      (:entity-uid ?data)
                      (:environment-id ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/unloaded
          :fact-uids (:fact-uids-removed result)
          :model-uids (:model-uids-removed result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-entities
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/load-entities
                      @environment-service
                      (:user-id ?data)
                      (:environment-id ?data)
                      (:entity-uids ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/unload-entities
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/unload-entities
                      @environment-service
                      (:user-id ?data)
                      (:environment-id ?data)
                      (:entity-uids ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/unloaded
          :fact-uids (:fact-uids-removed result)
          :model-uids (:model-uids-removed result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-subtypes
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/load-subtypes
                      @environment-service
                      (:user-id ?data)
                      (:environment-id ?data)
                      (:entity-uid ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-subtypes-cone
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/load-subtypes-cone
                      @environment-service
                      (:user-id ?data)
                      (:environment-id ?data)
                      (:entity-uid ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/unload-subtypes-cone
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (println "UNLOADING SUBTYPES CONE")
    (let [result (<! (env-service/unload-subtypes-cone
                      @environment-service
                      (:user-id ?data)
                      (:environment-id ?data)
                      (:entity-uid ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/unloaded
          :fact-uids (:fact-uids-removed result)
          :model-uids (:model-uids-removed result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-classified
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/load-classified
                      @environment-service
                      (:user-id ?data)
                      (:environment-id ?data)
                      (:entity-uid ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-classification-fact
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/load-classification-fact
                      @environment-service
                      (:user-id ?data)
                      (:environment-id ?data)
                      (:entity-uid ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-composition
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (println "LOADING COMPOSITION")
    (let [result (<! (env-service/load-composition
                      @environment-service
                      (:user-id ?data)
                      (:environment-id ?data)
                      (:entity-uid ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-composition-in
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (println "LOADING COMPOSITION IN")
    (let [result (<! (env-service/load-composition-in
                      @environment-service
                      (:user-id ?data)
                      (:environment-id ?data)
                      (:entity-uid ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-connections
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/load-connections
                      @environment-service
                      (:user-id ?data)
                      (:environment-id ?data)
                      (:entity-uid ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-connections-in
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (let [result (<! (env-service/load-connections-in
                      @environment-service
                      (:user-id ?data)
                      (:environment-id ?data)
                      (:entity-uid ?data)))]
      (?reply-fn (:environment result))
      (when (:success result)
        (ws/broadcast!
         {:type :facts/loaded
          :facts (:facts result)
          :user-id (:user-id ?data)
          :environment-id (:environment-id ?data)}
         10)))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/clear-entities
  [{:keys [?data ?reply-fn] :as msg}]
  (tap> (str "Handling environment/clear-entities"))
  (tap> ?data)
  (when ?reply-fn
    (tap> (str "Clearing entities for user:" (:user-id ?data)))
    (go
      (let [result (<! (env-service/clear-entities
                        @environment-service
                        (:user-id ?data)
                        (:environment-id ?data)))]
        (?reply-fn (if (:success result) {:success true} {:error "Failed to clear entities"}))
        (when (:success result)
          (ws/broadcast!
           {:type :facts/unloaded
            :fact-uids (:fact-uids-removed result)
            :user-id (:user-id ?data)
            :environment-id (or (:environment-id ?data)
                               (:id (get-default-environment (:user-id ?data))))}
           10))))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :entity/select
  [{:keys [?data ?reply-fn] :as msg}]
  (tap> (str "Handling entity/select"))
  (tap> ?data)
  (when ?reply-fn
    (println (str "selecting entity " (:entity-uid ?data) " for user:" (:user-id ?data)))
    (go
      (let [result (<! (env-service/select-entity
                        @environment-service
                        (:user-id ?data)
                        (:environment-id ?data)
                        (:entity-uid ?data)))]
        (?reply-fn (if (:success result)
                    {:success true :selected-entity (:entity-uid ?data)}
                    {:error "Failed to select entity"}))
        (when (:success result)
          (println "%%%%%%%%%%%%%%%%%%%%% BROADCASTING ENTITY SELECTION %%%%%%%%%%%%%%%%%%%%%%")
          (ws/broadcast!
           {:type :entity/selected
            :entity-uid (:entity-uid ?data)
            :user-id (:user-id ?data)
            :environment-id (or (:environment-id ?data)
                               (:id (get-default-environment (:user-id ?data))))}
           10))))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :entity/select-none
  [{:keys [?data ?reply-fn] :as msg}]
  (tap> (str "Handling entity/select-none"))
  (tap> ?data)
  (when ?reply-fn
    (tap> (str "deselecting entity for user:" (:user-id ?data)))
    (go
      (let [result (<! (env-service/deselect-entity
                        @environment-service
                        (:user-id ?data)
                        (:environment-id ?data)))]
        (?reply-fn (if (:success result) {:success true} {:error "Failed to deselect entity"}))
        (when (:success result)
          (tap> "%%%%%%%%%%%%%%%%%%%%% BROADCASTING ENTITY DESELECTION %%%%%%%%%%%%%%%%%%%%%%")
          (ws/broadcast!
           {:type :entity/selected-none
            :user-id (:user-id ?data)
            :environment-id (or (:environment-id ?data)
                               (:id (get-default-environment (:user-id ?data))))}
           10))))))
