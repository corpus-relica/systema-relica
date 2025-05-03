(ns io.relica.archivist.io.ws-handlers
  (:require [mount.core :refer [defstate]]
            [clojure.tools.logging :as log]
            [clojure.core.async :as async :refer [<! go chan]]
            [io.relica.common.websocket.server :as ws]
            [io.relica.archivist.services.gellish-base-service :as gellish-base-service]
            [io.relica.archivist.services.kind-service :as kind-service]
            [io.relica.archivist.services.entity-retrieval-service :as entity]
            [io.relica.archivist.services.general-search-service :as general-search]
            [io.relica.archivist.services.fact-service :as fact-service]
            [io.relica.archivist.services.graph-service :as graph-service]
            [io.relica.archivist.services.linearization-service :as linearization-service]
            [io.relica.archivist.utils.response :as response]))

;; GRAPH SERVICE

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.graph/execute-query
  [{:keys [?data ?reply-fn graph-s] :as msg}]
  (when ?reply-fn
    (if (nil? graph-s)
      (?reply-fn (response/error-response :service-unavailable 
                                         "Graph service not initialized"
                                         nil
                                         (:request_id ?data)))
      (go
        (try
          (let [result (<! (graph-service/exec-query graph-s (:query ?data) (:params ?data)))]
            (?reply-fn (response/success-response result (:request_id ?data))))
          (catch Exception e
            (log/error e "Failed to execute query")
            (?reply-fn (response/error-response :query-execution-failed 
                                               "Failed to execute query"
                                               {:exception (str e)}
                                               (:request_id ?data)))))))))

