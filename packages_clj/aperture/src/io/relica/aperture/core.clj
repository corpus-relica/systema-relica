;; src/io/relica/aperture/core.clj
(ns io.relica.aperture.core
  (:require [clojure.tools.logging :as log]
            [io.relica.common.websocket.server :as common-ws]
            [io.relica.aperture.io.ws-server-ii :as ws]
            [io.relica.aperture.env :refer [get-user-environment get-user-environments
                                            update-user-environment! select-entity!
                                            deselect-entity! get-default-environment
                                            create-user-environment!]]
            [clojure.core.async :as async :refer [go <! >! chan]]
            [cheshire.core :as json]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.aperture.io.client-instances :refer [archivist-client]]

            ;; [io.relica.archivist.services.linearization-service :as lin]
            ))

;; Server instance
(defonce server-instance (atom nil))

;; Message Handlers
(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/get
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (tap> (str "Getting environment for user:" (:user-id ?data)))
    (go
      (try
        (let [user-id (:user-id ?data)
              env-id (:environment-id ?data)
              _ (tap> (str "Getting environment " env-id " for user " user-id))
              env (if env-id
                   (get-user-environment user-id env-id)
                   (get-default-environment user-id))]
          (tap> (str "Got environment " env))
          (if env
            (?reply-fn {:success true
                       :environment env})
            (?reply-fn {:error "Environment not found"})))
        (catch Exception e
          (log/error e "Failed to get environment")
          {:error "Failed to get environment"})))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/list
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (tap> (str "Getting all environments for user:" (:user-id ?data)))
    (go
      (try
        (let [environments (get-user-environments (:user-id ?data))]
          (?reply-fn {:success true
                     :environments environments}))
        (catch Exception e
          (log/error e "Failed to list environments")
          {:error "Failed to list environments"})))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/create
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (tap> (str "Creating environment for user:" (:user-id ?data)))
    (go
      (try
        (let [env (create-user-environment! (:user-id ?data) (:name ?data))]
          (if env
            (?reply-fn {:success true
                       :environment env})
            (?reply-fn {:error "Failed to create environment"})))
        (catch Exception e
          (log/error e "Failed to create environment")
          {:error "Failed to create environment"})))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-specialization
  [{:keys [?data ?reply-fn] :as msg}]
  ;; (tap> "LOADING SPECIALIZATION HIERARCHY")
  ;; (tap> ?data)

  (go
    (try
      (let [result (<! (archivist/get-specialization-hierarchy archivist-client (:user-id ?data) (:uid ?data)))
            user-id (:user-id ?data)
            env-id (or
                    (:environment-id ?data)
                    (:id (get-default-environment user-id)))
            env (get-user-environment user-id env-id)
            old-facts (:facts env)
            facts (get-in result [:hierarchy :facts])
            new-facts (concat old-facts facts)
            env (when facts
                  (update-user-environment! user-id env-id {:facts new-facts}))]
        ;; (tap> "GOT SPECIALIZATION HIERARCHY RESULT:::::::::::::::::::")
        ;; (tap> (str "User ID: " user-id " Environment ID: " env-id))
        ;; (tap> foo)

        (?reply-fn env)
        (ws/broadcast!
         ;; @server-instance
         {:type :facts/loaded
          :facts (:facts env)
          :user-id (:user-id ?data)
          :environment-id env-id}
         10))
      (catch Exception e
        (log/error e "Failed to load specialization hierarchy")
        (?reply-fn {:error "Failed to load specialization hierarchy"}))))
  )

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-all-related-facts
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (try
      (let [result (<! (archivist/get-all-related archivist-client (:entity-uid ?data)))
            _ (tap> "GOT ALL RELATED FACTS RESULT:::::::::::::::::::")
            _ (tap> result)
            _ (tap> ?data)
            user-id (:user-id ?data)
            env-id (:environment-id ?data)
            env (get-user-environment user-id env-id)
            _ (tap> "ENv")
            _ (tap> env)
            old-facts (:facts env)
            facts (:facts result)
            new-facts (concat old-facts facts)
            env (when facts
                  (update-user-environment! user-id env-id {:facts new-facts}))]
        (?reply-fn env)
        (ws/broadcast!
         ;; @server-instance
         {:type :facts/loaded
          :facts (:facts env)
          :user-id (:user-id ?data)
          :environment-id env-id}
         10))
      (catch Exception e
        (log/error e "Failed to load all related facts")
        (?reply-fn {:error "Failed to load all related facts"}))))
  )

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/load-entity
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (try
      (let [
            result (<! (archivist/get-entity archivist-client (:entity-uid ?data)))
            user-id (:user-id ?data)
            env-id (or
                    (:environment-id ?data)
                    (:id (get-default-environment user-id)))
            env (get-user-environment user-id env-id)
            old-facts (:facts env)
            facts (:facts result)
            new-facts (concat old-facts facts)
            env (when facts
                  (update-user-environment! user-id env-id {:facts new-facts}))]
        (?reply-fn env)
        (ws/broadcast!
         ;; @server-instance
         {:type :facts/loaded
          :facts (:facts env)
          :user-id (:user-id ?data)
          :environment-id env-id}
         10))
      (catch Exception e
        (log/error e "Failed to load entity")
        (?reply-fn {:error "Failed to load entity"}))))
  )

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/unload-entity
  [{:keys [?data ?reply-fn] :as msg}]
  (go
    (try
      (let [env-id (:environment-id ?data)
            user-id (:user-id ?data)
            entity-uid (:entity-uid ?data)
            env (get-user-environment user-id env-id)
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
            updated (when env
                     (update-user-environment! user-id env-id {:facts remaining-facts}))]
        
        (tap> (str "Unloaded entity " entity-uid " from environment " env-id))
        (tap> (str "Removed " (count facts-to-remove) " facts and " (count final-model-uids-to-remove) " models"))
        (tap> ?data)
        
        (?reply-fn updated)
        (ws/broadcast!
         ;; @server-instance
         {:type :facts/unloaded
          :fact-uids fact-uids-to-remove
          :model-uids (vec final-model-uids-to-remove)
          :user-id (:user-id ?data)
          :environment-id env-id}
         10))
      (catch Exception e
        (log/error e "Failed to unload entity")
        (?reply-fn {:error "Failed to unload entity"}))))
  )

    ;; replEnv.set(
    ;;   MalSymbol.get('loadEntities'),
    ;;   MalFunction.fromBootstrap(async (arg: MalType): Promise<MalType> => {
    ;;     if (!(arg instanceof MalVector)) {
    ;;       throw new Error('loadEntities: expected vector argument');
    ;;     }
    ;;     let facts: Fact[] = [];
    ;;     let models: any[] = [];
    ;;     const entityIds = malToJs(arg);
    ;;     for (let i = 0; i < entityIds.length; i++) {
    ;;       const payload = await this.environment.loadEntity(entityIds[i]);
    ;;       facts = facts.concat(payload.facts);
    ;;       models = models.concat(payload.models);
    ;;     }
    ;;     return jsToMal({ facts, models });
    ;;   }),
    ;; );

    ;; replEnv.set(
    ;;   MalSymbol.get('unloadEntities'),
    ;;   MalFunction.fromBootstrap(async (arg: MalType): Promise<MalType> => {
    ;;     if (!(arg instanceof MalVector)) {
    ;;       throw new Error('unloadEntities: expected vector argument');
    ;;     }
    ;;     console.log('unloadEntities', malToJs(arg));
    ;;     const removedFacts = await this.environment.removeEntities(
    ;;       malToJs(arg),
    ;;     );
    ;;     return jsToMal(removedFacts);
    ;;   }),
    ;; );



