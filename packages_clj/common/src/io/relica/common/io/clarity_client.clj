(ns io.relica.common.io.clarity-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :as async :refer [go-loop <! timeout]]
            [clojure.tools.logging :as log]))


(defprotocol ClarityOperations
  (get-model [this uid])
  (get-kind-model[this kind-id])
  (get-individual-model[this individual-id])
  (send-heartbeat! [this]))

(defrecord ClarityClient [ws-client options]
  ClarityOperations

  (get-model
    [this uid]
    (tap> {:event :app/getting-model})
    (tap> (ws/connected? ws-client))
    (when-not (ws/connected? ws-client)
      (ws/connect! ws-client))
    (tap> {:event :app/sending-get-model})
    (ws/send-message! ws-client :get/model
                      {:uid uid}
                      (:timeout options)))
  (get-kind-model
    [this kind-id]
    (tap> {:event :app/getting-kind-model})
    (tap> (ws/connected? ws-client))
    (when-not (ws/connected? ws-client)
      (ws/connect! ws-client))
    (tap> {:event :app/sending-get-kind-model})
    (ws/send-message! ws-client :get/kind-model
                      {:kind-id kind-id}
                      (:timeout options)))

  (get-individual-model
    [this individual-id]
    (tap> {:event :app/getting-individual-model})
    (tap> (ws/connected? ws-client))
    (when-not (ws/connected? ws-client)
      (ws/connect! ws-client))
    (tap> {:event :app/sending-get-individual-model})
    (ws/send-message! ws-client :get/individual-model
                      {:individual-id individual-id}
                      (:timeout options)))

  (send-heartbeat! [this]
    (tap> {:event :app/sending-heartbeat})
    (ws/send-message! ws-client :app/heartbeat
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
(defn create-client [server-uri opts]
  (let [app-handlers (:handlers opts)
        base-client (ws/create-client
                                      {:uri server-uri
                                       :handlers
                                       {:on-connect #(tap> {:event :app/connected})
                                        :on-disconnect #(tap> {:event :app/disconnected})
                                        :on-message (fn [event-type payload]
                                                      (tap> {:event :app/received-message
                                                             :type event-type
                                                             :payload payload}))}})
        clarity-client (->ClarityClient base-client {:timeout (or(:timeout opts) 5000)})]

    ;; (ws/register-handler base-client :kind/model
    ;;                      (fn [payload]
    ;;                        (tap> {:event :app/handling-kind-model
    ;;                               :payload payload})))

    (ws/connect! base-client)

    (start-heartbeat-scheduler! clarity-client 30000)

    clarity-client))
