(ns io.relica.clarity.services.role-model-service
  (:require
   [clojure.tools.logging :as log]
   [clojure.core.async :as async :refer [go <!]]
   [io.relica.clarity.services.entity-model-service :as e-ms]
   [io.relica.common.io.archivist-client :as archivist]
   [io.relica.clarity.io.client-instances :refer [archivist-client]]
   ))


;; ------------------------------------------------------------------ HELPERS --

(defn retrieve-possible-kinds-of-role-players
  "Retrieve possible kinds of role players for a role entity"
  [uid]
  (go
    (try
      (let [response (<! (archivist/get-related-to
                          archivist-client
                          uid
                          4714))
            facts (:facts response)
            role-player-uids (map :lh_object_uid facts)
            ]
        ;; (println "Response:" response)
        (if (:success response)
          role-player-uids
          []))
      (catch Exception e
        (log/error e "Failed to retrieve possible kinds of role players")
        {}))))

(defn retrieve-requiring-kinds-of-relations
  "Retrieve requiring kinds of relations for a role entity"
  [uid]
  (go
    (try
      (let [response-1 (<! (archivist/get-related-to
                            archivist-client
                            uid
                            4731))
            response-2 (<! (archivist/get-related-to
                            archivist-client
                            uid
                            4733))
            facts-1 (:facts response-1)
            facts-2 (:facts response-2)
            facts (concat facts-1 facts-2)
            relation-uids (map :lh_object_uid facts)]
        ;; (println "Response:" response)
        (if (and (:success response-1)
                 (:success response-2))
          relation-uids
          []))
      (catch Exception e
        (log/error e "Failed to retrieve requiring kinds of relations")
        []))))

;; --------------------------------------------------------------------- KIND --

(defn retrieve-kind-of-role-model
  "Retrieve and transform a role object to its semantic model representation"
  [uid]
  (go
    (try
      (let [base-model (<! (e-ms/retrieve-kind-of-entity-model uid))
            ;; Get specialization hierarchy for the role to find inheritance path
            specialization-response (<! (archivist/get-specialization-hierarchy 
                                        archivist-client 
                                        nil
                                        uid))
            specialization-facts (if (:success specialization-response)
                                   (:facts (:hierarchy specialization-response))
                                   [])
            
            ;; Get possible role players
            response-players (<! (archivist/get-related-to
                                  archivist-client
                                  uid
                                  4714))
            role-player-facts (:facts response-players)
            possible-kinds-of-role-players (map :lh_object_uid role-player-facts)
            
            ;; Find which ancestors might have role player relationships
            role-player-sources (if (empty? role-player-facts)
                                  ;; If no direct role players, check ancestors
                                  (let [ancestor-uids (map :lh_object_uid specialization-facts)]
                                    (filter #(not= % uid) ancestor-uids))
                                  [])
            
            ;; For each ancestor that might have role player relationships, get those too
            ancestor-player-facts (atom [])
            _ (doseq [ancestor-uid role-player-sources]
                (let [ancestor-response (<! (archivist/get-related-to
                                            archivist-client
                                            ancestor-uid
                                            4714))
                      ancestor-facts (:facts ancestor-response)]
                  (swap! ancestor-player-facts concat ancestor-facts)))
            
            ;; Get requiring relations
            response-rels-1 (<! (archivist/get-related-to
                               archivist-client
                               uid
                               4731))
            response-rels-2 (<! (archivist/get-related-to
                               archivist-client
                               uid
                               4733))
            relation-facts-1 (:facts response-rels-1)
            relation-facts-2 (:facts response-rels-2)
            requiring-kinds-of-relations (concat (map :lh_object_uid relation-facts-1)
                                                (map :lh_object_uid relation-facts-2))
            
            ;; Find which ancestors have requiring relations
            relation-sources (if (and (empty? relation-facts-1) (empty? relation-facts-2))
                               ;; If no direct relations, check ancestors
                               (let [ancestor-uids (map :lh_object_uid specialization-facts)]
                                 (filter #(not= % uid) ancestor-uids))
                               [])
            
            ;; Get requiring relations from ancestors
            ancestor-relation-facts-1 (atom [])
            ancestor-relation-facts-2 (atom [])
            _ (doseq [ancestor-uid relation-sources]
                (let [ancestor-response-1 (<! (archivist/get-related-to
                                             archivist-client
                                             ancestor-uid
                                             4731))
                      ancestor-response-2 (<! (archivist/get-related-to
                                             archivist-client
                                             ancestor-uid
                                             4733))
                      ancestor-facts-1 (:facts ancestor-response-1)
                      ancestor-facts-2 (:facts ancestor-response-2)]
                  (swap! ancestor-relation-facts-1 concat ancestor-facts-1)
                  (swap! ancestor-relation-facts-2 concat ancestor-facts-2)))
            
            ;; Find which specialization facts are relevant - connecting this role to ancestors
            ;; with relevant relationships
            relevant-sources (into #{} (concat role-player-sources relation-sources))
            
            relevant-spec-facts (filter (fn [fact]
                                         (or (relevant-sources (:lh_object_uid fact))
                                             (relevant-sources (:rh_object_uid fact))))
                                       specialization-facts)
            
            ;; Collect all facts used to build this model
            all-facts (concat 
                       (get base-model :facts [])
                       role-player-facts
                       @ancestor-player-facts
                       relation-facts-1
                       relation-facts-2
                       @ancestor-relation-facts-1
                       @ancestor-relation-facts-2
                       relevant-spec-facts)
                        
            ;; Deduplicate facts by fact_uid
            unique-facts (vals (reduce (fn [acc item]
                                         (if (:fact_uid item)
                                           (assoc acc (:fact_uid item) item)
                                           acc))
                                       {}
                                       all-facts))
                               
            ;; Update the list of role players and relations to include inherited ones
            all-role-players (distinct (concat 
                                       possible-kinds-of-role-players 
                                       (map :lh_object_uid @ancestor-player-facts)))
            all-relations (distinct (concat 
                                    requiring-kinds-of-relations 
                                    (map :lh_object_uid @ancestor-relation-facts-1)
                                    (map :lh_object_uid @ancestor-relation-facts-2)))]
        (merge base-model
               {:category "role"
                :possible-kinds-of-role-players all-role-players
                :requiring-kinds-of-relations all-relations
                :facts unique-facts}))
      (catch Exception e))))

;; --------------------------------------------------------------- IDNIVIDUAL --
