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
            [io.relica.archivist.services.graph-service :as graph-service]))


;; GRAPH SERVICE

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :graph/execute-query
  [{:keys [?data ?reply-fn graph-s] :as msg}]
  (when ?reply-fn
    (if (nil? graph-s)
      (?reply-fn {:success false
                  :error "Graph service not initialized"})
      (go
        (try
          (let [result (<! (graph-service/exec-query graph-s (:query ?data) (:params ?data)))]
            (?reply-fn {:success true
                        :result result}))
          (catch Exception e
            (log/error e "Failed to execute query")
            (?reply-fn {:success false
                        :error "Failed to execute query"})))))))

;; FACT SERVICE

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-all-related
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    ;; (tap> {:event :websocket/getting-all-related-facts
    ;;        :entity-service fact-s})
    (if (nil? fact-s)
      (?reply-fn {:success false
                  :error "fact service not initialized"})
      (go
        (try
          (let [facts (<! (fact-service/get-all-related-facts fact-s (:uid ?data)))]
            (?reply-fn {:success true
                        :facts facts})
            (?reply-fn {:success true
                        :facts facts}))
          (catch Exception e
            (log/error e "Failed to get all related facts")
            (?reply-fn {:success false
                        :error "Failed to get all related facts"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-definitive-facts
  [{:keys [?data ?reply-fn gellish-base-s] :as msg}]
  (when ?reply-fn
    ;; (tap> {:event :websocket/getting-definitive-facts
    ;;        :entity-service fact-s})
    (if (nil? gellish-base-s)
      (?reply-fn {:success false
                  :error "gellish base service not initialized"})
      (go
        (try
          (let [facts (gellish-base-service/get-definitive-facts gellish-base-s (:uid ?data))]
            (?reply-fn {:success true
                        :facts facts}))
          (catch Exception e
            (log/error e "Failed to get definitive facts")
            (?reply-fn {:success false
                        :error "Failed to get definitive facts"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-classification-fact
  [{:keys [?data ?reply-fn gellish-base-s] :as msg}]
  (when ?reply-fn
    ;; (tap> {:event :websocket/getting-classification-fact
    ;;        :entity-service fact-s})
    (if (nil? gellish-base-s)
      (?reply-fn {:success false
                  :error "gellish base service not initialized"})
      (go
        (try
          (let [facts (<! (gellish-base-service/get-classification-fact gellish-base-s (:uid ?data)))]
            (?reply-fn {:success true
                        :facts facts}))
          (catch Exception e
            (log/error e "Failed to get classification fact")
            (?reply-fn {:success false
                        :error "Failed to get classification fact"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-relating-entities
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    (if (nil? fact-s)
      (?reply-fn {:success false
                 :error "fact service not initialized"})
      (go
        (try
          (let [facts (<! (fact-service/get-facts-relating-entities fact-s (:uid1 ?data) (:uid2 ?data)))]
            (?reply-fn {:success true
                       :facts facts}))
          (catch Exception e
            (log/error e "Failed to get facts relating entities")
            (?reply-fn {:success false
                       :error "Failed to get facts relating entities"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-related-on-uid-subtype-cone
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    ;; (tap> {:event :websocket/getting-related-on-uid-subtype-cone-facts
    ;;        :entity-service fact-s})
    (if (nil? fact-s)
      (?reply-fn {:success false
                  :error "fact service not initialized"})
      (go
        (try
          (let [facts (<!(fact-service/get-related-on-uid-subtype-cone-facts
                       fact-s
                       (:lh-object-uid ?data)
                       (:rel-type-uid ?data)))]
            (?reply-fn {:success true
                        :facts facts}))
          (catch Exception e
            (log/error e "Failed to get related on uid subtype cone facts")
            (?reply-fn {:success false
                        :error "Failed to get related on uid subtype cone facts"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-inherited-relation
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    (if (nil? fact-s)
      (?reply-fn {:success false
                  :error "fact service not initialized"})
      (go
        (try
          (let [fact (<! (fact-service/get-inherited-relation fact-s (:uid ?data) (:rel-type-uid ?data)))]
            (?reply-fn {:success true
                        :fact fact}))
          (catch Exception e
            (log/error e "Failed to get inherited relation")
            (?reply-fn {:success false
                        :error "Failed to get inherited relation"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-related-to
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    (if (nil? fact-s)
      (?reply-fn {:success false
                  :error "fact service not initialized"})
      (go
        (try
          (let [facts (<! (fact-service/get-related-to fact-s (:uid ?data) (:rel-type-uid ?data)))]
            (?reply-fn {:success true
                        :facts facts}))
          (catch Exception e
            (log/error e "Failed to get related to facts")
            (?reply-fn {:success false
                        :error "Failed to get related to facts"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-related-to-subtype-cone
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    (if (nil? fact-s)
      (?reply-fn {:success false
                  :error "fact service not initialized"})
      (go
        (try
          (let [facts (<! (fact-service/get-related-to-subtype-cone fact-s (:uid ?data) (:rel-type-uid ?data)))]
            (?reply-fn {:success true
                        :facts facts}))
          (catch Exception e
            (log/error e "Failed to get related to subtypes cone facts")
            (?reply-fn {:success false
                        :error "Failed to get related to subtypes cone facts"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-classified
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    (if (nil? fact-s)
      (?reply-fn {:success false
                  :error "fact service not initialized"})
      (go
        (try
          (let [facts (<! (fact-service/get-classified fact-s (:uid ?data) (or (:recursive ?data) false)))]
            (?reply-fn {:success true
                        :facts facts}))
          (catch Exception e
            (log/error e "Failed to get classified facts")
            (?reply-fn {:success false
                        :error "Failed to get classified facts"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-subtypes
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    (if (nil? fact-s)
      (?reply-fn {:success false
                  :error "fact service not initialized"})
      (go
        (try
          (let [facts (fact-service/get-subtypes fact-s (:uid ?data))]
    ;; (tap> {:event :websocket/getting-subtypes-facts
    ;;        :facts facts})
            (?reply-fn {:success true
                        :facts facts}))
          (catch Exception e
            (log/error e "Failed to get subtypes facts")
            (?reply-fn {:success false
                        :error "Failed to get subtypes facts"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-subtypes-cone
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    (if (nil? fact-s)
      (?reply-fn {:success false
                  :error "fact service not initialized"})
      (go
        (try
          (let [facts (<! (fact-service/get-subtypes-cone fact-s (:uid ?data)))]
            (tap> "______________________________________________________")
            (tap> facts)
            (?reply-fn {:success true
                        :facts facts}))
          (catch Exception e
            (log/error e "Failed to get subtypes cone facts")
            (?reply-fn {:success false
                        :error "Failed to get subtypes cone facts"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-core-sample
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    (if (nil? fact-s)
      (?reply-fn {:success false
                  :error "fact service not initialized"})
      (go
        (try
          (let [match-on (if (contains? ?data :match-on)
                           (keyword (:match-on ?data))
                           :lh)
                results (<! (fact-service/get-core-sample 
                             fact-s 
                             (:uid ?data) 
                             (:rel-type-uid ?data)))]
            (?reply-fn {:success true
                        :results results}))
          (catch Exception e
            (log/error e "Failed to get core sample")
            (?reply-fn {:success false
                        :error "Failed to get core sample"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :fact/get-core-sample-rh
  [{:keys [?data ?reply-fn fact-s] :as msg}]
  (when ?reply-fn
    (if (nil? fact-s)
      (?reply-fn {:success false
                  :error "fact service not initialized"})
      (go
        (try
          (let [match-on (if (contains? ?data :match-on)
                           (keyword (:match-on ?data))
                           :lh)
                results (<! (fact-service/get-core-sample-rh
                             fact-s
                             (:uid ?data)
                             (:rel-type-uid ?data)))]
            (?reply-fn {:success true
                        :results results}))
          (catch Exception e
            (log/error e "Failed to get core sample")
            (?reply-fn {:success false
                        :error "Failed to get core sample"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :entities/resolve
  [{:keys [?data ?reply-fn gellish-base-s] :as msg}]
  (when ?reply-fn
    (let [result (gellish-base-service/get-entities gellish-base-s (:uids ?data))]
      (?reply-fn {:resolved true :data result}))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :entity/category
  [{:keys [?data ?reply-fn gellish-base-s] :as msg}]
  (when ?reply-fn
    (if (nil? gellish-base-s)
      (?reply-fn {:success false
                  :error "Entity service not initialized"})
      (go
        (try
          (let [category (gellish-base-service/get-entity-category gellish-base-s (:uid ?data))]
            (?reply-fn {:success true
                        :category category}))
          (catch Exception e
            (log/error e "Failed to get entity category")
            (?reply-fn {:success false
                        :error "Failed to get entity category"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :entity/collections
  [{:keys [?data ?reply-fn entity-s] :as msg}]
  (when ?reply-fn
    (if (nil? entity-s)
      (?reply-fn {:success false
                  :error "Entity service not initialized"})
      (go
        (try
          (let [collections (<! (entity/get-collections entity-s))]
            (?reply-fn {:success true
                        :collections collections}))
          (catch Exception e
            (log/error e "Failed to get collections")
            (?reply-fn {:success false
                        :error "Failed to get collections"})))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :entity/type
  [{:keys [?data ?reply-fn entity-s] :as msg}]
  (when ?reply-fn
    (go
      (try
        (if-let [entity-type (<! (entity/get-entity-type entity-s (:uid ?data)))]
          (?reply-fn {:success true
                     :type entity-type})
          (?reply-fn {:error "Entity type not found"}))
        (catch Exception e
          (log/error e "Failed to get entity type")
          (?reply-fn {:error "Failed to get entity type"}))))))

;; KIND SERVICE

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :kinds/list
  [{:keys [?data ?reply-fn kind-s] :as msg}]
  (when ?reply-fn
    (try
      (let [result "SUCKIT FOOL!"
            res-too (kind-service/get-list kind-s (:data ?data))];;(kind-service/get-list xxx ?data)]
        (?reply-fn {:resolved true :data res-too}))
      (catch Exception e
        (tap> {:event :websocket/sending-kinds-list-response
               :error e})
        (?reply-fn {:resolved false :error e})))))

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
  :general-search/text
  [{:keys [?data ?reply-fn general-search-s] :as msg}]
  (when ?reply-fn
    (if (nil? general-search-s)
      (?reply-fn {:success false
                  :error "General search service not initialized"})
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
            (?reply-fn {:success true
                       :results results}))
          (catch Exception e
            (log/error e "Failed to execute text search")
            (?reply-fn {:success false
                        :error "Failed to execute text search"})))))))

;; SPECIALIZATION HIERARCHY

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :specialization/hierarchy
  [{:keys [?data ?reply-fn gellish-base-s] :as msg}]
  (when ?reply-fn
    (tap> {:event :websocket/getting-specialization-hierarchy
           :entity-service gellish-base-s})
    (if (nil? gellish-base-s)
      (?reply-fn {:success false
                  :error "Entity service not initialized"})
      (go
        (try
          (let [hierarchy (gellish-base-service/get-specialization-hierarchy gellish-base-s (:uid ?data))]
            (?reply-fn {:success true
                        :hierarchy hierarchy}))
          (catch Exception e
            (log/error e "Failed to get specialization hierarchy")
            (?reply-fn {:success false
                        :error "Failed to get specialization hierarchy"})))))))
