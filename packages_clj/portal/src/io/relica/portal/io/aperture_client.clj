(ns io.relica.portal.io.aperture-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :refer [go <!]]
            [clojure.tools.logging :as log]))

;; Configuration
(def ^:private default-timeout 5000)

(def ^:private default-ws-url
  (or (System/getenv "APERTURE_WS_URL") "localhost:2175"))

(defprotocol ApertureOperations
  (get-environment [this user-id env-id])
  (list-environments [this user-id])
  (create-environment [this user-id env-name])
  (load-specialization-hierarchy [this user-id uid])
  (update-environment! [this user-id env-id updates])
  (select-entity [this user-id env-id entity-uid]))

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
  (get-environment
    [this user-id env-id]
     (when-not (connected? this)
       (connect! this))
     (ws/send-message! client :environment/get
                       {:user-id user-id
                        :environment-id env-id}
                       (:timeout options)))

  (list-environments [this user-id]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :environment/list
                           {:user-id user-id}
                           (:timeout options)))

  (create-environment [this user-id env-name]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :environment/create
                           {:user-id user-id
                            :name env-name}
                           (:timeout options)))

  (load-specialization-hierarchy [this user-id uid]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :environment/load-specialization
                           {:uid uid
                            :user-id user-id}
                           (:timeout options)))

  (update-environment! [this user-id env-id updates]
    (when-not (connected? this) (connect! this))
    (ws/send-message! client :environment/update
                           {:user-id user-id
                            :environment-id env-id
                            :updates updates}
                           (:timeout options)))

  (select-entity [this user-id env-id entity-uid]
     (when-not (connected? this) (connect! this))
     (ws/send-message! client :entity/select
                            {:user-id user-id
                             :environment-id env-id
                             :entity-uid entity-uid}
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
     (->ApertureClient client (assoc opts
                                     :url url
                                     :timeout timeout
                                     :handlers merged-handlers)))))

;; Singleton instance for backward compatibility
(defonce aperture-client (create-client))

(comment
  ;; Test client
  (def test-client (create-client))

  test-client

  ;; Test connection
  (connect! test-client)

  ;; Test operations
  (go
    (let [response (<! (get-environment test-client 7 1))]
      (tap> (str "Got environment:" response))))

  (go
    (let [response (<! (list-environments test-client 7))]
      (tap> (str "Got environments:" response))))

  ;; Cleanup
  (disconnect! test-client))
