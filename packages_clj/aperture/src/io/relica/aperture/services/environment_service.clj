(ns io.relica.aperture.services.environment-service
  (:require [clojure.tools.logging :as log]
            [io.relica.aperture.config :refer [get-user-environment get-user-environments
                                           update-user-environment! select-entity!
                                           deselect-entity! get-default-environment
                                           create-user-environment!]]
            [clojure.core.async :as async :refer [go <! >! chan]]
            [cheshire.core :as json]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.common.io.clarity-client :as clarity]

            [clojure.pprint :as pprint]))

;; Helper function to deduplicate facts by fact_uid
(defn- deduplicate-facts
  "Remove duplicate facts based on fact_uid"
  [facts]
  (->> facts
       (group-by :fact_uid)
       vals
       (map first)))

;; Protocol for environment service operations
(defprotocol EnvironmentOperations
  ;; Environment management
  (get-environment [this user-id env-id])
  (list-environments [this user-id])
  (create-environment [this user-id name])

  (text-search-load [this user-id search-term])
  
  ;; Fact/Entity management
  (load-specialization-hierarchy [this user-id uid env-id])
  (load-model [this user-id uid env-id])
  (load-all-related-facts [this user-id entity-uid env-id])
  (load-entity [this user-id entity-uid env-id])
  (unload-entity [this user-id entity-uid env-id])
  (load-entities [this user-id env-id entity-uids])
  (unload-entities [this user-id env-id entity-uids])
  (load-subtypes-cone [this user-id entity-uid env-id])
  (load-composition [this user-id entity-uid env-id])
  (load-composition-in [this user-id entity-uid env-id])
  (load-connections [this user-id entity-uid env-id])
  (load-connections-in [this user-id entity-uid env-id])
  (clear-entities [this user-id env-id])
  
  ;; Entity selection
  (select-entity [this user-id env-id entity-uid])
  (deselect-entity [this user-id env-id]))

