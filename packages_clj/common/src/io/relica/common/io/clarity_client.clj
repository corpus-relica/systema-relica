(ns io.relica.common.io.clarity-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :as async :refer [go-loop <! timeout]]
            [clojure.tools.logging :as log]))

;; Configuration
(def ^:private default-timeout 5000)

(defprotocol ClarityOperations
  (get-model [this uid])
  (get-kind-model [this kind-id])
  (get-individual-model [this individual-id])
  (send-heartbeat! [this]))

(defrecord ClarityClient [ws-client options]
  ClarityOperations

  (get-model
    [this uid]
    (tap> {:event :clarity.model/getting})
    (tap> (ws/connected? ws-client))
    (when-not (ws/connected? ws-client)
      (ws/connect! ws-client))
    (tap> {:event :clarity.model/sending-get})
    (ws/send-message! ws-client :clarity.model/get
                      {:uid uid}
                      (:timeout options)))
  (get-kind-model
    [this kind-id]
    (tap> {:event :clarity.kind/getting})
    (tap> (ws/connected? ws-client))
    (when-not (ws/connected? ws-client)
      (ws/connect! ws-client))
    (tap> {:event :clarity.kind/sending-get})
    (ws/send-message! ws-client :clarity.kind/get
                      {:kind-id kind-id}
                      (:timeout options)))

  (get-individual-model
    [this individual-id]
    (tap> {:event :clarity.individual/getting})
    (tap> (ws/connected? ws-client))
    (when-not (ws/connected? ws-client)
      (ws/connect! ws-client))
    (tap> {:event :clarity.individual/sending-get})
    (ws/send-message! ws-client :clarity.individual/get
                      {:individual-id individual-id}
                      (:timeout options)))

  (send-heartbeat! [this]
    (tap> {:event :relica.app/sending-heartbeat})
    (ws/send-message! ws-client :relica.app/heartbeat
                      {:timestamp (System/currentTimeMillis)}
                      3000)))

;; Heartbeat scheduler
(defn start-heartbeat-scheduler! [clarity-client interval-ms]
  (let [running (atom true)
        scheduler (go-loop []
                    (<! (timeout interval-ms))
                    (when @running
                      (send-heartbeat! clarity-client)
                      (recur)))]
    ;; Return a function that stops the scheduler
    #(do (reset! running false)
         (async/close! scheduler))))

;; Factory function
(defn create-client
  [{:keys [timeout handlers host port] :or {timeout default-timeout}}]
  (let [uri (str "ws://" host ":" port "/ws")
        default-handlers {:on-connect #(tap> {:event :relica.connection/connected})
                          :on-disconnect #(tap> {:event :relica.connection/disconnected})
                          :on-message (fn [event-type payload]
                                        (tap> {:event :clarity.message/received
                                               :type event-type
                                               :payload payload}))}
        merged-handlers (merge default-handlers handlers)
        base-client (ws/create-client {:service-name "clarity"
                                       :uri uri
                                       :handlers merged-handlers})
        clarity-client (->ClarityClient base-client {:timeout timeout})]

    ;; (ws/register-handler base-client :clarity.kind/model
    ;;                      (fn [payload]
    ;;                        (tap> {:event :clarity.kind/handling
    ;;                               :payload payload})))

    (ws/connect! base-client)

    (start-heartbeat-scheduler! clarity-client 30000)

    clarity-client))