(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/clear-entities
  [{:keys [?data ?reply-fn] :as msg}]
  (tap> (str "Handling environment/clear-entities"))
  (tap> ?data)
  (when ?reply-fn
    (tap> (str "Clearing entities for user:" (:user-id ?data)))
    (go
      (try
        (let [env-id (or (:environment-id ?data)
                        (:id (get-default-environment (:user-id ?data))))
              environment (get-user-environment (:user-id ?data) env-id)
              _ (tap> (str "$$$$$$$$$$$$$$$ Clearing entities in environment " env-id))
              updated (when env-id
                       (update-user-environment! (:user-id ?data) env-id {:facts []}))]
          (if updated
            (do
              (?reply-fn {:success true})
              (ws/broadcast!
               ;; @server-instance
               {:type :facts/unloaded
                :fact-uids (map (fn [f] (:fact_uid f)) (:facts environment))
                :user-id (:user-id ?data)
                :environment-id env-id}
               10))
            (?reply-fn {:error "Failed to clear entities"})))
        (catch Exception e
          (log/error e "Failed to clear entities")
          {:error "Failed to clear entities"})))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :entity/select
  [{:keys [?data ?reply-fn] :as msg}]
  (tap> (str "Handling entity/select"))
  (tap> ?data)
  (when ?reply-fn
    (tap> (str "selecting entity " (:entity-uid ?data) " for user:" (:user-id ?data)))
    (go
      (try
        (let [env-id (or (:environment-id ?data)
                        (:id (get-default-environment (:user-id ?data))))
              _ (tap> (str "$$$$$$$$$$$$$$$ Selecting entity " (:entity-uid ?data) " in environment " env-id))
              updated (when env-id 
                       (select-entity! (:user-id ?data) env-id (:entity-uid ?data)))]
          (if updated
            (do
              (?reply-fn {:success true
                           :selected-entity (:entity-uid ?data)})
              (tap> "%%%%%%%%%%%%%%%%%%%%% FUGGIN BROADCAST %%%%%%%%%%%%%%%%%%%%%%")
              (ws/broadcast!
               ;; @server-instance
               {:type :entity/selected
                :entity-uid (:entity-uid ?data)
                :user-id (:user-id ?data)
                :environment-id env-id}
               10))
            (?reply-fn {:error "Failed to select entity"})))
        (catch Exception e
          (log/error e "Failed to select entity")
          {:error "Failed to select entity"})))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :entity/select-none
  [{:keys [?data ?reply-fn] :as msg}]
  (tap> (str "Handling entity/select-none"))
  (tap> ?data)
  (when ?reply-fn
    (tap> (str "deselecting entity for user:" (:user-id ?data)))
    (go
      (try
        (let [env-id (or (:environment-id ?data)
                        (:id (get-default-environment (:user-id ?data))))
              _ (tap> (str "$$$$$$$$$$$$$$$ Deselecting entity in environment " env-id))
              updated (when env-id
                       (deselect-entity! (:user-id ?data) env-id))]
          (if updated
            (do
              (?reply-fn {:success true})
              (tap> "%%%%%%%%%%%%%%%%%%%%% FUGGIN BROADCAST %%%%%%%%%%%%%%%%%%%%%%")
              (ws/broadcast!
               ;; @server-instance
               {:type :entity/selected-none
                :user-id (:user-id ?data)
                :environment-id env-id}
               10))
            (?reply-fn {:error "Failed to deselect entity"})))
        (catch Exception e
          (log/error e "Failed to deselect entity")
          {:error "Failed to deselect entity"})))))



;; Server management
(defn start! []
  (when-not @server-instance
    (let [port 2175
          server (ws/start! port)]
      (reset! server-instance server)
      (tap> (str "Aperture WebSocket server started on port" port))
      server)))

(defn stop! []
  (when-let [server @server-instance]
    (ws/stop! server)
    (reset! server-instance nil)
    (tap> "Aperture WebSocket server stopped")))

(defn -main [& args]
  (start!))

;; REPL helpers
(comment
  ;; Start server
  (def server (start!))

  ;; Get active connections
  (ws/get-active-sessions @server-instance)

  ;; Test broadcast
  (ws/broadcast! @server-instance
                {:type "system-notification"
                 :message "Test broadcast"})

  (get-user-environments 7)

  (create-user-environment! 7 "Test env tres")

  (get-default-environment 7)

  (get-environment @aperture-client 7 1)
  (list-environments @aperture-client 7)
  (update-environment! @aperture-client 7 1 {:name "Test env" :description "Test env"})
  (load-specialization-hierarchy @aperture-client 7 7)
  (select-entity @aperture-client 7 1)
  (select-entity @aperture-client 7 1 1)

  ;; Stop server
  (stop!))