;; Implementation of environment service
(defrecord EnvironmentService [archivist-client clarity-client]
  EnvironmentOperations
  
  ;; Environment management
  (get-environment [_ user-id env-id]
    (go
      (try
        (let [env (if env-id
                    (get-user-environment user-id env-id)
                    (get-default-environment user-id))]
          (if env
            {:success true :environment env}
            {:error "Environment not found"}))
        (catch Exception e
          (log/error e "Failed to get environment")
          {:error "Failed to get environment"}))))
  
  (list-environments [_ user-id]
    (go
      (try
        (let [environments (get-user-environments user-id)]
          {:success true :environments environments})
        (catch Exception e
          (log/error e "Failed to list environments")
          {:error "Failed to list environments"}))))
  
  (create-environment [_ user-id name]
    (go
      (try
        (let [env (create-user-environment! user-id name)]
          (if env
            {:success true :environment env}
            {:error "Failed to create environment"}))
        (catch Exception e
          (log/error e "Failed to create environment")
          {:error "Failed to create environment"}))))

  (text-search-load [this user-id search-term]
    (go
      (try
        (let [result (<! (archivist/text-search archivist-client search-term))
              facts (:facts result)
              env-id (:id (get-default-environment user-id))
              env (get-user-environment user-id env-id)
              
              ;; Check if there are already existing facts in the environment
              old-facts (:facts env)
              
              ;; Combine with existing facts and deduplicate for storing in environment
              combined-facts (concat old-facts facts)
              new-facts (deduplicate-facts combined-facts)
              
              ;; Update the environment with the new facts
              updated-env (when facts
                            (update-user-environment! user-id env-id {:facts new-facts}))]
          
          (if updated-env
            {:success true
             :environment updated-env
             :facts facts}
            {:error "Failed to update environment with text search"}))
        (catch Exception e
          (log/error e "Failed to perform text search")
          {:error "Failed to perform text search"}))))
  
  (load-specialization-hierarchy [this user-id uid env-id]
    (go
      (try
        (let [result (<! (archivist/get-specialization-hierarchy archivist-client uid))
              facts (:facts result)
              env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              
              ;; Check if there are already existing facts in the environment
              old-facts (:facts env)
              
              ;; Combine with existing facts and deduplicate for storing in environment
              combined-facts (concat old-facts facts)
              new-facts (deduplicate-facts combined-facts)
              
              ;; Update the environment with the new facts
              updated-env (when facts
                            (update-user-environment! user-id env-id {:facts new-facts}))]
          
          (if updated-env
            {:success true
             :environment updated-env
             :facts facts}
            {:error "Failed to update environment with specialization hierarchy"}))
        (catch Exception e
          (log/error e "Failed to load specialization hierarchy")
          {:error "Failed to load specialization hierarchy"}))))
  
  (load-model [this user-id uid env-id]
    (go
      (try
        (let [result (<! (clarity/get-model clarity-client uid))
              model (:model result)
              env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              old-facts (:facts env)
              old-models (:models env)
              facts (:facts model)
              combined-facts (concat old-facts facts)
              combined-models (conj (or old-models []) model)
              new-facts (deduplicate-facts combined-facts)
              updated-env (when facts
                           (update-user-environment! user-id env-id {:facts new-facts
                                                                     :models combined-models}))
              ]
          (println "MODEL RESULT:")
          (pprint/pprint model)
          (if model
            {:success true
             :environment updated-env
             :model model
             }
            {:error "Failed to update environment with model"})
          )
        (catch Exception e
          (log/error e "Failed to load model")
          {:error "Failed to load model"}))))
  
  (load-entity [this user-id entity-uid env-id]
    (go
      (try
        (let [result (<! (archivist/get-entity archivist-client entity-uid))
              facts (:facts result)
              env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              
              ;; Check if there are already existing facts in the environment
              old-facts (:facts env)
              
              ;; Combine with existing facts and deduplicate for storing in environment
              combined-facts (concat old-facts facts)
              new-facts (deduplicate-facts combined-facts)
              
              ;; Update the environment with the new facts
              updated-env (when facts
                            (update-user-environment! user-id env-id {:facts new-facts}))]
          
          (if updated-env
            {:success true
             :environment updated-env
             :facts facts}
            {:error "Failed to update environment with entity"}))
        (catch Exception e
          (log/error e "Failed to load entity")
          {:error "Failed to load entity"}))))
  
  (unload-entity [this user-id entity-uid env-id]
    (go
      (try
        (let [env (get-user-environment user-id env-id)
              facts (:facts env)
              ;; Filter out facts related to the entity
              filtered-facts (remove (fn [fact]
                                       (let [entity-id-key (case (:fact_type fact)
                                                             "entity" :entity_uid
                                                             "relation" (if (= entity-uid (:from_entity_uid fact))
                                                                          :from_entity_uid
                                                                          (when (= entity-uid (:to_entity_uid fact))
                                                                            :to_entity_uid))
                                                             "property" :entity_uid
                                                             nil)]
                                         (when entity-id-key
                                           (= entity-uid (get fact entity-id-key)))))
                                     facts)
              ;; Update the environment with the filtered facts
              updated-env (update-user-environment! user-id env-id {:facts filtered-facts})]
          (if updated-env
            {:success true
             :environment updated-env
             :entity-uid entity-uid}
            {:error "Failed to unload entity"}))
        (catch Exception e
          (log/error e "Failed to unload entity")
          {:error "Failed to unload entity"}))))
  
  (load-entities [this user-id env-id entity-uids]
    (go
      (try
        (let [env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              old-facts (:facts env)
              
              ;; Load each entity and collect all facts
              results (for [uid entity-uids]
                        (<! (archivist/get-entity archivist-client uid)))
              
              all-new-facts (mapcat :facts results)
              
              ;; Combine with existing facts and deduplicate
              combined-facts (concat old-facts all-new-facts)
              new-facts (deduplicate-facts combined-facts)
              
              ;; Update the environment
              updated-env (update-user-environment! user-id env-id {:facts new-facts})]
          
          (if updated-env
            {:success true
             :environment updated-env
             :entity-uids entity-uids}
            {:error "Failed to load entities"}))
        (catch Exception e
          (log/error e "Failed to load entities")
          {:error "Failed to load entities"}))))
  
  (unload-entities [this user-id env-id entity-uids]
    (go
      (try
        (let [env (get-user-environment user-id env-id)
              facts (:facts env)
              ;; Filter out facts related to any of the entities
              filtered-facts (remove (fn [fact]
                                       (let [entity-id-key (case (:fact_type fact)
                                                             "entity" :entity_uid
                                                             "relation" (if (contains? (set entity-uids) (:from_entity_uid fact))
                                                                          :from_entity_uid
                                                                          (when (contains? (set entity-uids) (:to_entity_uid fact))
                                                                            :to_entity_uid))
                                                             "property" :entity_uid
                                                             nil)]
                                         (when entity-id-key
                                           (contains? (set entity-uids) (get fact entity-id-key)))))
                                     facts)
              ;; Update the environment with the filtered facts
              updated-env (update-user-environment! user-id env-id {:facts filtered-facts})]
          (if updated-env
            {:success true
             :environment updated-env
             :entity-uids entity-uids}
            {:error "Failed to unload entities"}))
        (catch Exception e
          (log/error e "Failed to unload entities")
          {:error "Failed to unload entities"}))))
  
  (load-subtypes-cone [this user-id entity-uid env-id]
    (go
      (try
        (let [result (<! (archivist/get-subtypes-cone archivist-client entity-uid))
              facts (:facts result)
              env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              old-facts (:facts env)
              combined-facts (concat old-facts facts)
              new-facts (deduplicate-facts combined-facts)
              updated-env (when facts
                            (update-user-environment! user-id env-id {:facts new-facts}))]
          (if updated-env
            {:success true
             :environment updated-env
             :facts facts}
            {:error "Failed to update environment with subtypes cone"}))
        (catch Exception e
          (log/error e "Failed to load subtypes cone")
          {:error "Failed to load subtypes cone"}))))
  
  (load-composition [this user-id entity-uid env-id]
    (go
      (try
        (let [result (<! (archivist/get-recurisve-relations archivist-client entity-uid 1190))
              facts (:facts result)
              env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              old-facts (:facts env)
              combined-facts (concat old-facts facts)
              new-facts (deduplicate-facts combined-facts)
              updated-env (when facts
                            (update-user-environment! user-id env-id {:facts new-facts}))]
          (if updated-env
            {:success true
             :environment updated-env
             :facts facts}
            {:error "Failed to update environment with composition"}))
        (catch Exception e))
        ))

  (clear-entities [this user-id env-id]
    (go
      (try
        (let [env-id (or env-id (:id (get-default-environment user-id)))
              environment (get-user-environment user-id env-id)
              updated (when env-id
                       (update-user-environment! user-id env-id {:facts []}))]
          (if updated
            {:success true
             :fact-uids-removed (map (fn [f] (:fact_uid f)) (:facts environment))}
            {:error "Failed to clear entities"}))
        (catch Exception e
          (log/error e "Failed to clear entities")
          {:error "Failed to clear entities"}))))
  
  ;; Entity selection
  (select-entity [this user-id env-id entity-uid]
    (go
      (try
        (let [env-id (or env-id (:id (get-default-environment user-id)))
              updated (when env-id 
                       (select-entity! user-id env-id entity-uid))]
          (if updated
            {:success true :selected-entity entity-uid}
            {:error "Failed to select entity"}))
        (catch Exception e
          (log/error e "Failed to select entity")
          {:error "Failed to select entity"}))))
  
  (deselect-entity [this user-id env-id]
    (go
      (try
        (let [env-id (or env-id (:id (get-default-environment user-id)))
              updated (when env-id
                       (deselect-entity! user-id env-id))]
          (if updated
            {:success true}
            {:error "Failed to deselect entity"}))
        (catch Exception e
          (log/error e "Failed to deselect entity")
          {:error "Failed to deselect entity"})))))

;; Factory function to create environment service
(defn create-environment-service [archivist-client clarity-client]
  (->EnvironmentService archivist-client clarity-client))