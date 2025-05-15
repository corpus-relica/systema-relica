(ns io.relica.aperture.io.ws-handlers
  (:require [clojure.tools.logging :as log]
            [io.relica.common.websocket.server :as common-ws]
            [io.relica.aperture.io.ws-server :as ws]
            [io.relica.aperture.config :refer [get-default-environment]]
            [io.relica.aperture.core.environment :as env]
            [clojure.core.async :refer [go <!]]
            [io.relica.common.utils.response :as response]))


;; Environment Message Handlers
(response/def-ws-handler :environment/get
  (let [result (<! (env/get-environment (:user-id ?data) (:environment-id ?data)))]
    (if (:success result)
      (respond-success (:environment result))
      (respond-error :resource-not-found
                     (or (:error result) "Environment not found"))))
  (catch Exception e
    (log/error e "Failed to get environment")
    (respond-error :database-error
                   "Failed to get environment"
                   {:exception (str e)})))

(response/def-ws-handler :environment/list
  (let [result (<! (env/list-environments (:user-id ?data)))]
    (if (:success result)
      (respond-success (:environments result))
      (respond-error :database-error
                     (or (:error result) "Failed to list environments"))))
  (catch Exception e
    (log/error e "Failed to list environments")
    (respond-error :database-error
                   "Failed to list environments"
                   {:exception (str e)})))

(response/def-ws-handler :environment/create
  (let [result (<! (env/create-environment (:user-id ?data) (:name ?data)))]
    (if (:success result)
      (respond-success (:environment result))
      (respond-error :database-error
                     (or (:error result) "Failed to create environment"))))
  (catch Exception e
    (log/error e "Failed to create environment")
    (respond-error :database-error
                   "Failed to create environment"
                   {:exception (str e)})))

(response/def-ws-handler :environment/text-search-load
  (let [result (<! (env/text-search-load (:user-id ?data) (:term ?data)))]
    (respond-success {:environment (:environment result)
                      :facts (:facts result)})
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to load text search results")
    (respond-error :database-error
                   "Failed to load text search results"
                   {:exception (str e)})))

