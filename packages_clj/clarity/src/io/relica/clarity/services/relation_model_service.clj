(ns io.relica.clarity.services.relation-model-service
  (:require [clojure.tools.logging :as log]
            [clojure.pprint :refer [pprint]]
            [clojure.core.async :refer [go <!]]
            [clojure.spec.alpha :as s]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.clarity.io.client-instances :refer [archivist-client]]
            [io.relica.clarity.services.entity-model-service :as e-ms]))

;; ------------------------------------------------------------------ HELPERS --

(defn retrieve-required-kind-of-role-1
  "Retrieve required kind of role 1 for a relation kind"
  [uid]
  (go
    (try
      (let [response (<! (archivist/get-inherited-relation
                         archivist-client
                         uid
                         4731))
            role-fact (first (:fact response))
            role-uid (when role-fact (:rh_object_uid role-fact))]
        (if (:success response)
          role-uid
          nil))
      (catch Exception _
        (log/error "Failed to retrieve required kind of role 1")
        nil))))

(defn retrieve-required-kind-of-role-2
  "Retrieve required kind of role 2 for a relation kind"
  [uid]
  (go
    (try
      (let [response (<! (archivist/get-inherited-relation
                         archivist-client
                         uid
                         4733))
            role-fact (first (:fact response))
            role-uid (when role-fact (:rh_object_uid role-fact))]
        (if (:success response)
          role-uid
          nil))
      (catch Exception _
        (log/error "Failed to retrieve required kind of role 2")
        nil))))

;; --------------------------------------------------------------------- KIND --

(defn retrieve-kind-of-relation-model
  "Retrieve and transform a relation entity to its semantic model representation"
  [uid]
  (go
    (try
      (if (= uid 73000)
        {:uid 73000
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
              ;; Build a map of the complete inheritance chain
              inheritance-map (reduce (fn [acc fact]
                                       (assoc acc (:lh_object_uid fact) 
                                              (conj (get acc (:lh_object_uid fact) #{}) 
                                                    (:rh_object_uid fact))))
                                     {}
                                     specialization-facts)
              ;; Function to find all ancestors in the inheritance chain
              ;; Using letfn for proper recursive function definition
              ancestors (letfn [(find-all-ancestors [uid visited]
                                 (if (contains? visited uid)
                                   visited
                                   (let [parents (get inheritance-map uid #{})]
                                     (reduce (fn [acc parent]
                                              (find-all-ancestors parent acc))
                                            (conj visited uid)
                                            parents))))]
                        (find-all-ancestors uid #{}))
              ;; Include all specialization facts that are part of the lineage chain
              ;; but prioritize those that connect to sources of inherited properties
              relevant-spec-facts (filter (fn [fact]
                                          (and (= (:rel_type_uid fact) 1146)
                                               (or 
                                                ;; Include facts directly connecting to role sources
                                                (and role-1-source-uid 
                                                     (not= role-1-source-uid uid)
                                                     (or (= (:lh_object_uid fact) role-1-source-uid)
                                                         (= (:rh_object_uid fact) role-1-source-uid)))
                                                (and role-2-source-uid
                                                     (not= role-2-source-uid uid)
                                                     (or (= (:lh_object_uid fact) role-2-source-uid)
                                                         (= (:rh_object_uid fact) role-2-source-uid)))
                                                ;; Include facts that form the inheritance chain
                                                (and (contains? ancestors (:lh_object_uid fact))
                                                     (contains? ancestors (:rh_object_uid fact))))))
                                         specialization-facts)
              all-facts (concat 
                        (get base-model :facts [])
                        (when role-1-fact [role-1-fact])
                        (when role-2-fact [role-2-fact])
                        relevant-spec-facts)]
          (merge base-model
                 {:category "relation"
                  :required-role-1 required-role-1
                  :required-role-2 required-role-2
                  :facts all-facts})))
      (catch Exception _))))

;; --------------------------------------------------------------- IDNIVIDUAL --

(defn retrieve-individual-relation-model
  "Retrieve and transform a physical object entity to its semantic model representation"
  [uid]
  (go
    (log/info "Retrieving individual relation model" uid)
    (try
      (let [base-model (<! (e-ms/retrieve-individual-entity-model uid))]
        (merge base-model
               {:category "relation"}))
      (catch Exception _))))

(comment

  (go (let[model (<! (retrieve-kind-of-relation-model 1146))]
        (println model)))

)
