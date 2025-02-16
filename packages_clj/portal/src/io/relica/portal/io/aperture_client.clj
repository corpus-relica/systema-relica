(ns io.relica.portal.io.aperture-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :refer [go <!]]
            [clojure.tools.logging :as log]))

;; Configuration
(def ^:private default-timeout 5000)

(def ^:private default-ws-url
  (or (System/getenv "APERTURE_WS_URL") "localhost:2175"))

(defprotocol ApertureOperations
  (get-environment [this user-id])
  (load-specialization-hierarchy [this uid user-id])
  (update-environment! [this user-id updates]))

(defprotocol ConnectionManagement
  (connect! [this])
  (disconnect! [this])
  (connected? [this]))

(defrecord ApertureClient [client options]
  ConnectionManagement
  (connect! [_]
    (tap> {:event :aperture/connecting
           :url (:url options)})
    (ws/connect! client))

  (disconnect! [_]
    (ws/disconnect! client))

  (connected? [_]
    (ws/connected? client))

  ApertureOperations
  (get-environment [this user-id]
    (when-not (connected? this) (connect! this))
    (tap> {:event :aperture/get-environment
           :user-id user-id})
    (ws/send-message! client :environment/get
                      {:user-id user-id}
                      (:timeout options)))

  (load-specialization-hierarchy [this uid user-id]
    (when-not (connected? this) (connect! this))
    (tap> {:event :aperture/load-specialization
           :uid uid
           :user-id user-id})
    (ws/send-message! client :environment/load-specialization
                      {:uid uid
                       :user-id user-id}
                      (:timeout options)))

  (update-environment! [this user-id updates]
    (when-not (connected? this) (connect! this))
    (tap> {:event :aperture/update-environment
           :user-id user-id
           :updates updates})
    (ws/send-message! client :environment/update
                      {:user-id user-id
                       :updates updates}
                      (:timeout options))))

(defn create-client
  ([]
   (create-client default-ws-url {}))
  ([url]
   (create-client url {}))
  ([url {:keys [timeout handlers] :or {timeout default-timeout} :as opts}]
   (let [default-handlers {:on-error (fn [e]
                                      (tap> {:event :aperture/websocket-error
                                            :error e})
                                      (log/error "Aperture WS Error:" e))
                          :on-message (fn [msg]
                                      (tap> {:event :aperture/message-received
                                            :message msg})
                                      (log/debug "Aperture message received:" msg))}
         merged-handlers (merge default-handlers handlers)
         client (ws/create-client url {:handlers merged-handlers})]
     (->ApertureClient client {:url url
                              :timeout timeout
                              :handlers merged-handlers}))))

;; Singleton instance for backward compatibility
(defonce aperture-client (create-client))
(connect! aperture-client)

;; REPL testing helpers
(comment
  ;; Create a test client
  (def test-client (create-client "localhost:2175"))

  ;; Test connection
  (connect! test-client)
  (connected? test-client)

  ;; Test API calls
  (go
    (let [response (<! (get-environment test-client 7))]
      (println "Got environment:" response)))

  (go
    (let [response (<! (load-specialization-hierarchy test-client 1225 7))]
      (println "Loaded specialization:" response)))

  (go
    (let [response (<! (update-environment! test-client
                                          "test-user"
                                          {:facts [{:type "new-fact"
                                                   :value "test"}]}))]
      (println "Update result:" response)))

  ;; Cleanup
  (disconnect! test-client))
