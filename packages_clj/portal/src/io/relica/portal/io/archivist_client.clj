;; src/io/relica/portal/io/archivist_client.clj
(ns io.relica.portal.io.archivist-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :refer [go <!]]
            [clojure.tools.logging :as log]
            [cheshire.core :as json]
            [clojure.string :as str]))

;; Configuration
(def default-timeout 5000)
(def default-ws-url
  (or (System/getenv "ARCHIVIST_WS_URL") "ws://localhost:3000/ws"))

;; Client instance
(defonce archivist-client
  (ws/create-client default-ws-url
                    {
                     ;; :read-mode :json
                     ;; :write-mode :json
                     :handlers {:on-error #(log/error "Archivist WS Error:" %)
                              :on-message #(log/debug "Archivist message received:" %)}}))

;; Request helper
(defn send-archivist!
  ([type payload]
   (send-archivist! type payload default-timeout))
  ([type payload timeout-ms]
   (ws/send-message! archivist-client type payload timeout-ms)))

;; API Functions - converted to use WebSocket
(defn get-specialization-hierarchy [uid]
  (send-archivist! "specialization:hierarchy:get"
                   {:uid uid}))

(defn get-collections [uid]
  (send-archivist! "collections:get"
                   {:uid uid}))

(defn get-definition [uid]
  (send-archivist! "definition:get"
                   {:uid uid}))

(defn uid-search
  ([search-term] (uid-search search-term ""))
  ([search-term collection-uid]
   (send-archivist! "search:uid"
                    {:search-term search-term
                     :collection-uid collection-uid})))

(defn text-search
  ([search-term]
   (text-search search-term 1 50))
  ([search-term page page-size]
   (send-archivist! "search:text"
                    {:search-term search-term
                     :page page
                     :page-size page-size
                     :collection-uid ""})))

(defn get-entity-type [uid]
  (send-archivist! "entity:type:get"
                   {:uid uid}))

(defn get-all-related-facts
  ([uid] (get-all-related-facts uid 1))
  ([uid depth]
   (send-archivist! "facts:related:get"
                    {:uid uid
                     :depth depth})))

(defn get-subtypes [uid]
  (send-archivist! "subtypes:get"
                   {:uid uid}))

(defn get-subtypes-cone [uid]
  (send-archivist! "subtypes:cone:get"
                   {:uid uid}))

(defn get-classified [uid]
  (send-archivist! "classified:get"
                   {:uid uid}))

(defn get-classification-fact [uid]
  (send-archivist! "classification:fact:get"
                   {:uid uid}))

(defn resolve-uids [uids]
  (send-archivist! "entities:resolve"
                   {:uids uids}))

(defn get-entity-prompt [[_ uid]]
  (send-archivist! "entity:prompt:get"
                   {:uid uid}))

(defn post-entity-prompt [uid prompt]
  (send-archivist! "entity:prompt:submit"
                   {:uid uid
                    :prompt prompt}))

(defn validate-binary-fact [fact]
  (send-archivist! "facts:binary:validate"
                   fact))

(defn submit-binary-fact [fact]
  (send-archivist! "facts:binary:submit"
                   fact))

(defn get-kinds [{:keys [sort range filter user-id]}]
  (send-archivist! "kinds:get"
                   {:sort sort
                    :range range
                    :filter filter
                    :user-id user-id}))

;; Connection management
(defn ensure-connection! []
  (when-not (ws/connected? archivist-client)
    (ws/connect! archivist-client)))

(defn disconnect! []
  (ws/disconnect! archivist-client))

;; REPL helpers
(comment
  ;; Ensure connection
  (ensure-connection!)

  (ws/connected? archivist-client)

  ;; Test some endpoints
  (go
    (let [response (<! (get-kinds {:sort ["name" "ASC"]
                                  :range [0 10]
                                  :filter {}
                                  :user-id "test-user"}))]
      (println "Got kinds:" response)))

  (go
    (let [response (<! (resolve-uids [1234 5678]))]
      (println "Resolved UIDs:" response)))

  ;; Cleanup
  (disconnect!)

  )
