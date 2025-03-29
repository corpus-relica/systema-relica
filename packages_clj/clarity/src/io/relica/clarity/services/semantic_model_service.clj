(ns io.relica.clarity.services.semantic-model-service
  (:require [clojure.tools.logging :as log]
            [clojure.pprint :refer [pprint]]
            [clojure.core.async :refer [go <!]]
            [clojure.spec.alpha :as s]
            [io.relica.clarity.handlers.base :as base]
            [io.relica.clarity.handlers.physical-object :as po]
            [io.relica.clarity.handlers.aspect :as aspect]
            [io.relica.clarity.handlers.state :as state]
            [io.relica.clarity.handlers.occurrence :as occurrence]
            [io.relica.clarity.handlers.event :as event]
            [io.relica.clarity.handlers.relation :as relation]
            [io.relica.clarity.handlers.role :as role]
            [io.relica.clarity.services.entity-model-service :as e-ms]
            [io.relica.clarity.services.physical-object-model-service :as po-ms]
            [io.relica.clarity.services.aspect-model-service :as asp-ms]
            [io.relica.clarity.services.role-model-service :as rol-ms]
            [io.relica.clarity.services.relation-model-service :as rel-ms]
            [io.relica.clarity.services.occurrence-model-service :as occ-ms]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.clarity.io.archivist-api :as archivist-api]
            [io.relica.clarity.io.client-instances :refer [archivist-client]]))

;; Category to namespace/spec mapping
(def category-to-spec
  {"physical object" :io.relica.clarity.handlers.physical-object/physical-object
   "aspect" :io.relica.clarity.handlers.aspect/aspect
   "role" :io.relica.clarity.handlers.role/role-kind
   "relation" :io.relica.clarity.handlers.relation/relation-kind
   "occurrence" :io.relica.clarity.handlers.occurrence/occurrence
   "state" :io.relica.clarity.handlers.state/state})

;; ;; Relation UID to semantic relationship mapping
(def relation-uid-to-semantic
  {1146 :specialization-of
   1225 :classification
   1981 :synonym
   1986 :inverse
   4731 :required-role-1
   4733 :required-role-2
   4714 :possible-role
   5025 :value
   5644 :involves})


;; ;; Validation helper
;; (defn validate-with-spec
;;   "Validate data against a spec and return result"
;;   [spec data]
;;   (if (s/valid? spec data)
;;     {:valid true :data data}
;;     {:valid false
;;      :data data
;;      :explanation (s/explain-str spec data)}))

;; ;; Core semantic model functions
;; (defn entity-nature
;;   "Determine the nature (kind or individual) from entity type"
;;   [type]
;;   (case type
;;     "kind" :kind
;;     "individual" :individual
;;     :individual)) ; default


;; (defn unary-foobarbaz [uid rel-type-uid]
;;   (go
;;     (try
;;       (let [response (<! (archivist/get-related-on-uid-subtype-cone
;;                           archivist-client uid rel-type-uid))
;;             fact (first (:facts response))
;;             rh-uid (:rh_object_uid fact)
;;             rh-name (:rh_object_name fact)]
;;         (if (:success response)
;;           {:success true
;;            :uid rh-uid
;;            :name rh-name}
;;           {}))
;;       (catch Exception e
;;         (log/error e "Failed to get related facts by relation")
;;         {:success false}))))


;; ----------------------------------------------------------------------




;; The main semantic model retrieval function
(defn retrieve-semantic-model
  "Retrieve and transform an entity to its semantic model representation"
  [uid]
  (go
    (try

      (println "UID:" uid)
      ;; 1. Get entity type and category directly
      (let [entity-type (<! (archivist-api/get-entity-type uid))
            _ (log/info "Entity type:" entity-type)

            category (<! (archivist-api/get-entity-category uid))
            _ (log/info "Entity category:" category)

            ;; 2. Get basic facts directly
            ;; definition-facts (<! (get-definitive-facts uid))
            ;; all-related-facts (<! (get-all-related-facts uid))
            ]
        (case entity-type
          "kind"
          (case category
            "physical object" (<! (po-ms/retrieve-kind-of-physical-object-model uid))
            "aspect" (<! (asp-ms/retrieve-kind-of-aspect-model uid))
            "role" (<! (rol-ms/retrieve-kind-of-role-model uid))
            "relation" (<! (rel-ms/retrieve-kind-of-relation-model uid))
            "occurrence" (<! (occ-ms/retrieve-kind-of-occurrence-model uid))
            ;; "state" (retrieve-kind-of-state-model uid)
            "anything" (<! (e-ms/retrieve-kind-of-entity-model uid))
            {})
          "individual"
          (case category
            "physical object" (<! (po-ms/retrieve-individual-physical-object-model uid))
            "aspect" (<! (asp-ms/retrieve-individual-aspect-model uid))
            ;; "role" (<! (rol-ms/retrieve-individual-of-role-model uid)) INTENTIONALLY OMITTED
            "relation" (<! (rel-ms/retrieve-individual-relation-model uid))
            "occurrence" (<! (occ-ms/retrieve-individual-occurrence-model uid))
            ;; "state" (retrieve-individual-of-state-model uid) TODO
            ;; "anything" (<! (e-ms/retrieve-individual-of-entity-model uid))
            {})
          {}))

      (catch Exception e
        (log/error "Error retrieving semantic model for UID:" uid e)
        {:valid false :error (str "Error: " (.getMessage e)) :uid uid})

      )))

(comment

  (go
    (let [uid 1225
          res (<! (retrieve-semantic-model uid))]
      (pprint res)
      ))


  )
