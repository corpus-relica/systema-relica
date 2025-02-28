(ns io.relica.archivist.io.ws-server
  (:require [mount.core :refer [defstate]]
            [clojure.tools.logging :as log]
            [clojure.core.async :as async :refer [<! go chan]]
            [io.relica.common.websocket.server :as ws]
            [io.relica.archivist.services.gellish-base-service :as gellish-base-service]
            [io.relica.archivist.services.kind-service :as kind-service]
            [io.relica.archivist.services.entity-retrieval-service :as entity]
            [io.relica.archivist.services.general-search-service :as general-search]))

(defprotocol WebSocketOperations
  (broadcast! [this message])
  (send-to-session! [this session-id message])
  (get-active-sessions [this])
  (disconnect-all! [this])
  (get-xxx [this]))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :entities/resolve
  [{:keys [?data ?reply-fn gellish-base-s] :as msg}]
  (tap> {:event :websocket/handling-entities-resolve
         :data ?data
         :full-msg msg})
  (when ?reply-fn
    (let [result (gellish-base-service/get-entities gellish-base-s (:uids ?data))]
      (tap> {:event :websocket/sending-resolve-response
             :result result})
      (?reply-fn {:resolved true :data result}))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :kinds/list
  [{:keys [?data ?reply-fn kind-s] :as msg}]
  (tap> {:event :websocket/handling-kinds-list
         :data ?data
         :full-msg msg})
  (when ?reply-fn
    (try
      (let [result "SUCKIT FOOL!"
            res-too (kind-service/get-list kind-s (:data ?data))];;(kind-service/get-list xxx ?data)]
        (tap> {:event :websocket/sending-kinds-list-response
               :result result})
        (tap> {:event :websocket/sending-kinds-list-response
               :result res-too})
        (tap> ?reply-fn)
        (?reply-fn {:resolved true :data res-too}))
      (catch Exception e
        (tap> {:event :websocket/sending-kinds-list-response
               :error e})
        (?reply-fn {:resolved false :error e})))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :entity/collections
  [{:keys [?data ?reply-fn entity-s] :as msg}]
  (when ?reply-fn
    (tap> {:event :websocket/getting-collections
           :entity-service entity-s})
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
    (tap> (str "Getting entity type for uid:" (:uid ?data)))
    (go
      (try
        (if-let [entity-type (<! (entity/get-entity-type entity-s (:uid ?data)))]
          (do (tap> (str "found entity type for uid:" (:uid ?data) " " entity-type))
              (?reply-fn {:success true
                         :type entity-type}))
          (?reply-fn {:error "Entity type not found"}))
        (catch Exception e
          (log/error e "Failed to get entity type")
          (?reply-fn {:error "Failed to get entity type"}))))))

(defmethod ^{:priority 10} io.relica.common.websocket.server/handle-ws-message
  :general-search/text
  [{:keys [?data ?reply-fn general-search-s] :as msg}]
  (when ?reply-fn
    (tap> {:event :websocket/text-search
           :data ?data})
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


(defrecord WebSocketComponent [args]
  WebSocketOperations
  (broadcast! [_ message]
    (broadcast! (:server args) message))

  (send-to-session! [_ client-id message]
    (ws/send! (:server args) client-id message))

  (get-active-sessions [_]
    (when-let [connected-uids (:connected-uids @(:state (:server args)))]
      (count (:any @connected-uids))))

  (disconnect-all! [_]
    (ws/stop! (:server args)))

  (get-xxx [_]
    (:gellish-base args)))

(defn create-event-handler [{:keys [gellish-base
                                    kind
                                    entity-retrieval
                                    general-search]}]
  (fn [msg]
    (io.relica.common.websocket.server/handle-ws-message (assoc msg
                                                                :gellish-base-s gellish-base
                                                                :kind-s kind
                                                                :entity-s entity-retrieval
                                                                :general-search-s general-search))))

(defn start [{:keys [port] :as args}]
  (tap> (str "!!! Starting WebSocket server on port" port))
  (let [server (ws/create-server {:port port
                                  :event-msg-handler (create-event-handler args)})
        component (->WebSocketComponent (assoc args :server server))]
    (ws/start! server)
    component))

(defn stop [component]
  (log/info "Stopping WebSocket server...")
  (when-let [server (:server component)]
    (ws/stop! server)))

;; (defstate ws-server
;;   :start (start (:xxx (mount.core/args)) (:port (mount.core/args)))
;;   :stop (stop ws-server))
