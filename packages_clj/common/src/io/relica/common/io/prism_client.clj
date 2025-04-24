(ns io.relica.common.io.prism-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :as async :refer [go-loop <! timeout]]
            [clojure.tools.logging :as log]))

(defprotocol PrismClientProtocol
  "Protocol for interacting with the Prism service"
  (get-setup-status [this] "Gets the current setup status")
  (start-setup [this] "Starts the setup process")
  (create-admin-user [this username password confirm-password] "Creates an admin user")
  (process-setup-stage [this] "Processes the current setup stage")
  (connected? [this] "Checks if the client is connected")
  (send-heartbeat! [this] "Sends a heartbeat message to the connected listeners"))

(defrecord PrismClient [ws-client state]
  PrismClientProtocol
  
  (get-setup-status [this]
    (log/debug "Getting Prism setup status")
    (ws/send-message! ws-client :setup-status/get {} 5000))
  
  (start-setup [this]
    (log/info "Starting Prism setup")
    (ws/send-message! ws-client "setup/start" {} 5000))
  
  (create-admin-user [this username password confirm-password]
    (log/info "Creating admin user:" username)
    (ws/send-message! ws-client "setup/create-user" 
                      {:username username
                       :password password
                       :confirmPassword confirm-password} 
                      5000))
  
  (process-setup-stage [this]
    (log/info "Processing current setup stage")
    (ws/send-message! ws-client "setup/process-stage" {} 900000)) ;; 15 minutes

  (connected? [this]
    (ws/connected? ws-client))

  (send-heartbeat! [this]
    (tap> {:event :app/sending-heartbeat})
    (ws/send-message! ws-client :app/heartbeat
                            {:timestamp (System/currentTimeMillis)}
                            30000)))

;; Heartbeat scheduler
(defn start-heartbeat-scheduler! [prism-client interval-ms]
  (let [running (atom true)
        scheduler (go-loop []
                    (<! (timeout interval-ms))
                    (when @running
                      (send-heartbeat! prism-client)
                      (recur)))]
    ;; Return a function that stops the scheduler
    #(do (reset! running false)
         (async/close! scheduler))))

(defn create-client
  "Creates a new Prism client.
   
   Required options:
   - :host - Prism host
   - :port - Prism port
   
   Optional:
   - :auto-reconnect - Whether to automatically reconnect (default: true)
   - :reconnect-delay - Delay before reconnecting in ms (default: 5000)
   - :handlers - Map of message type to handler functions"
  [{:keys [handlers host port] :as options}]
   (when (or (nil? host) (nil? port))
     (throw (IllegalArgumentException. "Host and port are required for Prism client")))
   
   (let [uri (str "ws://" host ":" port "/ws")
         default-handlers {:on-connect #(tap> {:event :app/connected})
                           :on-disconnect #(tap> {:event :app/disconnected})
                           :on-message (fn [event-type payload]
                                        (tap> {:event :app/message-received
                                               :type event-type}))}
         merged-handlers (merge default-handlers handlers)
         base-client (ws/create-client {:service-name "prism"
                                        :uri uri
                                        :handlers merged-handlers})
         prism-client (->PrismClient base-client {:timeout 5000
                                                  :auto-reconnect true
                                                  :reconnect-delay 5000})]

     (ws/register-handler! base-client :setup/update (:handle-setup-state-update handlers))

     ;; Connect the WebSocket client
     (ws/connect! base-client)
     
     ;; Return the Prism client
     (start-heartbeat-scheduler! prism-client 30000)

     prism-client))

(defn disconnect-client [client]
  "Disconnects the Prism client"
  (when-let [ws-client (:ws-client client)]
    (ws/disconnect! ws-client)))
