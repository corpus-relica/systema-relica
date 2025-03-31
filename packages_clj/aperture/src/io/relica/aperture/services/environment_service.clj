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
            ))

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
        (let [result (<! (archivist/text-search archivist-client {:searchTerm search-term}))
              result (:results result)
              - (println "TEXT SEARCH RESULT:")
              _ (println result)
              env-id (:id (get-default-environment user-id))
              _ (println "USER ID:")
              _ (println user-id)
              _ (println "ENV ID:")
              _ (println env-id)
              env (get-user-environment user-id env-id)
              old-facts (:facts env)
              facts (:facts result)
              facts-to-load (filter #(= (:lh_object_name %) search-term) facts)
              _ (println "FACTS TO LOAD:")
              _ (println facts-to-load)
              combined-facts (concat old-facts facts-to-load)
              new-facts (deduplicate-facts combined-facts)
              _ (println "COMBINED AND NEW FACTS:")
              _ (println combined-facts)
              _ (println new-facts)
              updated-env (when new-facts
                           (update-user-environment! user-id env-id {:facts new-facts}))]
          (println "UPDATED ENV:")
          (println updated-env)
          (if updated-env
            {:success true
             :environment updated-env
             :facts facts-to-load}
            {:error "Failed to update environment with text search"}))
        (catch Exception e
          (log/error e "Failed to text search")
          {:error "Failed to text search"}))))

  ;; Fact/Entity management
  (load-specialization-hierarchy [this user-id uid env-id]
    (go
      (try
        (let [result (<! (archivist/get-specialization-hierarchy archivist-client user-id uid))
              env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              old-facts (:facts env)
              facts (get-in result [:hierarchy :facts])
              combined-facts (concat old-facts facts)
              new-facts (deduplicate-facts combined-facts)
              updated-env (when facts
                           (update-user-environment! user-id env-id {:facts new-facts}))]
          (if updated-env
            {:success true
             :environment updated-env
             :facts (:facts updated-env)}
            {:error "Failed to update environment with specialization hierarchy"}))
        (catch Exception e
          (log/error e "Failed to load specialization hierarchy")
          {:error "Failed to load specialization hierarchy"}))))

  (load-model [this user-id uid env-id]
    (go
      (try
        (let [result (<! (clarity/get-model clarity-client uid))
              ;; env-id (or env-id (:id (get-default-environment user-id)))
              ;; env (get-user-environment user-id env-id)
              ;; old-facts (:facts env)
              ;; facts (:facts result)
              ;; combined-facts (concat old-facts facts)
              ;; new-facts (deduplicate-facts combined-facts)
              ;; updated-env (when facts
              ;;              (update-user-environment! user-id env-id {:facts new-facts}))
              ]
          (println "MODEL RESULT:")
          (println result)
          ;; (if updated-env
          ;;   {:success true
          ;;    :environment updated-env
          ;;    :facts facts}
          ;;   {:error "Failed to update environment with model"})
          )
        (catch Exception e
          (log/error e "Failed to load model")
          {:error "Failed to load model"})))
    )
  
  (load-all-related-facts [this user-id entity-uid env-id]
    (go
      (try
        (let [result (<! (archivist/get-all-related archivist-client entity-uid))
              env (get-user-environment user-id env-id)
              old-facts (:facts env)
              facts (:facts result)
              combined-facts (concat old-facts facts)
              new-facts (deduplicate-facts combined-facts)
              updated-env (when facts
                           (update-user-environment! user-id env-id {:facts new-facts}))]
          (if updated-env
            {:success true
             :environment updated-env
             :facts facts}
            {:error "Failed to update environment with related facts"}))
        (catch Exception e
          (log/error e "Failed to load all related facts")
          {:error "Failed to load all related facts"}))))
  
  (load-entity [this user-id entity-uid env-id]
    (go
      (try
        (let [env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              selected-entity (:selected_entity_id env)
              
              ;; Get definitive facts for the entity
              def-result (<! (archivist/get-definitive-facts archivist-client entity-uid))
              definitive-facts (:facts def-result)

              ;; If there's a selected entity, get facts relating it to our entity
              rel-result (if selected-entity
                           (<! (archivist/get-facts-relating-entities archivist-client 
                                                                      entity-uid 
                                                                      selected-entity))
                           {:facts []})
              relating-facts (:facts rel-result)

              ;; Combine both sets of facts from this operation
              all-new-facts (concat definitive-facts relating-facts)
              ;; Deduplicate only the new facts
              unique-new-facts (deduplicate-facts all-new-facts)
              
              ;; Check if there are already existing facts in the environment
              old-facts (:facts env)
              
              ;; Combine with existing facts and deduplicate for storing in environment
              combined-facts (concat old-facts unique-new-facts)
              deduplicated-env-facts (deduplicate-facts combined-facts)

              ;; Models could be implemented here if needed
              
              ;; Update the environment - only when we have new facts to add
              updated-env (when (seq unique-new-facts)
                           (update-user-environment! user-id env-id {:facts deduplicated-env-facts}))]          
          (if updated-env
            {:success true
             :environment updated-env
             :facts unique-new-facts}
            {:error "Failed to update environment with entity"}))
        (catch Exception e
          (log/error e "Failed to load entity")
          {:error "Failed to load entity"}))))
  
  (unload-entity [this user-id entity-uid env-id]
    (go
      (try
        (let [env (get-user-environment user-id env-id)
              facts (:facts env)
              ;; Find facts to remove (those where the entity is on either side)
              facts-to-remove (filter #(or (= entity-uid (:lh_object_uid %)) 
                                          (= entity-uid (:rh_object_uid %))) 
                                    facts)
              ;; Find facts to keep
              remaining-facts (remove #(or (= entity-uid (:lh_object_uid %)) 
                                          (= entity-uid (:rh_object_uid %)))
                                    facts)
              ;; Get UIDs of facts to remove
              fact-uids-to-remove (mapv :fact_uid facts-to-remove)
              
              ;; Find candidate model UIDs to remove
              ;; These are models that might need to be removed if they're not referenced by remaining facts
              candidate-model-uids-to-remove (-> #{}
                                               (into (map :lh_object_uid facts-to-remove))
                                               (into (map :rh_object_uid facts-to-remove)))
              
              ;; Remove models from candidates if they're still referenced in remaining facts
              final-model-uids-to-remove (loop [models candidate-model-uids-to-remove
                                              remaining remaining-facts]
                                         (if (empty? remaining)
                                           models
                                           (let [fact (first remaining)
                                                 lh-uid (:lh_object_uid fact)
                                                 rh-uid (:rh_object_uid fact)
                                                 models (cond-> models
                                                          (contains? models lh-uid) (disj lh-uid)
                                                          (contains? models rh-uid) (disj rh-uid))]
                                             (recur models (rest remaining)))))
              
              ;; Update environment with remaining facts
              updated-env (when env
                       (update-user-environment! user-id env-id {:facts remaining-facts}))]
          
          (if updated-env
            {:success true
             :environment updated-env
             :fact-uids-removed fact-uids-to-remove
             :model-uids-removed (vec final-model-uids-to-remove)}
            {:error "Failed to unload entity"}))
        (catch Exception e
          (log/error e "Failed to unload entity")
          {:error "Failed to unload entity"}))))
  
  (load-entities [this user-id env-id entity-uids]
    (go
      (try
        (let [;; Track only the newly loaded facts from this operation
              new-facts-only (atom [])
              ;; Models could be added here if needed
              new-models-only (atom [])
              env (get-user-environment user-id env-id)
              old-facts (:facts env)]
              
          ;; Process each entity and collect ONLY the new facts
          (doseq [entity-uid entity-uids]
            (let [result (<! (load-entity this user-id entity-uid env-id))
                  ;; Only take facts that were newly loaded for this entity
                  entity-facts (if (:success result)
                                  (:facts result)
                                  [])]
              (when (seq entity-facts)
                (swap! new-facts-only concat entity-facts)
                ;; If we had models, we would add them here
                )))

          (tap> @new-facts-only)
          
          ;; Get only unique facts to add to the environment
          (let [unique-new-facts (deduplicate-facts @new-facts-only)
                ;; Deduplicate when combining with existing facts
                combined-facts (concat old-facts unique-new-facts)
                deduplicated-facts (deduplicate-facts combined-facts)
                ;; Update environment with the combined deduplicated facts
                updated-env (update-user-environment! user-id env-id {:facts deduplicated-facts})]
            (if updated-env
              {:success true
               :environment updated-env
               :facts unique-new-facts
               :models @new-models-only}
              {:error "Failed to load entities"})))
        (catch Exception e
          (log/error e "Failed to load entities")
          {:error "Failed to load entities"}))))
  
  (unload-entities [this user-id env-id entity-uids]
    (go
      (try
        (let [env (get-user-environment user-id env-id)
              facts (:facts env)
              ;; Track all facts and models to remove
              all-fact-uids-to-remove (atom [])
              all-model-uids-to-remove (atom [])]
          
          ;; Process each entity
          (doseq [entity-uid entity-uids]
            (let [;; Find facts to remove for this entity
                  facts-to-remove (filter #(or (= entity-uid (:lh_object_uid %)) 
                                              (= entity-uid (:rh_object_uid %))) 
                                        facts)
                  ;; Get UIDs of facts to remove
                  fact-uids-to-remove (mapv :fact_uid facts-to-remove)
                  
                  ;; Find candidate model UIDs to remove
                  candidate-model-uids-to-remove (-> #{}
                                                   (into (map :lh_object_uid facts-to-remove))
                                                   (into (map :rh_object_uid facts-to-remove)))]
              
              ;; Add to our collection
              (swap! all-fact-uids-to-remove concat fact-uids-to-remove)
              (swap! all-model-uids-to-remove concat (vec candidate-model-uids-to-remove))))
          
          ;; Now remove all facts referencing any of these entities
          (let [remaining-facts (remove #(or (some (fn [entity-uid] 
                                                   (= entity-uid (:lh_object_uid %)))
                                                 entity-uids)
                                           (some (fn [entity-uid]
                                                   (= entity-uid (:rh_object_uid %)))
                                                 entity-uids))
                                       facts)
                
                ;; Determine which models can be removed (not referenced in remaining facts)
                final-model-uids-to-remove (loop [models (set @all-model-uids-to-remove)
                                                 remaining remaining-facts]
                                            (if (empty? remaining)
                                              models
                                              (let [fact (first remaining)
                                                    lh-uid (:lh_object_uid fact)
                                                    rh-uid (:rh_object_uid fact)
                                                    models (cond-> models
                                                             (contains? models lh-uid) (disj lh-uid)
                                                             (contains? models rh-uid) (disj rh-uid))]
                                                (recur models (rest remaining)))))
                
                ;; Update environment with remaining facts
                updated-env (when env
                          (update-user-environment! user-id env-id {:facts remaining-facts}))]
            
            (if updated-env
              {:success true
               :environment updated-env
               :fact-uids-removed @all-fact-uids-to-remove
               :model-uids-removed (vec final-model-uids-to-remove)}
              {:error "Failed to unload entities"})))
        (catch Exception e
          (log/error e "Failed to unload entities")
          {:error "Failed to unload entities"}))))

  ;; async loadSubtypesCone(uid: number) {
  ;;   const result = await this.archivistService.getSubtypesCone(uid);
  ;;   const models = await this.modelsFromFacts(result);
  ;;   this.insertFacts(result);
  ;;   this.insertModels(models);
  ;;   const payload = { facts: result, models };
  ;;   return payload;
  ;; }
  (load-subtypes-cone [this user-id env-id entity-uid ]
    (go
      (try
        (let [result (<! (archivist/get-subtypes-cone archivist-client entity-uid))
              env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              old-facts (:facts env)
              facts (:facts result)
              _ (tap> "FUCKING SUBTYPES CONE")
              _ (tap> facts)
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

  (load-composition [this user-id env-id entity-uid]
    (go
      (try
        (let [result (<! (archivist/get-recurisve-relations archivist-client entity-uid 1190))
              env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              old-facts (:facts env)
              facts (:facts result)
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

  (load-composition-in [this user-id env-id entity-uid]
    (go
      (try
        (let [result (<! (archivist/get-recurisve-relations-to archivist-client entity-uid 1190))
              env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              old-facts (:facts env)
              facts (:facts result)
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

  (load-connections [this user-id env-id entity-uid]
    (go
      (try
        (let [result (<! (archivist/get-recurisve-relations archivist-client entity-uid 1487))
              env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              old-facts (:facts env)
              facts (:facts result)
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

  (load-connections-in [this user-id env-id entity-uid]
    (go
      (try
        (let [result (<! (archivist/get-recurisve-relations-to archivist-client entity-uid 1487))
              env-id (or env-id (:id (get-default-environment user-id)))
              env (get-user-environment user-id env-id)
              old-facts (:facts env)
              facts (:facts result)
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