(response/def-ws-handler :environment/uid-search-load
  (let [result (<! (env/uid-search-load (:user-id ?data) (:uid ?data)))]
    (respond-success {:environment (:environment result)
                      :facts (:facts result)})
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to load UID search results")
    (respond-error :database-error
                   "Failed to load UID search results"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-specialization-fact
  (let [result (<! (env/load-specialization-fact
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:uid ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (or (:environment-id ?data)
                            (:id (get-default-environment (:user-id ?data))))}
       10)))
  (catch Exception e
    (log/error e "Failed to load specialization fact")
    (respond-error :database-error
                   "Failed to load specialization fact"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-specialization
  (let [result (<! (env/load-specialization-hierarchy
                    (:user-id ?data)
                    (:uid ?data)
                    (:environment-id ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (or (:environment-id ?data)
                            (:id (get-default-environment (:user-id ?data))))}
       10)))
  (catch Exception e
    (log/error e "Failed to load specialization hierarchy")
    (respond-error :database-error
                   "Failed to load specialization hierarchy"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-all-related-facts
  (let [result (<! (env/load-all-related-facts
                    (:user-id ?data)
                    (:entity-uid ?data)
                    (:environment-id ?data)))]
    (respond-success result)
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to load all related facts")
    (respond-error :database-error
                   "Failed to load all related facts"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-entity
  (let [result (<! (env/load-entity
                    (:user-id ?data)
                    (:entity-uid ?data)
                    (:environment-id ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (or (:environment-id ?data)
                            (:id (get-default-environment (:user-id ?data))))}
       10)))
  (catch Exception e
    (log/error e "Failed to load entity")
    (respond-error :database-error
                   "Failed to load entity"
                   {:exception (str e)})))

(response/def-ws-handler :environment/unload-entity
  (let [result (<! (env/unload-entity
                    (:user-id ?data)
                    (:entity-uid ?data)
                    (:environment-id ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/unloaded
        :fact-uids (:fact-uids-removed result)
        :model-uids (:model-uids-removed result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to unload entity")
    (respond-error :database-error
                   "Failed to unload entity"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-entities
  (let [result (<! (env/load-entities
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:entity-uids ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to load entities")
    (respond-error :database-error
                   "Failed to load entities"
                   {:exception (str e)})))

(response/def-ws-handler :environment/unload-entities
  (let [result (<! (env/unload-entities
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:entity-uids ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/unloaded
        :fact-uids (:fact-uids-removed result)
        :model-uids (:model-uids-removed result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to unload entities")
    (respond-error :database-error
                   "Failed to unload entities"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-subtypes
  (let [result (<! (env/load-subtypes
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:entity-uid ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to load subtypes")
    (respond-error :database-error
                   "Failed to load subtypes"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-subtypes-cone
  (let [result (<! (env/load-subtypes-cone
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:entity-uid ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to load subtypes cone")
    (respond-error :database-error
                   "Failed to load subtypes cone"
                   {:exception (str e)})))

(response/def-ws-handler :environment/unload-subtypes-cone
  (let [result (<! (env/unload-subtypes-cone
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:entity-uid ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/unloaded
        :fact-uids (:fact-uids-removed result)
        :model-uids (:model-uids-removed result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to unload subtypes cone")
    (respond-error :database-error
                   "Failed to unload subtypes cone"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-classified
  (let [result (<! (env/load-classified
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:entity-uid ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to load classified")
    (respond-error :database-error
                   "Failed to load classified"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-classification-fact
  (let [result (<! (env/load-classification-fact
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:entity-uid ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to load classification fact")
    (respond-error :database-error
                   "Failed to load classification fact"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-composition
  (let [result (<! (env/load-composition
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:entity-uid ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to load composition")
    (respond-error :database-error
                   "Failed to load composition"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-composition-in
  (let [result (<! (env/load-composition-in
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:entity-uid ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to load composition-in")
    (respond-error :database-error
                   "Failed to load composition-in"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-connections
  (let [result (<! (env/load-connections
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:entity-uid ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to load connections")
    (respond-error :database-error
                   "Failed to load connections"
                   {:exception (str e)})))

(response/def-ws-handler :environment/load-connections-in
  (let [result (<! (env/load-connections-in
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:entity-uid ?data)))]
    (respond-success (:environment result))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/loaded
        :facts (:facts result)
        :user-id (:user-id ?data)
        :environment-id (:environment-id ?data)}
       10)))
  (catch Exception e
    (log/error e "Failed to load connections-in")
    (respond-error :database-error
                   "Failed to load connections-in"
                   {:exception (str e)})))

(response/def-ws-handler :environment/clear-entities
  (let [result (<! (env/clear-entities
                    (:user-id ?data)
                    (:environment-id ?data)))]
    (if (:success result)
      (respond-success {:success true})
      (respond-error :database-error "Failed to clear entities"))
    (when (:success result)
      (ws/broadcast!
       {:type :facts/unloaded
        :fact-uids (:fact-uids-removed result)
        :user-id (:user-id ?data)
        :environment-id (or (:environment-id ?data)
                            (:id (get-default-environment (:user-id ?data))))}
       10)))
  (catch Exception e
    (log/error e "Failed to clear entities")
    (respond-error :database-error
                   "Failed to clear entities"
                   {:exception (str e)})))

(response/def-ws-handler :entity/select
  (let [result (<! (env/select-entity
                    (:user-id ?data)
                    (:environment-id ?data)
                    (:entity-uid ?data)))]
    (if (:success result)
      (respond-success {:success true :selected-entity (:entity-uid ?data)})
      (respond-error :database-error "Failed to select entity"))
    (when (:success result)
      (ws/broadcast!
       {:type :entity/selected
        :entity-uid (:entity-uid ?data)
        :user-id (:user-id ?data)
        :environment-id (or (:environment-id ?data)
                            (:id (get-default-environment (:user-id ?data))))}
       10)))
  (catch Exception e
    (log/error e "Failed to select entity")
    (respond-error :database-error
                   "Failed to select entity"
                   {:exception (str e)})))

(response/def-ws-handler :entity/select-none
  (let [result (<! (env/deselect-entity
                    (:user-id ?data)
                    (:environment-id ?data)))]
    (if (:success result)
      (respond-success {:success true})
      (respond-error :database-error "Failed to deselect entity"))
    (when (:success result)
      (ws/broadcast!
       {:type :entity/selected-none
        :user-id (:user-id ?data)
        :environment-id (or (:environment-id ?data)
                            (:id (get-default-environment (:user-id ?data))))}
       10)))
  (catch Exception e
    (log/error e "Failed to deselect entity")
    (respond-error :database-error
                   "Failed to deselect entity"
                   {:exception (str e)})))
