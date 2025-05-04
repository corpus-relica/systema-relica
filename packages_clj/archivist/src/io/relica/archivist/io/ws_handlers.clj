(ns io.relica.archivist.io.ws-handlers
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :as async :refer [<! go chan]]
            [io.relica.archivist.core.gellish-base :as gellish-base]
            [io.relica.archivist.core.kind :as kind]
            [io.relica.archivist.core.fact :as fact]
            [io.relica.archivist.core.linearization :as linearization]
            [io.relica.archivist.core.entity-retrieval :as entity]
            [io.relica.archivist.core.general-search :as general-search]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.archivist.utils.response :as response]))


;; GRAPH SERVICE

(response/def-ws-handler :archivist.graph/execute-query
  (let [result (<! (graph/exec-query graph/graph-service (:query ?data) (:params ?data)))]
    (respond-success result))
  (catch Exception e
    (log/error e "Failed to execute query")
    (respond-error :query-execution-failed
                   "Failed to execute query"
                   {:exception (str e)})))

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
  (let [facts (<! (fact/get-all-related-facts (:uid ?data)))]
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
    (println "RESULT: " result)
    (respond-success {:resolved true :data result}))
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
    (respond-success {:hierarchy hierarchy}))
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
