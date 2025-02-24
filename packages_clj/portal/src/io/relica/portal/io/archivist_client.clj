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
  (get-kinds [this opts])
  (get-collections [this])
  (get-entity-type [this uid])
  (text-search [this query]))

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

  (text-search [this query]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :general-search/text
                      query
                      (:timeout options))))

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
(defonce archivist-client (create-client))

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
  (disconnect! test-client)

  )