;; FACT SERVICE

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/batch-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    (if (nil? fact-s)
      (?reply-fn (response/error-response :service-unavailable 
                                         "Fact service not initialized"
                                         nil
                                         (:request_id ?data)))
      (go
        (try
          (let [result (fact-service/get-batch fact-s ?data)]
            (println "Facts: " (:facts result))
            (?reply-fn (response/success-response (:facts result) (:request_id ?data))))
          (catch Exception e
            (log/error e "Failed to get batch facts")
            (?reply-fn (response/error-response :database-error
                                               "Failed to get batch facts"
                                               {:exception (str e)}
                                               (:request_id ?data)))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/count
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    (if (nil? fact-s)
      (?reply-fn (response/error-response :service-unavailable
                                         "Fact service not initialized" 
                                         nil
                                         (:request_id ?data)))
      (go
        (try
          (let [result (fact-service/get-count fact-s)]
            (?reply-fn (response/success-response {:count result} (:request_id ?data))))
          (catch Exception e
            (log/error e "Failed to count facts")
            (?reply-fn (response/error-response :database-error
                                               "Failed to count facts"
                                               {:exception (str e)}
                                               (:request_id ?data)))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/all-related-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    ;; (tap> {:event :websocket/getting-all-related-facts
    ;;        :entity-service fact-s})
    (if (nil? fact-s)
      (?reply-fn (response/error-response :service-unavailable
                                         "Fact service not initialized"
                                         nil
                                         (:request_id ?data)))
      (go
        (try
          (let [facts (<! (fact-service/get-all-related-facts fact-s (:uid ?data)))]
            ;; NOTE: Fixed duplicate reply issue here - only sending response once now
            (?reply-fn (response/success-response {:facts facts} (:request_id ?data))))
          (catch Exception e
            (log/error e "Failed to get all related facts")
            (?reply-fn (response/error-response :database-error
                                               "Failed to get all related facts"
                                               {:exception (str e)}
                                               (:request_id ?data)))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/definitive-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error gellish-base-s] :as msg}]
      (println "Getting definitive facts")
      (println ?data)
      (if (nil? gellish-base-s)
        (respond-error :service-unavailable "Gellish base service not initialized")
        (go
          (try
            (let [facts (gellish-base-service/get-definitive-facts gellish-base-s (:uid ?data))]
              (println "Facts: " facts)
              (respond-success {:facts facts}))
            (catch Exception e
              (log/error e "Failed to get definitive facts")
              (respond-error :database-error "Failed to get definitive facts" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/classification-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error gellish-base-s] :as msg}]
      ;; (tap> {:event :websocket/getting-classification-fact
      ;;        :entity-service fact-s})
      (println "!!!!!!!!!!!!!!!!!!!!!!!! --- Bon Jovi: " ?data)
      (if (nil? gellish-base-s)
        (respond-error :service-unavailable "Gellish base service not initialized")
        (go
          (try
            (let [facts (gellish-base-service/get-classification-fact gellish-base-s (:uid ?data))]
              (println "!!!!!!!!!!!!!!!!!!!!!!!! --- Facts: " facts)
              (respond-success {:facts facts}))
            (catch Exception e
              (log/error e "Failed to get classification fact")
              (respond-error :database-error "Failed to get classification fact" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/relating-entities-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error fact-s] :as msg}]
      (if (nil? fact-s)
        (respond-error :service-unavailable "Fact service not initialized")
        (go
          (try
            (let [facts (<! (fact-service/get-facts-relating-entities fact-s (:uid1 ?data) (:uid2 ?data)))]
              (respond-success {:facts facts}))
            (catch Exception e
              (log/error e "Failed to get facts relating entities")
              (respond-error :database-error "Failed to get facts relating entities" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/related-on-uid-subtype-cone-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error fact-s] :as msg}]
      ;; (tap> {:event :websocket/getting-related-on-uid-subtype-cone-facts
      ;;        :entity-service fact-s})
      (if (nil? fact-s)
        (respond-error :service-unavailable "Fact service not initialized")
        (go
          (try
            (let [facts (<! (fact-service/get-related-on-uid-subtype-cone
                             fact-s
                             (:lh-object-uid ?data)
                             (:rel-type-uid ?data)))]
              (respond-success {:facts facts}))
            (catch Exception e
              (log/error e "Failed to get related on uid subtype cone facts")
              (respond-error :database-error "Failed to get related on uid subtype cone facts" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/inherited-relation-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error fact-s] :as msg}]
      (if (nil? fact-s)
        (respond-error :service-unavailable "Fact service not initialized")
        (go
          (try
            (let [fact (<! (fact-service/get-inherited-relation fact-s (:uid ?data) (:rel-type-uid ?data)))]
              (respond-success {:fact fact}))
            (catch Exception e
              (log/error e "Failed to get inherited relation")
              (respond-error :database-error "Failed to get inherited relation" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/related-to-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error fact-s] :as msg}]
      (if (nil? fact-s)
        (respond-error :service-unavailable "Fact service not initialized")
        (go
          (try
            (let [facts (<! (fact-service/get-related-to fact-s (:uid ?data) (:rel-type-uid ?data)))]
              (respond-success {:facts facts}))
            (catch Exception e
              (log/error e "Failed to get related to facts")
              (respond-error :database-error "Failed to get related to facts" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/related-to-get-subtype-cone
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error fact-s] :as msg}]
      (if (nil? fact-s)
        (respond-error :service-unavailable "Fact service not initialized")
        (go
          (try
            (let [facts (<! (fact-service/get-related-to-subtype-cone fact-s (:uid ?data) (:rel-type-uid ?data)))]
              (respond-success {:facts facts}))
            (catch Exception e
              (log/error e "Failed to get related to subtypes cone facts")
              (respond-error :database-error "Failed to get related to subtypes cone facts" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/recursive-relations-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error fact-s] :as msg}]
      (if (nil? fact-s)
        (respond-error :service-unavailable "Fact service not initialized")
        (go
          (try
            (let [facts (<! (fact-service/get-recursive-relations fact-s (:uid ?data) (:rel-type-uid ?data) 10))]
              (respond-success {:facts facts}))
            (catch Exception e
              (log/error e "Failed to get recursive relations")
              (respond-error :database-error "Failed to get recursive relations" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/recursive-relations-get-to
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error fact-s] :as msg}]
      (if (nil? fact-s)
        (respond-error :service-unavailable "Fact service not initialized")
        (go
          (try
            (let [facts (<! (fact-service/get-recursive-relations-to fact-s (:uid ?data) (:rel-type-uid ?data) 10))]
              (respond-success {:facts facts}))
            (catch Exception e
              (log/error e "Failed to get recursive relations")
              (respond-error :database-error "Failed to get recursive relations" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/classified-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error fact-s] :as msg}]
      (if (nil? fact-s)
        (respond-error :service-unavailable "Fact service not initialized")
        (go
          (try
            (let [facts (<! (fact-service/get-classified fact-s (:uid ?data) (or (:recursive ?data) false)))]
              (respond-success {:facts facts}))
            (catch Exception e
              (log/error e "Failed to get classified facts")
              (respond-error :database-error "Failed to get classified facts" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/subtypes-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error fact-s] :as msg}]
      (if (nil? fact-s)
        (respond-error :service-unavailable "Fact service not initialized")
        (go
          (try
            (let [facts (fact-service/get-subtypes fact-s (:uid ?data))]
              ;; (tap> {:event :websocket/getting-subtypes-facts
              ;;        :facts facts})
              (respond-success {:facts facts}))
            (catch Exception e
              (log/error e "Failed to get subtypes facts")
              (respond-error :database-error "Failed to get subtypes facts" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/subtypes-get-cone
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error fact-s] :as msg}]
      (if (nil? fact-s)
        (respond-error :service-unavailable "Fact service not initialized")
        (go
          (try
            (let [facts (<! (fact-service/get-subtypes-cone fact-s (:uid ?data)))]
              (tap> "______________________________________________________")
              (tap> facts)
              (respond-success {:facts facts}))
            (catch Exception e
              (log/error e "Failed to get subtypes cone facts")
              (respond-error :database-error "Failed to get subtypes cone facts" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/core-sample-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error fact-s] :as msg}]
      (if (nil? fact-s)
        (respond-error :service-unavailable "Fact service not initialized")
        (go
          (try
            (let [match-on (if (contains? ?data :match-on)
                             (keyword (:match-on ?data))
                             :lh)
                  results (<! (fact-service/get-core-sample 
                               fact-s 
                               (:uid ?data) 
                               (:rel-type-uid ?data)))]
              (respond-success {:results results}))
            (catch Exception e
              (log/error e "Failed to get core sample")
              (respond-error :database-error "Failed to get core sample" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.fact/core-sample-get-rh
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error fact-s] :as msg}]
      (if (nil? fact-s)
        (respond-error :service-unavailable "Fact service not initialized")
        (go
          (try
            (let [match-on (if (contains? ?data :match-on)
                             (keyword (:match-on ?data))
                             :lh)
                  results (<! (fact-service/get-core-sample-rh
                               fact-s
                               (:uid ?data)
                               (:rel-type-uid ?data)))]
              (respond-success {:results results}))
            (catch Exception e
              (log/error e "Failed to get core sample")
              (respond-error :database-error "Failed to get core sample" 
                            {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.entity/batch-resolve
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error gellish-base-s] :as msg}]
      (if (nil? gellish-base-s)
        (respond-error :service-unavailable "Gellish base service not initialized")
        (try
          (let [result (gellish-base-service/get-entities gellish-base-s (:uids ?data))]
            (respond-success {:resolved true :data result}))
          (catch Exception e
            (log/error e "Failed to batch resolve entities")
            (respond-error :database-error "Failed to batch resolve entities" 
                         {:exception (str e)})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.entity/category-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error gellish-base-s] :as msg}]
      (if (nil? gellish-base-s)
        (respond-error :service-unavailable "Entity service not initialized")
        (go
          (try
            (let [category (gellish-base-service/get-entity-category gellish-base-s (:uid ?data))]
              (respond-success {:category category}))
            (catch Exception e
              (log/error e "Failed to get entity category")
              (respond-error :database-error "Failed to get entity category" 
                           {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.entity/collections-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error entity-s] :as msg}]
      (if (nil? entity-s)
        (respond-error :service-unavailable "Entity service not initialized")
        (go
          (try
            (let [collections (<! (entity/get-collections entity-s))]
              (respond-success {:collections collections}))
            (catch Exception e
              (log/error e "Failed to get collections")
              (respond-error :database-error "Failed to get collections" 
                           {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.entity/type-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error entity-s] :as msg}]
      (if (nil? entity-s)
        (respond-error :service-unavailable "Entity service not initialized")
        (go
          (try
            (if-let [entity-type (<! (entity/get-entity-type entity-s (:uid ?data)))]
              (respond-success {:type entity-type})
              (respond-error :resource-not-found "Entity type not found" {:uid (:uid ?data)}))
            (catch Exception e
              (log/error e "Failed to get entity type")
              (respond-error :database-error "Failed to get entity type" 
                           {:exception (str e)}))))))))

;; KIND SERVICE

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.kind/list
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error kind-s] :as msg}]
      (println ?data)
      (if (nil? kind-s)
        (respond-error :service-unavailable "Kind service not initialized")
        (try
          (let [result (kind-service/get-list kind-s ?data)]
            (println "RESULT: " result)
            (respond-success {:resolved true :data result}))
          (catch Exception e
            (tap> {:event :websocket/sending-kinds-list-response
                   :error e})
            (respond-error :database-error "Failed to get kind list" 
                         {:exception (str e)})))))))

;; (defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
;;   :kinds/get
;;   [{:keys [?data ?reply-fn kind-s] :as msg}]
;;   (when ?reply-fn
;;     (try
;;       (let [result (kind-service/get kind-s (:uid ?data))]
;;         (?reply-fn {:resolved true :data result}))
;;       (catch Exception e
;;         (tap> {:event :websocket/sending-kind-response
;;                :error e})
;;         (?reply-fn {:resolved false :error e})))))

;; SEARCH SERVICE

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.search/text
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error general-search-s] :as msg}]
      (if (nil? general-search-s)
        (respond-error :service-unavailable "General search service not initialized")
        (go
          (try
            (let [{:keys [searchTerm collectionUID page pageSize filter exactMatch]
                   :or {page 1 pageSize 10 exactMatch false}} ?data
                  results (<! (general-search/get-text-search general-search-s
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
                           {:exception (str e)}))))))))

;; SPECIALIZATION

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.specialization/fact-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error gellish-base-s] :as msg}]
      (tap> {:event :websocket/getting-specialization-fact
             :entity-service gellish-base-s})
      (if (nil? gellish-base-s)
        (respond-error :service-unavailable "Entity service not initialized")
        (go
          (try
            (let [facts (gellish-base-service/get-specialization-fact gellish-base-s (:uid ?data))]
              (respond-success {:facts facts}))
            (catch Exception e
              (log/error e "Failed to get specialization fact")
              (respond-error :database-error "Failed to get specialization fact" 
                           {:exception (str e)}))))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.specialization/hierarchy-get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error gellish-base-s] :as msg}]
      (tap> {:event :websocket/getting-specialization-hierarchy
             :entity-service gellish-base-s})
      (if (nil? gellish-base-s)
        (respond-error :service-unavailable "Entity service not initialized")
        (go
          (try
            (let [hierarchy (gellish-base-service/get-specialization-hierarchy gellish-base-s (:uid ?data))]
              (respond-success {:hierarchy hierarchy}))
            (catch Exception e
              (log/error e "Failed to get specialization hierarchy")
              (respond-error :database-error "Failed to get specialization hierarchy" 
                           {:exception (str e)}))))))))

;; LINEAGE SERVICE

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :archivist.lineage/get
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (response/with-standard-response
    (fn [{:keys [?data respond-success respond-error] :as msg}]
      (let [service @linearization-service/linearization-service-comp]
        (if (nil? service)
          (respond-error :service-unavailable "Linearization service not initialized")
          (try
            (let [uid (:uid ?data)]
              (if (nil? uid)
                (respond-error :missing-required-field "Missing UID in request data" {:field "uid"})
                (let [lineage (linearization-service/calculate-lineage service uid)]
                  (respond-success {:data lineage}))))
            (catch Exception e
              (log/error e "Failed to calculate lineage for UID:" (:uid ?data))
              (respond-error :database-error "Failed to calculate lineage" 
                           {:exception (str e) :uid (:uid ?data)}))))))))
