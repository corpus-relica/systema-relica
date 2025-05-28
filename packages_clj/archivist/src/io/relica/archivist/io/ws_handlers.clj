(ns io.relica.archivist.io.ws-handlers
  (:require [clojure.tools.logging :as log]
            [clojure.pprint :as pp]
            [clojure.core.async :as async :refer [<! go chan]]
            [io.relica.archivist.basis.relation :as relation]
            [io.relica.archivist.core.gellish-base :as gellish-base]
            [io.relica.archivist.core.kind :as kind]
            [io.relica.archivist.core.fact :as fact]
            [io.relica.archivist.core.definition :as definition]
            [io.relica.archivist.core.linearization :as linearization]
            [io.relica.archivist.core.entity-retrieval :as entity]
            [io.relica.archivist.core.general-search :as general-search]
            [io.relica.archivist.core.submission :as submission]
            [io.relica.common.services.cache-service :as cache]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.common.utils.response :as response]))


;; GRAPH SERVICE

(response/def-ws-handler :archivist.graph/execute-query
  (let [result (<! (graph/exec-query graph/graph-service (:query ?data) (:params ?data)))]
    (respond-success result))
  (catch Exception e
    (log/error e "Failed to execute query")
    (respond-error :query-execution-failed
                   "Failed to execute query"
                   {:exception (str e)})))

;; DEFINITION OPERATIONS

