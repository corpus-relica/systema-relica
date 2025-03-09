(ns rlc.clarity.services.relation-model-service
  (:require
   [clojure.tools.logging :as log]
   [clojure.core.async :as async :refer [go <!]]
   [rlc.clarity.services.entity-model-service :as e-ms]
   [io.relica.common.io.archivist-client :as archivist]
   [rlc.clarity.io.client-instances :refer [archivist-client]]
   ))

;; ------------------------------------------------------------------ HELPERS --

(defn retrieve-required-kind-of-role-1
  "Retrieve required kind of role 1 for a relation entity"
  [uid]
  (go
    (try
      (let [response (<! (archivist/get-inherited-relation
                          archivist-client
                          uid
                          4731))
            fact (first (:fact response))
            role-uid (:rh_object_uid fact)
            role-name (:rh_object_name fact)]
        ;; (println "Response:" response)
        (if (:success response)
          role-uid
          []))
      (catch Exception e
        (log/error e "Failed to retrieve required kind of roles")
        {}))))

(defn retrieve-required-kind-of-role-2
  "Retrieve required kind of role 2 for a relation entity"
  [uid]
  (go
    (try
      (let [response (<! (archivist/get-inherited-relation
                          archivist-client
                          uid
                          4733))
            fact (first (:fact response))
            role-uid (:rh_object_uid fact)
            role-name (:rh_object_name fact)]
        ;; (println "Response:" response)
        (if (:success response)
          role-uid
          []))
      (catch Exception e
        (log/error e "Failed to retrieve required kind of roles")
        []))))

;; --------------------------------------------------------------------- KIND --

(defn retrieve-kind-of-relation-model
  "Retrieve and transform a relation entity to its semantic model representation"
  [uid]
  (go
    (try
      (if (= uid 730000)
        {:uid uid
         :name "anything"
         :nature :kind
         :definitions ["..."]
         :supertypes []}
        (let [base-model (<! (e-ms/retrieve-kind-of-entity-model uid))
              required-role-1 (<! (retrieve-required-kind-of-role-1 uid))
              required-role-2 (<! (retrieve-required-kind-of-role-2 uid))
              ]
          (merge base-model
                 {:category "relation"
                  :required-kind-of-role-1 required-role-1
                  :required-kind-of-role-2 required-role-2}
                 )))
      (catch Exception e))))

;; --------------------------------------------------------------- IDNIVIDUAL --

(defn retrieve-individual-relation-model
  "Retrieve and transform a physical object entity to its semantic model representation"
  [uid]
  (go
    (log/info "Retrieving individual relation model" uid)
    (try
      (let [base-model (<! (e-ms/retrieve-individual-entity-model uid))
            ]
        (merge base-model
               {:category "relation"}
               ;;:rh_object
               ;;:lh_object
               ))
      (catch Exception e))))
