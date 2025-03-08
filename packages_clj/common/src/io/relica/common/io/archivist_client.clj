(ns io.relica.common.io.archivist-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :refer [go <!]]
            [clojure.tools.logging :as log]))

;; Configuration
(def ^:private default-timeout 5000)

(def ^:private default-ws-url
  (or (System/getenv "ARCHIVIST_WS_URL") "localhost:3000"))

(defprotocol ArchivistOperations
  (execute-query [this query params])
  (resolve-uids [this uids])
  (get-kinds [this opts])
  (get-collections [this])
  (get-entity-type [this uid])
  (get-entity-category [this uid])
  (text-search [this query])

  ;; Aspect operations
  (get-aspects [this opts])
  (create-aspect [this aspect-data])
  (update-aspect [this uid aspect-data])
  (delete-aspect [this uid])

  ;; Completion operations
  (get-completions [this query])

  ;; Concept operations
  (get-concept [this uid])
  (create-concept [this concept-data])
  (update-concept [this uid concept-data])

  ;; Definition operations
  (get-definition [this uid])
  (create-definition [this def-data])
  (update-definition [this uid def-data])

  ;; Fact operations
  (get-facts [this opts])
  (get-all-related [this uid])
  (create-fact [this fact-data])
  (update-fact [this uid fact-data])
  (delete-fact [this uid])
  (get-definitive-facts[this uid])
  (get-facts-relating-entities [this uid1 uid2])
  (get-related-on-uid-subtype-cone [this lh-object-uid rel-type-uid])
  (get-inherited-relation [this uid rel-type-uid])
  (get-related-to [this uid rel-type-uid])
  (get-classified [this uid])
  (get-classification-fact [this uid])
  (get-subtypes [this uid])
  (get-subtypes-cone [this uid])

  ;; Individual operations
  (get-individual [this uid])
  (create-individual [this individual-data])
  (update-individual [this uid individual-data])

  ;; Kind operations
  (get-kind [this uid])
  (create-kind [this kind-data])
  (update-kind [this uid kind-data])
  (delete-kind [this uid])

  ;; Search operations
  (uid-search [this query])
  (individual-search [this query])
  (kind-search [this query])

  ;; Specialization operations
  (get-specialization-hierarchy [this user-id uid])

  ;; Transaction operations
  (get-transaction [this uid])
  (create-transaction [this tx-data])
  (commit-transaction [this uid])
  (rollback-transaction [this uid])

  ;; Validation operations
  (validate-entity [this entity-data]))

(defprotocol ConnectionManagement
  (connect! [this])
  (disconnect! [this])
  (connected? [this]))