(response/def-ws-handler :archivist.definition/get
  (let [result (<! (definition/get-definition (:uid ?data)))]
    (println "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    (println result)
    (respond-success {:payload result}))
  (catch Exception e
    (log/error e "Failed to get definition")
    (respond-error :query-execution-failed
                   "Failed to get definition"
                   {:exception (str e)})))

;; (response/def-ws-handler :archivist.definition/create
;; (response/def-ws-handler :archivist.definition/update

;; FACT SERVICE

(response/def-ws-handler :archivist.fact/batch-get
  (let [result (fact/get-batch ?data)]
    (println "Facts: " (:facts result))
    (respond-success (:facts result)))
  (catch Exception e
    (log/error e "Failed to get batch facts")
    (respond-error :database-error
                   "Failed to get batch facts"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/count
  (let [result (fact/get-count)]
    (respond-success {:count result}))
  (catch Exception e
    (log/error e "Failed to count facts")
    (respond-error :database-error
                   "Failed to count facts"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/all-related-get
  (let [_ (println ?data)
        facts (<! (fact/get-all-related-facts (:uid ?data)))]
    (println "Facts: " facts)
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get all related facts")
    (respond-error :database-error
                   "Failed to get all related facts"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/definitive-get
  (println "Getting definitive facts")
  (println ?data)
  (let [facts (gellish-base/get-definitive-facts (:uid ?data))]
    (println "Facts: " facts)
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get definitive facts")
    (respond-error :database-error "Failed to get definitive facts"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/classification-get
  (println "!!!!!!!!!!!!!!!!!!!!!!!! --- Bon Jovi: " ?data)
  (let [facts (gellish-base/get-classification-fact (:uid ?data))]
    (println "!!!!!!!!!!!!!!!!!!!!!!!! --- Facts: " facts)
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get classification fact")
    (respond-error :database-error "Failed to get classification fact"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/relating-entities-get
  (let [facts (<! (fact/get-facts-relating-entities (:uid1 ?data) (:uid2 ?data)))]
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get facts relating entities")
    (respond-error :database-error "Failed to get facts relating entities"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/related-on-uid-subtype-cone-get
  (let [facts (<! (fact/get-related-on-uid-subtype-cone
                   (:lh-object-uid ?data)
                   (:rel-type-uid ?data)))]
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get related on uid subtype cone facts")
    (respond-error :database-error "Failed to get related on uid subtype cone facts"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/inherited-relation-get
  (let [fact (<! (fact/get-inherited-relation (:uid ?data) (:rel-type-uid ?data)))]
    (respond-success {:fact fact}))
  (catch Exception e
    (log/error e "Failed to get inherited relation")
    (respond-error :database-error "Failed to get inherited relation"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/related-to-get
  (let [facts (<! (fact/get-related-to (:uid ?data) (:rel-type-uid ?data)))]
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get related to facts")
    (respond-error :database-error "Failed to get related to facts"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/related-to-get-subtype-cone
  (let [facts (<! (fact/get-related-to-subtype-cone (:uid ?data) (:rel-type-uid ?data)))]
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get related to subtypes cone facts")
    (respond-error :database-error "Failed to get related to subtypes cone facts"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/recursive-relations-get
  (let [facts (<! (fact/get-recursive-relations (:uid ?data) (:rel-type-uid ?data) 10))]
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get recursive relations")
    (respond-error :database-error "Failed to get recursive relations"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/recursive-relations-get-to
  (let [facts (<! (fact/get-recursive-relations-to (:uid ?data) (:rel-type-uid ?data) 10))]
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get recursive relations")
    (respond-error :database-error "Failed to get recursive relations"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/classified-get
  (let [facts (<! (fact/get-classified (:uid ?data) (or (:recursive ?data) false)))]
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get classified facts")
    (respond-error :database-error "Failed to get classified facts"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/subtypes-get
  (let [facts (fact/get-subtypes (:uid ?data))]
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get subtypes facts")
    (respond-error :database-error "Failed to get subtypes facts"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/subtypes-get-cone
  (let [facts (<! (fact/get-subtypes-cone (:uid ?data)))]
    (tap> "______________________________________________________")
    (tap> facts)
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get subtypes cone facts")
    (respond-error :database-error "Failed to get subtypes cone facts"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/core-sample-get
  (let [results (<! (fact/get-core-sample
                     (:uid ?data)
                     (:rel-type-uid ?data)))]
    (respond-success {:results results}))
  (catch Exception e
    (log/error e "Failed to get core sample")
    (respond-error :database-error "Failed to get core sample"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/core-sample-get-rh
  (let [results (<! (fact/get-core-sample-rh
                     (:uid ?data)
                     (:rel-type-uid ?data)))]
    (respond-success {:results results}))
  (catch Exception e
    (log/error e "Failed to get core sample")
    (respond-error :database-error "Failed to get core sample"
                   {:exception (str e)})))

;; FACT CRUD OPERATIONS

(response/def-ws-handler :archivist.fact/create
  (let [result (fact/create-fact ?data)]
    (if (:success result)
      (do
        ;; Update the lineage cache
        (when-let [lh-uid (get-in result [:fact :lh_object_uid])]
          (<! (linearization/calculate-lineage lh-uid))
          (cache/clear-descendants cache/cache-service))
        (respond-success {:fact (:fact result)}))
      (respond-error :database-error
                     (or (:message result) "Failed to create fact")
                     {:details result})))
  (catch Exception e
    (log/error e "Failed to create fact")
    (respond-error :database-error
                   "Failed to create fact"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/update
  (let [result (fact/update-fact ?data)]
    (if (:success result)
      (respond-success {:fact (:fact result)})
      (respond-error :database-error
                     (or (:message result) "Failed to update fact")
                     {:details result})))
  (catch Exception e
    (log/error e "Failed to update fact")
    (respond-error :database-error
                   "Failed to update fact"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/delete
  (if-let [uid (:uid ?data)]
    (try
      (let [result (fact/delete-fact uid)]
        (respond-success {:result "success" :uid uid}))
      (catch Exception e
        (log/error e "Failed to delete fact")
        (respond-error :database-error
                       "Failed to delete fact"
                       {:exception (str e)}))))
  (catch Exception e
    (log/error e "Failed to delete fact")
    (respond-error :missing-required-field
                   "Missing UID in request data"
                   {:field "uid"})))

(response/def-ws-handler :archivist.fact/batch-create
  (let [result (fact/create-facts ?data)]
    (if (:success result)
      (do
        ;; Update the lineage cache for all facts
        (doseq [fact (:facts result)]
          (when-let [lh-uid (:lh_object_uid fact)]
            (<! (linearization/calculate-lineage lh-uid))))
        (cache/clear-descendants cache/cache-service)
        (respond-success {:facts (:facts result)}))
      (respond-error :database-error
                     (or (:message result) "Failed to create facts")
                     {:details result})))
  (catch Exception e
    (log/error e "Failed to create facts")
    (respond-error :database-error
                   "Failed to create facts"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.fact/batch-delete
  (if-let [uids (:uids ?data)]
    (try
      (let [result (fact/delete-facts uids)]
        (respond-success {:result "success" :uids uids}))
      (catch Exception e
        (log/error e "Failed to delete facts")
        (respond-error :database-error
                       "Failed to delete facts"
                       {:exception (str e)}))))
  (catch Exception e
    (log/error e "Failed to batch-delete facts")
    (respond-error :missing-required-field
                   "Missing UIDs in request data"
                   {:field "uids"})))

;; SUBMISSION OPERATIONS

(response/def-ws-handler :archivist.submission/update-definition
  (let [result (submission/update-definition ?data)]
    (if (:success result)
      (respond-success {:result (:result result)})
      (respond-error :database-error
                     (or (:message result) "Failed to update definition")
                     {:details result})))
  (catch Exception e
    (log/error e "Failed to update definition")
    (respond-error :database-error
                   "Failed to update definition"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.submission/update-collection
  (let [result (submission/update-collection ?data)]
    (if (:success result)
      (respond-success {:result (:result result)})
      (respond-error :database-error
                     (or (:message result) "Failed to update collection")
                     {:details result})))
  (catch Exception e
    (log/error e "Failed to update collection")
    (respond-error :database-error
                   "Failed to update collection"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.submission/update-name
  (let [result (submission/update-name ?data)]
    (if (:success result)
      (respond-success {:result (:result result)})
      (respond-error :database-error
                     (or (:message result) "Failed to update name")
                     {:details result})))
  (catch Exception e
    (log/error e "Failed to update name")
    (respond-error :database-error
                   "Failed to update name"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.submission/blanket-rename
  (let [result (submission/blanket-rename ?data)]
    (if (:success result)
      (respond-success {:result (:result result)})
      (respond-error :database-error
                     (or (:message result) "Failed to blanket rename")
                     {:details result})))
  (catch Exception e
    (log/error e "Failed to blanket rename")
    (respond-error :database-error
                   "Failed to blanket rename"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.submission/add-synonym
  (let [result (submission/add-synonym ?data)]
    (if (:success result)
      (respond-success {:uid (:uid result) :synonym (:synonym result)})
      (respond-error :database-error
                     (or (:message result) "Failed to add synonym")
                     {:details result})))
  (catch Exception e
    (log/error e "Failed to add synonym")
    (respond-error :database-error
                   "Failed to add synonym"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.submission/create-date
  (let [result (submission/submit-date ?data)]
    (if (:success result)
      (respond-success {:fact (:fact result)})
      (respond-error :database-error
                     (or (:message result) "Failed to create date")
                     {:details result})))
  (catch Exception e
    (log/error e "Failed to create date")
    (respond-error :database-error
                   "Failed to create date"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.entity/batch-resolve
  (let [result (gellish-base/get-entities (:uids ?data))]
    (respond-success {:resolved true :data result}))
  (catch Exception e
    (log/error e "Failed to batch resolve entities")
    (respond-error :database-error "Failed to batch resolve entities"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.entity/category-get
  (let [category (gellish-base/get-entity-category (:uid ?data))]
    (respond-success {:category category}))
  (catch Exception e
    (log/error e "Failed to get entity category")
    (respond-error :database-error "Failed to get entity category"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.entity/collections-get
  (let [collections (<! (entity/get-collections))]
    (respond-success {:collections collections}))
  (catch Exception e
    (log/error e "Failed to get collections")
    (respond-error :database-error "Failed to get collections"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.entity/type-get
  (let [entity-type (<! (entity/get-entity-type (:uid ?data)))]
    (if entity-type
      (respond-success {:type entity-type})
      (respond-error :resource-not-found "Entity type not found" {:uid (:uid ?data)})))
  (catch Exception e
    (log/error e "Failed to get entity type")
    (respond-error :database-error "Failed to get entity type"
                   {:exception (str e)})))

;; KIND SERVICE

(response/def-ws-handler :archivist.kind/list
  (println ?data)
  (let [result (kind/get-list ?data)]
    ;; result : {:facts :total}
    (respond-success result))
  (catch Exception e
    (tap> {:event :websocket/sending-kinds-list-response
           :error e})
    (respond-error :database-error "Failed to get kind list"
                   {:exception (str e)})))

;; SEARCH SERVICE

(response/def-ws-handler :archivist.search/text
  (let [{:keys [searchTerm collectionUID page pageSize filter exactMatch]
         :or {page 1 pageSize 10 exactMatch false}} ?data
        results (<! (general-search/get-text-search
                     searchTerm
                     collectionUID
                     page
                     pageSize
                     filter
                     exactMatch))]
    (respond-success {:results results}))
  (catch Exception e
    (log/error e "Failed to execute text search")
    (respond-error :database-error "Failed to execute text search"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.search/uid
  (let [{:keys [searchUID collectionUID page pageSize filter]
         :or {page 1 pageSize 10}} ?data
        _ (println "UID Search Data: " ?data)
        results (<! (general-search/get-uid-search
                     (if (string? searchUID)
                       (Integer/parseInt searchUID)
                       searchUID)
                     collectionUID
                     page
                     pageSize
                     filter))]
    (respond-success {:results results}))
  (catch Exception e
    (log/error e "Failed to execute text search")
    (respond-error :database-error "Failed to execute text search"
                   {:exception (str e)})))

;; SPECIALIZATION

(response/def-ws-handler :archivist.specialization/fact-get
  (let [facts (gellish-base/get-specialization-fact (:uid ?data))]
    (respond-success {:facts facts}))
  (catch Exception e
    (log/error e "Failed to get specialization fact")
    (respond-error :database-error "Failed to get specialization fact"
                   {:exception (str e)})))

(response/def-ws-handler :archivist.specialization/hierarchy-get
  (let [hierarchy (gellish-base/get-specialization-hierarchy (:uid ?data))]
    (respond-success {:facts (:facts hierarchy)
                      :concepts (:concepts hierarchy)}))
  (catch Exception e
    (log/error e "Failed to get specialization hierarchy")
    (respond-error :database-error "Failed to get specialization hierarchy"
                   {:exception (str e)})))

;; LINEAGE SERVICE

(response/def-ws-handler :archivist.lineage/get
  (let [uid (:uid ?data)]
    (if (nil? uid)
      (respond-error :missing-required-field "Missing UID in request data" {:field "uid"})
      (let [lineage (linearization/calculate-lineage uid)]
        (respond-success {:data lineage}))))
  (catch Exception e
    (log/error e "Failed to calculate lineage for UID:" (:uid ?data))
    (respond-error :database-error "Failed to calculate lineage"
                   {:exception (str e) :uid (:uid ?data)})))

;; RELATION

(response/def-ws-handler :archivist.relation/get-required-roles
  (let [uid (:uid ?data)]
    (if (nil? uid)
      (respond-error :missing-required-field "Missing UID in request data" {:field "uid"})
      (go
        (let [required-roles (<! (relation/get-required-roles uid))]
          (println "REQUIRED ROLES FOOO!!!! " required-roles)
          (pp/pprint required-roles)
          (respond-success {:data required-roles})))))
  (catch Exception e
    (log/error e "Failed to get required roles for UID:" (:uid ?data))
    (respond-error :database-error "Failed to get required roles"
                   {:exception (str e) :uid (:uid ?data)})))


(response/def-ws-handler :archivist.relation/get-role-players
  (let [uid (:uid ?data)]
    (if (nil? uid)
      (respond-error :missing-required-field "Missing UID in request data" {:field "uid"})
      (go
        (let [role-players (<! (relation/get-relation-role-players uid))]
          (respond-success {:data role-players})))))
  (catch Exception e
    (log/error e "Failed to get role players for UID:" (:uid ?data))
    (respond-error :database-error "Failed to get role players"
                   {:exception (str e) :uid (:uid ?data)})))
