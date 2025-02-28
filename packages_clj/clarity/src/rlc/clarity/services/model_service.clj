(ns rlc.clarity.services.model-service
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [go <!]]
            [io.relica.common.io.archivist-client :as archivist]
            [rlc.clarity.io.client-instances :refer [archivist-client]]))

;; Constants from the TypeScript version
(def phys-obj-uid 730044)
(def aspect-uid 790229)
(def role-uid 160170)
(def relation-uid 2850)
(def occurrence-uid 193671)

(def physical-object "physical object")
(def aspect "aspect")
(def role "role")
(def relation "relation")
(def occurrence "occurrence")

;; Helper functions
;; (defn get-entity-type
;;   "Get the entity type for a given UID"
;;   [uid]
;;   (client/make-request "/retrieveEntity/type"
;;                       {:query-params {:uid uid}
;;                        :throw-exceptions false}))


(defn get-category [uid]
  (go
    (try
      (let [response (<! (archivist/get-entity-category
                          archivist-client
                          uid))]
        (log/info (str "Response from get-entity-category: " response))
        (if (:success response)
          (:category response) ;; (success-response (:results response))
          (or (:error response) "Unknown error")))
      (catch Exception e
        (tap> (str "Error in text search handler: " e))
        "Failed to execute text search"))))

(defn retrieve-all-facts
  "Retrieve all facts for a given UID"
  [uid]
  (go
    (try
      (let [response (<! (archivist/get-all-related
                          archivist-client
                          uid))]
        (log/info (str "Response from get-all-facts: " response))
        (if (:success response)
          (:facts response)
          (or (:error response) "Unknown error")))
      (catch Exception e
        (tap> (str "Error in text search handler: " e))
        "Failed to execute text search"))))


(defn get-definitive-facts
  "Get definitive facts for a given UID"
  [uid]
  (go
    (try
      (let [response (<! (archivist/get-definitive-facts
                          archivist-client
                          uid))]
        (log/info (str "Response from get-definitive-facts: " response))
        (if (:success response)
          (:facts response)
          (or (:error response) "Unknown error")))
      (catch Exception e
        (tap> (str "Error in text search handler: " e))
        "Failed to execute text search"))))

  ;; (client/make-request "/fact/definitiveFacts"
  ;;                     {:query-params {:uid uid}
  ;;                      :throw-exceptions false}))

;; (defn get-related-on-uid-subtype-cone
;;   "Get related entities on UID subtype cone"
;;   [lh-object-uid rel-type-uid]
;;   (client/make-request "/fact/relatedOnUIDSubtypeCone"
;;                       {:query-params {:lh_object_uid lh-object-uid
;;                                      :rel_type_uid rel-type-uid}
;;                        :throw-exceptions false}))

;; Model retrieval functions

(defn get-physical-object-model
  "Get physical object model for a given UID"
  [uid]
  {:aspects [] :roles [] :components [] :connections []})

(defn get-aspect-model
  "Get aspect model for a given UID"
  [uid]
  {:possessors []})

(defn get-role-model
  "Get role model for a given UID"
  [uid]
  {:role-players []})

(defn get-relation-model
  "Get relation model for a given UID"
  [uid]
  {:role-player1 nil :role-player2 nil})

(defn get-occurrence-model
  "Get occurrence model for a given UID"
  [uid]
  {:aspects [] :involved []})

