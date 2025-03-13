(ns io.relica.common.io.nous-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :as async :refer [go-loop <! timeout]]
            [clojure.tools.logging :as log]))


(defprotocol NOUSOperations
  (send-heartbeat! [this]))

(defrecord NOUSClient [ws-client options]
  NOUSOperations

  (send-heartbeat! [this]
    (tap> {:event :app/sending-heartbeat})
    (ws/send-message! ws-client :app/heartbeat
                            {:timestamp (System/currentTimeMillis)}
                            3000)))

;; Heartbeat scheduler
(defn start-heartbeat-scheduler! [nous-client interval-ms]
  (let [running (atom true)
        scheduler (go-loop []
                    (<! (timeout interval-ms))
                    (when @running
                      (send-heartbeat! nous-client)
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
        nous-client (->NOUSClient base-client {:timeout (or(:timeout opts) 5000)})]

    ;; (ws/register-handler base-client :kind/model
    ;;                      (fn [payload]
    ;;                        (tap> {:event :app/handling-kind-model
    ;;                               :payload payload})))

    (ws/connect! base-client)

    (start-heartbeat-scheduler! nous-client 30000)

    nous-client))
