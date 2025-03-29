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
            possible-kinds-of-role-players (<! (retrieve-possible-kinds-of-role-players uid))
            requiring-kinds-of-relations (<! (retrieve-requiring-kinds-of-relations uid))]
        (merge base-model
               {:category "role"
                :possible-kinds-of-role-players
                possible-kinds-of-role-players
                :requiring-kinds-of-relations
                requiring-kinds-of-relations}))
      (catch Exception e))))

;; --------------------------------------------------------------- IDNIVIDUAL --