(defn retrieve-kind-model
  "Retrieve kind model for a given UID"
  [uid]
  (log/info "Retrieving kind model for UID:" uid)
  (go
    (let [category (<! (get-category uid))
          _ (log/info  (str "Category:" category))
          facts (<! (retrieve-all-facts uid))
          definitive-facts (<! (get-definitive-facts uid))
          ;; specialization (get-related-on-uid-subtype-cone uid 1146)
          ;; classification (get-related-on-uid-subtype-cone uid 1225)
          ;; synonyms (get-related-on-uid-subtype-cone uid 1981)
          ;; inverses (get-related-on-uid-subtype-cone uid 1986)
          ;; req-role1 (get-related-on-uid-subtype-cone uid 4731)
          ;; req-role2 (get-related-on-uid-subtype-cone uid 4733)
          ;; poss-roles (get-related-on-uid-subtype-cone uid 4714)
          base-model (case category
                       "physical object" (get-physical-object-model uid)
                       "aspect" (get-aspect-model uid)
                       "role" (get-role-model uid)
                       "relation" (get-relation-model uid)
                       "occurrence" (get-occurrence-model uid)
                       {})
          ]
      (log/info "category:" category)
      (log/info "Base model:" base-model)
      (log/info "Facts:" facts)
      ;; (when (seq definitive-facts)
      (merge base-model
             {:uid uid
    ;;           :collection {:uid (get-in definitive-facts [0 :collection_uid])
    ;;                       :name (get-in definitive-facts [0 :collection_name])}
    ;;           :name (get-in definitive-facts [0 :lh_object_name])
              :type "kind"
              :category category
              :definition (mapv (fn [x]
                                 {:fact_uid (:fact_uid x)
                                  :partial_definition (:partial_definition x)
                                  :full_definition (:full_definition x)})
                               definitive-facts)
              :facts facts
    ;;           ;; Relation UIDs as keys
    ;;           1146 (mapv #(get % :rh_object_uid) specialization)
    ;;           1225 (mapv #(get % :rh_object_uid) classification)
    ;;           1981 (mapv #(get % :lh_object_name) synonyms)
    ;;           1986 (mapv #(get % :lh_object_name) inverses)
    ;;           4731 (mapv #(get % :rh_object_uid) req-role1)
    ;;           4733 (mapv #(get % :rh_object_uid) req-role2)
    ;;           4714 (mapv #(get % :rh_object_uid) poss-roles)
              }
             )
    ;;           )
    )))

(defn retrieve-individual-model
  "Retrieve individual model for a given UID"
  [uid]
  (log/info "Retrieving individual model for UID:" uid)
  (go
    (let [category (<! (get-category uid))
          facts (<! (retrieve-all-facts uid))
          definitive-facts (<! (get-definitive-facts uid))
    ;;     classification (get-related-on-uid-subtype-cone uid 1225)
        ]
    ;; (when (and (seq classification) (seq definitive-facts))
      (let [base-obj {:uid uid
    ;;                  :name (get-in classification [0 :lh_object_name])
                      :collection {:uid 0 :name ""}
    ;;                  :collection {:uid (get-in definitive-facts [0 :collection_uid])
    ;;                              :name (get-in definitive-facts [0 :collection_name])}
    ;;                  1225 (mapv #(get % :rh_object_uid) classification)
                     :type "individual"
                     :category category
                     ;; :definition ["is an individual"]
                     :definition (mapv (fn [x]
                                        {:fact_uid (:fact_uid x)
                                         :partial_definition (:partial_definition x)
                                         :full_definition (:full_definition x)})
                                      definitive-facts)
                     :facts facts
                     }
    ;;         value (get-related-on-uid-subtype-cone uid 5025)
                    ] ; 'has on scale a value equal to'
    ;;     (if (seq value)
    ;;       (let [val-fact (first value)
    ;;             val (Integer/parseInt (:rh_object_name val-fact))
    ;;             uom {:uid (:uom_uid val-fact) :name (:uom_name val-fact)}]
    ;;         (assoc base-obj :value {:quant val :uom uom}))
        base-obj
        )
    ;;       )
      )))

;; (defn retrieve-qualification-model
;;   "Retrieve qualification model for a given UID"
;;   [uid]
;;   (log/info "Retrieving qualification model for UID:" uid)
;;   (let [category (get-category uid)
;;         facts (retrieve-all-facts uid)
;;         definitive-facts (get-definitive-facts uid)]
;;     (when (seq definitive-facts)
;;       {:name (get-in definitive-facts [0 :lh_object_name])
;;        :uid uid
;;        :type "qualification"
;;        :category category
;;        :facts facts})))

;; (defn retrieve-model
;;   "Retrieve model for a given UID"
;;   [uid]
;;   (log/info "Retrieving model for UID:" uid)
;;   (let [type (get-entity-type uid)]
;;     (log/debug "Entity type:" type)
;;     (cond
;;       (= type "kind") (retrieve-kind-model uid)
;;       (= type "individual") (retrieve-individual-model uid)
;;       (= type "qualification") (retrieve-qualification-model uid)
;;       (= uid 730000) {:uid uid
;;                      :name "anything"
;;                      :type "kind"
;;                      :category "anything"
;;                      :definition "is an anything"
;;                      :facts []
;;                      1146 []
;;                      1225 []
;;                      1981 []
;;                      1986 []
;;                      4731 []
;;                      4733 []
;;                      4714 []}
;;       :else (do
;;               (log/error "Unknown entity type for UID:" uid)
;;               nil))))

;; (defn throttle-promises
;;   "Execute a sequence of functions with a limit on concurrent executions"
;;   [funcs limit]
;;   (let [results (atom [])
;;         executing (atom [])
;;         promise-all (promise)]
;;     (doseq [func funcs]
;;       (let [p (future (func))]
;;         (swap! results conj p)
;;         (when (<= limit (count funcs))
;;           (let [e (future
;;                     (deref p)
;;                     (swap! executing #(remove #{e} %)))]
;;             (swap! executing conj e)
;;             (when (>= (count @executing) limit)
;;               (deref (first @executing)))))))
;;     (future
;;       (doseq [r @results]
;;         (deref r))
;;       (deliver promise-all @results))
;;     @promise-all))

;; (defn retrieve-models
;;   "Retrieve models for a sequence of UIDs"
;;   [uids]
;;   (log/info "Retrieving models for UIDs:" uids)
;;   (let [funcs (map (fn [uid] #(retrieve-model uid)) uids)]
;;     (throttle-promises funcs 5)))

;; (defn update-definition
;;   "Update definition for a fact"
;;   [fact-uid partial-definition full-definition]
;;   (log/info "Updating definition for fact:" fact-uid)
;;   (client/make-put-request "/submission/definition"
;;                           {:fact_uid fact-uid
;;                            :partial_definition partial-definition
;;                            :full_definition full-definition}
;;                           {:throw-exceptions false}))

;; (defn update-collection
;;   "Update collection for a fact"
;;   [fact-uid collection-uid collection-name]
;;   (log/info "Updating collection for fact:" fact-uid)
;;   (client/make-put-request "/submission/collection"
;;                           {:fact_uid fact-uid
;;                            :collection_uid collection-uid
;;                            :collection_name collection-name}
;;                           {:throw-exceptions false}))

;; (defn update-name
;;   "Update name for a fact"
;;   [uid name]
;;   (log/info "Updating name for fact:" uid)
;;   (client/make-put-request "/submission/name"
;;                           {:fact_uid uid
;;                            :name name}
;;                           {:throw-exceptions false}))

;; Service creation
(defn create-model-service
  "Create a new model service"
  []
   {
  ;; :retrieve-model retrieve-model
  ;;  :retrieve-models retrieve-models
   :retrieve-kind-model retrieve-kind-model
   :retrieve-individual-model retrieve-individual-model
   ;; :retrieve-qualification-model retrieve-qualification-model
   ;; :update-definition update-definition
   ;; :update-collection update-collection
   ;;:update-name update-name
   })
