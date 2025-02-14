;; src/io/relica/portal/io/aperture_client.clj
(ns io.relica.portal.io.aperture-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :refer [go <!]]
            [clojure.tools.logging :as log]))

(tap> "io.relica.portal.io.aperture-client")

;; Configuration
(def default-timeout 5000)
(def default-ws-url (or (System/getenv "APERTURE_WS_URL") "ws://localhost:2175/ws"))

;; Client instance
(defonce aperture-client
  (ws/create-client default-ws-url
                    {:handlers {:on-error #(log/error "Aperture WS Error:" %)
                              :on-message #(log/debug "Aperture message received:" %)}}))

;; Request helpers
(defn send-aperture!
  ([type payload]
   (send-aperture! type payload default-timeout))
  ([type payload timeout-ms]
   (ws/send-message! aperture-client type payload timeout-ms)))

;; API Functions
(defn get-environment
  "Fetch environment for a user"
  [user-id]
  (send-aperture! "environment:get"
                  {:user-id user-id}))

(defn load-specialization-hierarchy
  "Load specialization hierarchy for a user"
  [uid user-id]
  (send-aperture! "environment:load-specialization"
                  {:uid uid
                   :user-id user-id}))

(defn update-environment!
  "Update environment for a user"
  [user-id updates]
  (send-aperture! "environment:update"
                  {:user-id user-id
                   :updates updates}))

;; Connection management
(defn ensure-connection! []
  (when-not (ws/connected? aperture-client)
    (ws/connect! aperture-client)))

(defn disconnect! []
  (ws/disconnect! aperture-client))

;; REPL helpers
(comment
  ;; Ensure connection
  (ensure-connection!)


  (ws/connected? aperture-client)

(ws/connect! aperture-client)

  ;; Test getting environment
  (go
    (let [response (<! (get-environment 7))]
      (println "Got environment:" response)))

  ;; Test loading specialization hierarchy
  (go
    (let [response (<! (load-specialization-hierarchy 1225 7))]
      (println "Loaded specialization:" response)))

  ;; Test updating environment
  (go
    (let [response (<! (update-environment! "test-user"
                                          {:facts [{:type "new-fact"
                                                   :value "test"}]}))]
      (println "Update result:" response)))

  ;; Cleanup
  (disconnect!)

  )
