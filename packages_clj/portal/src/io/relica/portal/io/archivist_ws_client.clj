;; src/io/relica/portal/io/archivist_ws_client.clj
(ns io.relica.portal.io.archivist-ws-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :refer [go <!]]
            [clojure.tools.logging :as log]))

;; Configuration - could be moved to config file
(def default-timeout 5000)
(def default-ws-url "ws://localhost:3000/ws")

;; Client instance
(defonce archivist-client
  (ws/create-client default-ws-url
                    {:handlers {:on-error #(log/error "Archivist WS Error:" %)}}))

;; Request helpers
(defn send-archivist!
  ([type payload]
   (send-archivist! type payload default-timeout))
  ([type payload timeout-ms]
   (ws/send-message! archivist-client type payload timeout-ms)))

;; API Functions
(defn get-kinds
  "Fetch kinds with optional parameters.
   Options map can include:
   - :sort   [field direction] e.g. [\"name\" \"ASC\"]
   - :range  [start end] e.g. [0 10]
   - :filter map of filters
   - :user-id string"
  ([{:keys [sort range filter user-id]
     :or {sort ["name" "ASC"]
          range [0 10]
          filter {}}}]
   (send-archivist! "getKinds"
                    {:sort sort
                     :range range
                     :filter filter
                     :user-id user-id})))

;; Connection management
(defn ensure-connection! []
  (when-not (ws/connected? archivist-client)
    (ws/connect! archivist-client)))

(defn disconnect! []
  (ws/disconnect! archivist-client))

;; Usage example in Portal service:
(comment
  ;; Ensure connection and make request
  (go
    (ensure-connection!)
    (let [response (<! (get-kinds {:sort ["name" "ASC"]
                                  :range [0 10]
                                  :user-id "test-user"}))]
      (println "Got kinds:" response)))

  ;; Cleanup
  (disconnect!)

  )
