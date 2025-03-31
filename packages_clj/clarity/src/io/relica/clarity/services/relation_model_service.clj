(ns io.relica.clarity.services.relation-model-service
  (:require
   [clojure.tools.logging :as log]
   [clojure.core.async :as async :refer [go <!]]
   [io.relica.clarity.services.entity-model-service :as e-ms]
   [io.relica.common.io.archivist-client :as archivist]
   [io.relica.clarity.io.client-instances :refer [archivist-client]]
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
              ;; Get specialization hierarchy to find inheritance path
              specialization-response (<! (archivist/get-specialization-hierarchy 
                                          archivist-client 
                                          nil  ;; user-id is optional
                                          uid))
              specialization-facts (if (:success specialization-response)
                                     (:facts (:hierarchy specialization-response))
                                     [])
              
              ;; Get required roles using the inherited relation call
              response-1 (<! (archivist/get-inherited-relation
                            archivist-client
                            uid
                            4731))
              role-1-fact (first (:fact response-1))
              required-role-1 (when role-1-fact (:rh_object_uid role-1-fact))
              
              ;; Find which ancestor in the specialization hierarchy has the role-1 relation
              role-1-source-uid (when role-1-fact
                                  (let [ancestor-uids (map :lh_object_uid specialization-facts)]
                                    (first (filter #(= % (:lh_object_uid role-1-fact)) ancestor-uids))))
              
              ;; Get required role 2
              response-2 (<! (archivist/get-inherited-relation
                            archivist-client
                            uid
                            4733))
              role-2-fact (first (:fact response-2))
              required-role-2 (when role-2-fact (:rh_object_uid role-2-fact))
              
              ;; Find which ancestor in the specialization hierarchy has the role-2 relation
              role-2-source-uid (when role-2-fact
                                  (let [ancestor-uids (map :lh_object_uid specialization-facts)]
                                    (first (filter #(= % (:lh_object_uid role-2-fact)) ancestor-uids))))
              
              ;; Find the specific specialization facts that link from our target relation
              ;; to the ancestors that have the role relations
              relevant-spec-facts (filter (fn [fact]
                                           (or (and role-1-source-uid 
                                                    (not= role-1-source-uid uid)
                                                    (or (= (:lh_object_uid fact) role-1-source-uid)
                                                        (= (:rh_object_uid fact) role-1-source-uid)))
                                               (and role-2-source-uid
                                                    (not= role-2-source-uid uid)
                                                    (or (= (:lh_object_uid fact) role-2-source-uid)
                                                        (= (:rh_object_uid fact) role-2-source-uid)))))
                                         specialization-facts)
              
              ;; Collect all facts used to build this model
              all-facts (concat 
                        (get base-model :facts [])
                        (if role-1-fact [role-1-fact] [])
                        (if role-2-fact [role-2-fact] [])
                        relevant-spec-facts)
                        
              ;; Deduplicate facts by fact_uid
              unique-facts (vals (reduce (fn [acc item]
                                           (if (:fact_uid item)
                                             (assoc acc (:fact_uid item) item)
                                             acc))
                                         {}
                                         all-facts))
              ]
          (merge base-model
                 {:category "relation"
                  :required-kind-of-role-1 required-role-1
                  :required-kind-of-role-2 required-role-2
                  :facts unique-facts}
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

(comment

  (go (let[model (<! (retrieve-kind-of-relation-model 1146))]
        (println model)))

)