(defrecord ArchivistClient [client options]
  ConnectionManagement
  (connect! [_]
    (ws/connect! client))

  (disconnect! [_]
    (ws/disconnect! client))

  (connected? [_]
    (ws/connected? client))

  ArchivistOperations
  (execute-query [this query params]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :graph/execute-query
                      {:query query}
                      (:timeout options)))

  (resolve-uids [this uids]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :entities/resolve
                      {:uids uids}
                      (:timeout options)))

  (get-kinds [this opts]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :kinds/get
                      opts
                      (:timeout options)))

  (get-collections [this]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :entity/collections
                      {}
                      (:timeout options)))

  (get-entity-type [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :entity/type
                      {:uid uid}
                      (:timeout options)))

  (get-entity-category [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :entity/category
                      {:uid uid}
                      (:timeout options)))

  (text-search [this query]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :general-search/text
                      query
                      (:timeout options)))

  ;; Aspect operations

  (get-aspects [this opts]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :aspects/get opts (:timeout options)))

  (create-aspect [this aspect-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :aspects/create aspect-data (:timeout options)))

  (update-aspect [this uid aspect-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :aspects/update (assoc aspect-data :uid uid) (:timeout options)))

  (delete-aspect [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :aspects/delete {:uid uid} (:timeout options)))

  ;; Completion operations

  (get-completions [this query]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :completions/get query (:timeout options)))

  ;; Concept operations

  (get-concept [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :concepts/get {:uid uid} (:timeout options)))

  (create-concept [this concept-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :concepts/create concept-data (:timeout options)))

  (update-concept [this uid concept-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :concepts/update (assoc concept-data :uid uid) (:timeout options)))

  ;; Definition operations

  (get-definition [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :definitions/get {:uid uid} (:timeout options)))

  (create-definition [this def-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :definitions/create def-data (:timeout options)))

  (update-definition [this uid def-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :definitions/update (assoc def-data :uid uid) (:timeout options)))

  ;; Fact operations

  (get-facts [this opts]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :facts/get opts (:timeout options)))

  (get-all-related [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :fact/get-all-related {:uid uid} (:timeout options)))

  (get-related-on-uid-subtype-cone [this lh-object-uid rel-type-uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :fact/get-related-on-uid-subtype-cone
                      {:lh-object-uid lh-object-uid
                       :rel-type-uid rel-type-uid} (:timeout options)))

  (get-inherited-relation [this uid rel-type-uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :fact/get-inherited-relation
                      {:uid uid
                       :rel-type-uid rel-type-uid} (:timeout options)))

  (create-fact [this fact-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :facts/create fact-data (:timeout options)))

  (update-fact [this uid fact-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :facts/update (assoc fact-data :uid uid) (:timeout options)))

  (delete-fact [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :facts/delete {:uid uid} (:timeout options)))

  (get-definitive-facts [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :fact/get-definitive-facts {:uid uid} (:timeout options)))

  ;; *************************
  (get-classification-fact [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :fact/get-classification-fact {:uid uid} (:timeout options)))
  ;; *************************

  (get-facts-relating-entities [this uid1 uid2]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :fact/get-relating-entities {:uid1 uid1 :uid2 uid2} (:timeout options)))

  (get-related-to [this uid rel-type-uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :fact/get-related-to {:uid uid :rel-type-uid rel-type-uid} (:timeout options)))

  (get-classified [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :fact/get-classified {:uid uid} (:timeout options)))

  (get-subtypes [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :fact/get-subtypes {:uid uid} (:timeout options)))

  (get-subtypes-cone [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :fact/get-subtypes-cone {:uid uid} (:timeout options)))

  ;; Individual operations

  (get-individual [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :individuals/get {:uid uid} (:timeout options)))

  (create-individual [this individual-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :individuals/create individual-data (:timeout options)))

  (update-individual [this uid individual-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :individuals/update (assoc individual-data :uid uid) (:timeout options)))

  ;; Kind operations

  (get-kind [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :kinds/get-one {:uid uid} (:timeout options)))

  (create-kind [this kind-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :kinds/create kind-data (:timeout options)))

  (update-kind [this uid kind-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :kinds/update (assoc kind-data :uid uid) (:timeout options)))

  (delete-kind [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :kinds/delete {:uid uid} (:timeout options)))

  ;; Search operations

  (uid-search [this query]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :general-search/uid query (:timeout options)))

  (individual-search [this query]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :individual-search/get query (:timeout options)))

  (kind-search [this query]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :kind-search/get query (:timeout options)))

  ;; Specialization operations

  (get-specialization-hierarchy [this user-id uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :specialization/hierarchy {:user-id user-id :uid uid} (:timeout options)))

  ;; Transaction operations

  (get-transaction [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :transactions/get {:uid uid} (:timeout options)))

  (create-transaction [this tx-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :transactions/create tx-data (:timeout options)))

  (commit-transaction [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :transactions/commit {:uid uid} (:timeout options)))

  (rollback-transaction [this uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :transactions/rollback {:uid uid} (:timeout options)))

  ;; Validation operations

  (validate-entity [this entity-data]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :validation/validate entity-data (:timeout options))))

(defn create-client
  ([]
   (create-client default-ws-url {}))
  ([url]
   (create-client url {}))
  ([url {:keys [timeout handlers] :or {timeout default-timeout} :as opts}]
   (let [default-handlers {:on-error (fn [e]
                                       (log/error "Archivist WS Error:" e))
                           :on-message (fn [msg]
                                         (log/debug "Archivist message received:" msg))}
         merged-handlers (merge default-handlers handlers)
         client (ws/create-client url {:handlers merged-handlers})]
     (->ArchivistClient client {:url url
                                :timeout timeout
                                :handlers merged-handlers}))))

;; Singleton instance for backward compatibility
;; (defonce archivist-client (create-client))

;; (connect! archivist-client)

;; REPL testing helpers
(comment
  ;; Create a test client
  (def test-client (create-client "localhost:3000"))

  ;; Test connection
  (connect! test-client)

  (connected? test-client)

  archivist-client

  ;; Test API calls
  (go
    (let [response (<! (get-kinds archivist-client
                                  {:sort ["name" "ASC"]
                                   :range [0 10]
                                   :filter {}
                                   :user-id "test-user"}))]
      (log/info (str "Got kinds:" response))))

  (go
    (let [response (<! (resolve-uids test-client [1234 5678 1225 1146]))]
      (println "Resolved UIDs:" response)))

  (go
    (let [response (<! (get-collections test-client))]
      (println "Collections:" response)))

  (go
    (let [response (<! (get-entity-type test-client 123))]
      (println "Entity type:" response)))

  ;; Cleanup
  (disconnect! test-client))
