(ns io.relica.common.io.nous-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :as async :refer [go-loop <! timeout]]
            [clojure.tools.logging :as log]))


(defprotocol NOUSOperations
  (send-heartbeat! [this])
  (user-input [this user-id env-id user-message]))

(defrecord NOUSClient [ws-client options]
  NOUSOperations

  (send-heartbeat! [this]
    (tap> {:event :app/sending-heartbeat})
    (ws/send-message! ws-client :app/heartbeat
                            {:timestamp (System/currentTimeMillis)}
                            3000))

  (user-input [this user-id env-id user-message]
    (print {:event :app/sending-user-input})
    (ws/send-message! ws-client :app/user-input
                            {:user-id user-id
                             :env-id env-id
                             :message user-message}
                            3000))
  )

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

(def default-timeout 5000)
;; Factory function
(defn create-client
  [{:keys [timeout handlers host port] :or {timeout default-timeout} :as opts}]
  (let [uri (str "ws://" host ":" port "/ws")
        default-handlers {:on-connect #(tap> {:event :app/connected})
                          :on-disconnect #(tap> {:event :app/disconnected})
                          :on-message (fn [event-type payload]
                                        (tap> {:event :app/received-message
                                               :type event-type
                                               :payload payload}))}
        merged-handlers (merge default-handlers handlers)
        base-client (ws/create-client
                {:service-name "nous"
                 :uri uri
                 :format "json"
                 :handlers merged-handlers})
        nous-client (->NOUSClient base-client {:timeout timeout})]

    ;; Register application-specific event handlers
    (ws/register-handler! base-client ":final_answer" (:handle-final-answer handlers))
    ;; (ws/register-handler base-client :kind/model
    ;;                      (fn [payload]
    ;;                        (tap> {:event :app/handling-kind-model
    ;;                               :payload payload})))

    (ws/connect! base-client)

    (start-heartbeat-scheduler! nous-client 30000)

    nous-client))
