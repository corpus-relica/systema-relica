(ns io.relica.common.io.prism-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :refer [<! go timeout]]
            [clojure.tools.logging :as log]))

(defprotocol PrismClientProtocol
  "Protocol for interacting with the Prism service"
  (get-setup-status [this] "Gets the current setup status")
  (start-setup [this] "Starts the setup process")
  (create-admin-user [this username password confirm-password] "Creates an admin user")
  (process-setup-stage [this] "Processes the current setup stage")
  (connected? [this] "Checks if the client is connected"))

(defrecord PrismClient [ws-client state]
  PrismClientProtocol
  
  (get-setup-status [this]
    (log/debug "Getting Prism setup status")
    (ws/send-message! ws-client "setup/status" {} 5000))
  
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
    (ws/connected? ws-client)))

(defn create-client
  "Creates a new Prism client.
   
   Required options:
   - :host - Prism host
   - :port - Prism port
   
   Optional:
   - :auto-reconnect - Whether to automatically reconnect (default: true)
   - :reconnect-delay - Delay before reconnecting in ms (default: 5000)
   - :handlers - Map of message type to handler functions"
  [{:keys [host port] :as options}]
   (when (or (nil? host) (nil? port))
     (throw (IllegalArgumentException. "Host and port are required for Prism client")))
   
   (let [ws-uri (str "ws://" host ":" port "/ws")
         connection-options {:auto-reconnect true
                             :reconnect-delay 5000
                             :format "nippy"}
         handlers (or (:handlers options) {})
         client-options (merge connection-options
                               options
                               {:uri ws-uri
                                :service-name "prism"
                                :handlers handlers})
         ws-client (ws/create-client client-options)]
     
     (log/info "Creating Prism client with URI:" ws-uri)
     
     ;; Connect the WebSocket client
     (ws/connect! ws-client)
     
     ;; Return the Prism client
     (->PrismClient ws-client (atom {}))))

(defn disconnect-client [client]
  "Disconnects the Prism client"
  (when-let [ws-client (:ws-client client)]
    (ws/disconnect! ws-client)))
