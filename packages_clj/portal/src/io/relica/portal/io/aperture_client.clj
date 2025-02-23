(ns io.relica.portal.io.aperture-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :refer [go <!]]
            [clojure.tools.logging :as log]))

;; Configuration
(def ^:private default-timeout 5000)

(def ^:private default-ws-url
  (or (System/getenv "APERTURE_WS_URL") "localhost:2175"))

(defprotocol ApertureOperations
  (get-environment [this user-id] [this user-id env-id])
  (list-environments [this user-id])
  (create-environment [this user-id env-name])
  (load-specialization-hierarchy [this uid user-id])
  (update-environment! [this user-id env-id updates])
  (select-entity [this user-id entity-uid] [this user-id env-id entity-uid]))

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
    ([this user-id]
     (when-not (connected? this) (connect! this))
     (ws/send-message! client :environment/get
                       {:user-id user-id}
                       (:timeout options)))
    ([this user-id env-id]
     (when-not (connected? this) (connect! this))
     (ws/send-message! client :environment/get
                       {:user-id user-id
                        :environment-id env-id}
                       (:timeout options))))

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

  (load-specialization-hierarchy [this uid user-id]
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

  (select-entity
    ([this user-id entity-uid]
     (when-not (connected? this) (connect! this))
     (ws/send-message! client :entity/select
                       {:user-id user-id
                        :entity-uid entity-uid}
                       (:timeout options)))
    ([this user-id env-id entity-uid]
     (when-not (connected? this) (connect! this))
     (ws/send-message! client :entity/select
                       {:user-id user-id
                        :environment-id env-id
                        :entity-uid entity-uid}
                       (:timeout options)))))

(defn create-client
  ([]
   (create-client {}))
  ([{:keys [url timeout]
     :or {url default-ws-url
          timeout default-timeout}
     :as options}]
   (->ApertureClient
    (ws/create-client {:url url})
    {:url url
     :timeout timeout})))

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
                                            "test-env"
                                            {:facts [{:type "new-fact"
                                                      :value "test"}]}))]
      (println "Update result:" response)))

  ;; Cleanup
  (disconnect! test-client))
