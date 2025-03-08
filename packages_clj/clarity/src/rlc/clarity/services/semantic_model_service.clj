(ns rlc.clarity.services.semantic-model-service
  (:require [clojure.tools.logging :as log]
            [clojure.pprint :refer [pprint]]
            [clojure.core.async :refer [go <!]]
            [clojure.spec.alpha :as s]
            [rlc.clarity.handlers.base :as base]
            [rlc.clarity.handlers.physical-object :as po]
            [rlc.clarity.handlers.aspect :as aspect]
            [rlc.clarity.handlers.state :as state]
            [rlc.clarity.handlers.occurrence :as occurrence]
            [rlc.clarity.handlers.event :as event]
            [rlc.clarity.handlers.relation :as relation]
            [rlc.clarity.handlers.role :as role]
            [rlc.clarity.services.entity-model-service :as e-ms]
            [rlc.clarity.services.physical-object-model-service :as po-ms]
            [rlc.clarity.services.aspect-model-service :as asp-ms]
            [rlc.clarity.services.role-model-service :as rol-ms]
            [rlc.clarity.services.relation-model-service :as rel-ms]
            [rlc.clarity.services.occurrence-model-service :as occ-ms]
            [io.relica.common.io.archivist-client :as archivist]
            [rlc.clarity.io.archivist-api :as archivist-api]
            [rlc.clarity.io.client-instances :refer [archivist-client]]))

;; Category to namespace/spec mapping
(def category-to-spec
  {"physical object" :rlc.clarity.handlers.physical-object/physical-object
   "aspect" :rlc.clarity.handlers.aspect/aspect
   "role" :rlc.clarity.handlers.role/role-kind
   "relation" :rlc.clarity.handlers.relation/relation-kind
   "occurrence" :rlc.clarity.handlers.occurrence/occurrence
   "state" :rlc.clarity.handlers.state/state})

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
          ()
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
