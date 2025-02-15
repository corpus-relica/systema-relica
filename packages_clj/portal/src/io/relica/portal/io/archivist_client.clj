(ns io.relica.portal.io.archivist-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :refer [go <!]]
            [clojure.tools.logging :as log]))

;; Configuration
(def ^:private default-timeout 5000)

(def ^:private default-ws-url
  (or (System/getenv "ARCHIVIST_WS_URL") "localhost:3000"))

(defprotocol ArchivistOperations
  (resolve-uids [this uids])
  ;; (get-kinds [this opts])
  ;; (get-specialization-hierarchy [this uid])
  ;; (get-collections [this uid])
  ;; (get-definition [this uid])
  ;; (uid-search [this search-term] [this search-term collection-uid])
  ;; (text-search [this search-term] [this search-term page page-size])
  ;; (get-entity-type [this uid])
  ;; (get-all-related-facts [this uid] [this uid depth])
  ;; (get-subtypes [this uid])
  ;; (get-subtypes-cone [this uid])
  ;; (get-classified [this uid])
  ;; (get-classification-fact [this uid])
  ;; (get-entity-prompt [this uid])
  ;; (post-entity-prompt [this uid prompt])
  ;; (validate-binary-fact [this fact])
  ;; (submit-binary-fact [this fact])
  )

(defprotocol ConnectionManagement
  (connect! [this])
  (disconnect! [this])
  (connected? [this]))

(defrecord ArchivistClient [client options]
  ConnectionManagement
  (connect! [_]
    (tap> {:event :archivist/connecting
           :url (:url options)})
    (ws/connect! client))

  (disconnect! [_]
    (ws/disconnect! client))

  (connected? [_]
    (ws/connected? client))

  ArchivistOperations
  (resolve-uids [this uids]
    (when-not (connected? this) (connect! this))
    (tap> {:event :archivist/resolve-uids
          :uids uids
           :client client})
    (ws/send-message! client :entities/resolve {:uids uids} (:timeout options)))

  ;; (get-kinds [this {:keys [sort range filter user-id]}]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :kinds/get
  ;;                     {:sort sort
  ;;                      :range range
  ;;                      :filter filter
  ;;                      :user-id user-id}
  ;;                     (:timeout options)))

  ;; (get-specialization-hierarchy [this uid]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :specialization/hierarchy-get
  ;;                     {:uid uid}
  ;;                     (:timeout options)))

  ;; (get-collections [this uid]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :collections/get
  ;;                     {:uid uid}
  ;;                     (:timeout options)))

  ;; (get-definition [this uid]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :definition/get
  ;;                     {:uid uid}
  ;;                     (:timeout options)))

  ;; (uid-search [this search-term]
  ;;   (uid-search this search-term ""))

  ;; (uid-search [this search-term collection-uid]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :search/uid
  ;;                     {:search-term search-term
  ;;                      :collection-uid collection-uid}
  ;;                     (:timeout options)))

  ;; (text-search
  ;;   ([this search-term]
  ;;    (text-search this search-term 1 50))
  ;;   ([this search-term page page-size]
  ;;    (when-not (connected? this) (connect! this))
  ;;    (ws/send-message! client :search/text
  ;;                      {:search-term search-term
  ;;                       :page page
  ;;                       :page-size page-size
  ;;                       :collection-uid ""}
  ;;                      (:timeout options))))

  ;; (get-entity-type [this uid]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :entity/type-get
  ;;                     {:uid uid}
  ;;                     (:timeout options)))

  ;; (get-all-related-facts
  ;;   ([this uid]
  ;;    (get-all-related-facts this uid 1))
  ;;   ([this uid depth]
  ;;    (when-not (connected? this) (connect! this))
  ;;    (ws/send-message! client :facts/related-get
  ;;                      {:uid uid
  ;;                       :depth depth}
  ;;                      (:timeout options))))

  ;; (get-subtypes [this uid]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :subtypes/get
  ;;                     {:uid uid}
  ;;                     (:timeout options)))

  ;; (get-subtypes-cone [this uid]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :subtypes/cone-get
  ;;                     {:uid uid}
  ;;                     (:timeout options)))

  ;; (get-classified [this uid]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :classified/get
  ;;                     {:uid uid}
  ;;                     (:timeout options)))

  ;; (get-classification-fact [this uid]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :classification/fact-get
  ;;                     {:uid uid}
  ;;                     (:timeout options)))

  ;; (get-entity-prompt [this uid]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :entity/prompt-get
  ;;                     {:uid uid}
  ;;                     (:timeout options)))

  ;; (post-entity-prompt [this uid prompt]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :entity/prompt-submit
  ;;                     {:uid uid
  ;;                      :prompt prompt}
  ;;                     (:timeout options)))

  ;; (validate-binary-fact [this fact]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :facts/binary-validate
  ;;                     fact
  ;;                     (:timeout options)))

  ;; (submit-binary-fact [this fact]
  ;;   (when-not (connected? this) (connect! this))
  ;;   (ws/send-message! client :facts/binary-submit
  ;;                     fact
  ;;                     (:timeout options)))
                    )

(defn create-client
  ([]
   (create-client default-ws-url {}))
  ([url]
   (create-client url {}))
  ([url {:keys [timeout handlers] :or {timeout default-timeout} :as opts}]
   (let [default-handlers {:on-error (fn [e]
                                      (tap> {:event :archivist/websocket-error
                                            :error e})
                                      (log/error "Archivist WS Error:" e))
                          :on-message (fn [msg]
                                      (tap> {:event :archivist/message-received
                                            :message msg})
                                      (log/debug "Archivist message received:" msg))}
         merged-handlers (merge default-handlers handlers)
         client (ws/create-client url {:handlers merged-handlers})]
     (->ArchivistClient client {:url url
                               :timeout timeout
                               :handlers merged-handlers}))))

;; Singleton instance for backward compatibility
(defonce archivist-client (create-client))

;; REPL testing helpers
(comment
  ;; Create a test client
  (def test-client (create-client "localhost:3000"))

  ;; Test connection
  (connect! test-client)

  (connected? test-client)

  ;; Test API calls
  (go
    (let [response (<! (get-kinds test-client
                                 {:sort ["name" "ASC"]
                                  :range [0 10]
                                  :filter {}
                                  :user-id "test-user"}))]
      (println "Got kinds:" response)))

  (go
    (let [response (<! (resolve-uids test-client [1234 5678]))]
      (println "Resolved UIDs:" response)))

  ;; Cleanup
  (disconnect! test-client)

  )
