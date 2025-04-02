(ns io.relica.common.websocket.client
  (:require [org.httpkit.client :as http]
            [clojure.core.async :refer [go go-loop <! >! timeout chan close! put! alt!]]
            [clojure.tools.logging :as log]
            [cheshire.core :as json]
            [io.relica.common.websocket.format :as format])
  (:import [java.net URI]
           [java.util UUID]
           [org.java_websocket.client WebSocketClient]
           [org.java_websocket.handshake ServerHandshake]))

;; Client state
(def ^:dynamic *message-handlers* (atom {}))
(defonce message-id-counter (atom 0))

;; Response handlers for request-response pattern
(defonce response-handlers (atom {}))

;; Constants for connection health monitoring
(def ^:private ping-interval 15000)  ; Send ping every 15 seconds
(def ^:private pong-timeout 5000)    ; Wait 5 seconds for pong response
(def ^:private max-missed-pongs 3)   ; Disconnect after 3 missed pongs

;; Protocol for WebSocket client
(defprotocol WebSocketClientProtocol
  (connect! [this])
  (disconnect! [this])
  (send-message! [this type payload timeout-ms])
  (register-handler! [this msg-type handler-fn])
  (unregister-handler! [this msg-type])
  (connected? [this]))

;; Default handler for unknown message types
(defn default-handler [message client-state]
  (log/warn "No handler found for message type:" (:type message))
  nil)

;; Generate a new message ID
(defn new-message-id []
  (swap! message-id-counter inc)
  (str (UUID/randomUUID)))

;; Helper to create a URI with format query parameter
(defn create-uri-with-format [uri-str format language]
  (let [base-uri (URI. uri-str)
        query (or (.getQuery base-uri) "")
        query-with-format (if (empty? query)
                            (str "format=" format "&language=" language)
                            (str query "&format=" format "&language=" language))
        path (.getPath base-uri)
        uri-with-format (URI. (.getScheme base-uri)
                              (.getAuthority base-uri)
                              path
                              query-with-format
                              (.getFragment base-uri))]
    uri-with-format))

;; Start ping/pong monitoring
(defn- start-ping-monitor! [client state]
  (let [ping-task (go
                    (loop []
                      (<! (timeout ping-interval))
                      (when (:connected @state)
                        (try
                          (let [ping-id (new-message-id)
                                pong-chan (chan)]
                            ;; Store pong handler
                            (swap! response-handlers assoc ping-id {:channel pong-chan
                                                                    :created (System/currentTimeMillis)})
                            ;; Send ping
                            (.send (:client @state)
                                   (format/serialize-message
                                    {:format (:format (:options @state) "edn")
                                     :language (:language (:options @state) "clojure")}
                                    {:id ping-id
                                     :type "ping"
                                     :payload {:timestamp (System/currentTimeMillis)}}))

                            ;; Wait for pong with timeout
                            (let [result (alt!
                                           pong-chan ([_] :pong-received)
                                           (timeout pong-timeout) ([_] :timeout))]
                              (swap! response-handlers dissoc ping-id)
                              (close! pong-chan)

                              (if (= result :timeout)
                                (let [missed (swap! state update :missed-pongs (fnil inc 0))]
                                  (log/warn "Missed pong response. Count:" missed)
                                  (when (>= missed max-missed-pongs)
                                    (log/error "Too many missed pongs. Disconnecting.")
                                    (disconnect! client)))
                                (swap! state assoc :missed-pongs 0))))
                          (catch Exception e
                            (log/error "Error in ping monitor:" (.getMessage e)))))
                      (recur)))]
    ;; Store task for cleanup
    (swap! state assoc :ping-task ping-task)))

;; Create a WebSocket client implementation
(defrecord JsonWebSocketClient [options state]

  WebSocketClientProtocol

  (connect! [this]
    (when-not (:client @state)
      (println "Connecting to WebSocket server at" (:uri options))

      (let [handlers (or (:handlers options) {})
            format (or (:format options) "nippy")
            language (or (:language options) "clojure")
            client-info {:format format :language language}
            base-uri (URI. (:uri options))
            uri (create-uri-with-format (:uri options) format language)
            client-id (atom nil)
            outer-this this  ;; Capture the outer this reference
            ws-client
            (proxy [WebSocketClient] [uri]
              (onOpen [^ServerHandshake handshake]
                (println "Connected to WebSocket server")
                (swap! state assoc :connected true)

                ;; Mark as no longer reconnecting
                (swap! state dissoc :reconnecting)

                ;; Clean up reconnection task if it exists
                (when-let [reconnect-task (:reconnect-task @state)]
                  (close! reconnect-task)
                  (swap! state dissoc :reconnect-task))

                ;; Start ping monitoring
                (start-ping-monitor! outer-this state))  ;; Use outer-this here too

              (onClose [code reason remote]
                (println "Disconnected from WebSocket server:" reason)
                (swap! state assoc :connected false)
                (swap! state dissoc :client-id :client)

                ;; Clean up ping monitor
                (when-let [ping-task (:ping-task @state)]
                  (close! ping-task))
                (swap! state dissoc :ping-task :missed-pongs)

                ;; If auto-reconnect is enabled and we're not already reconnecting
                (when (and (:auto-reconnect options) (not (:reconnecting @state)))
                  (let [reconnect-delay (or (:reconnect-delay options) 5000)]
                    (println "Starting reconnection process with delay of" (/ reconnect-delay 1000) "seconds")
                    ;; Mark that we're in reconnection mode
                    (swap! state assoc :reconnecting true)

                    (let [reconnect-task
                          (go-loop [attempts 1]
                            (when (:reconnecting @state) ;; Check if we should still be reconnecting
                              (<! (timeout reconnect-delay))
                              (println "Reconnection attempt" attempts)
                              ;;(try
                                ;; Attempt reconnection
                              (when-not (:client @state) ;; Only if we don't already have a client
                                (connect! outer-this))

                                ;; Check if connection was successful
                              (if (connected? outer-this)
                                (do
                                  (println "Successfully reconnected after" attempts "attempts")
                                  (swap! state dissoc :reconnecting)
                                  true) ;; Exit loop on success
                                (do
                                  (println "Reconnection failed, will retry in" (/ reconnect-delay 1000) "seconds")
                                  (recur (inc attempts))))
                                ;;(catch Exception e
                                ;;  (log/error "Error during reconnection attempt:" (.getMessage e))
                                ;;  (recur (inc attempts))))
                              ))]

                      ;; Store reconnection task for cleanup
                      (swap! state assoc :reconnect-task reconnect-task)))))

              (onMessage [message]
                (try
                  (let [parsed (format/deserialize-message client-info message)]
                    ;; (log/debug "Received message: " parsed)
                    ;; (log/debug "Message type: " (:type parsed))
                    ;; (log/debug "Message type type: " (type (:type parsed)))
                    ;; (log/debug "Message handlers: " @*message-handlers*)

                    (cond
                      ;; Client registration
                      (= (:type parsed) "system:clientRegistered")
                      (let [client-id (get-in parsed [:payload :client-id])]
                        (println "Registered with client ID:" client-id)
                        (swap! state assoc :client-id client-id)
                        (when-let [on-connect (:on-connect options)]
                          (on-connect client-id)))

                      ;; Response to a request
                      (= (:type parsed) "response")
                      (when-let [handler (get @response-handlers (:id parsed))]
                        (put! (:channel handler) (:payload parsed))
                        (swap! response-handlers dissoc (:id parsed)))

                      ;; Pong response
                      (= (:type parsed) "pong")
                      (when-let [handler (get @response-handlers (:id parsed))]
                        (put! (:channel handler) (:payload parsed))
                        (swap! response-handlers dissoc (:id parsed)))

                      ;; Error response
                      (= (:type parsed) "error")
                      (if-let [handler (get @response-handlers (:id parsed))]
                        (do
                          (put! (:channel handler) (:payload parsed))
                          (swap! response-handlers dissoc (:id parsed)))
                        (log/error "Error from server:" (:payload parsed)))

                      ;; Regular message
                      :else
                      (if-let [handler (get @*message-handlers* (:type parsed))]
                        ;; (handler parsed outer-this)  ;; Use outer-this here too
                        (handler parsed)
                        (default-handler parsed @state))))
                  (catch Exception e
                    (log/error "Error processing message:" (.getMessage e)))))

              (onError [e]
                (log/error "WebSocket error:" (.getMessage e))))]

        ;; Store initial handlers
        (doseq [[type handler] handlers]
          (register-handler! outer-this type handler))  ;; Use outer-this here too

        ;; Connect the client
        (doto ws-client
          (.setConnectionLostTimeout 0) ; Disable automatic ping
          (.connect))

        ;; Store the client
        (swap! state assoc
               :client ws-client
               :options options)

        true)))

  (disconnect! [this]
    (when-let [client (:client @state)]
      (println "Disconnecting from WebSocket server")
      (.close client)
      (swap! state dissoc :client :client-id)
      (swap! state assoc :connected false)

      ;; First, stop reconnection attempts
      (swap! state dissoc :reconnecting)

      ;; Clean up ping monitor
      (when-let [ping-task (:ping-task @state)]
        (close! ping-task))
      (swap! state dissoc :ping-task :missed-pongs)

      ;; Clean up reconnection task
      (when-let [reconnect-task (:reconnect-task @state)]
        (close! reconnect-task))
      (swap! state dissoc :reconnect-task)

      ;; Clean up response handlers
      (doseq [[_ handler] @response-handlers]
        (close! (:channel handler)))
      (reset! response-handlers {})

      true))

  (send-message! [this type payload timeout-ms]
    (let [result-chan (chan 1)
          message-id (new-message-id)]

      ;; Register response handler
      (swap! response-handlers assoc message-id {:channel result-chan
                                                 :created (System/currentTimeMillis)})

      ;; Send the request
      (if-let [client (:client @state)]
        (let [message {:id message-id
                       :type type
                       :payload payload}
              client-info {:format (:format options "edn")
                           :language (:language options "clojure")}
              message-str (format/serialize-message client-info message)]
          (log/debug "Sending request:" message)
          (.send client message-str)

          ;; Wait for response with timeout
          (go
            (alt!
              result-chan ([result] result)
              (timeout timeout-ms)
              ([_]
               (do
                 (swap! response-handlers dissoc message-id)
                 {:error "Request timed out"
                  :request {:type type
                            :payload payload}})))))

        ;; Not connected
        (do
          (close! result-chan)
          (go {:error "Not connected to server"})))))

  (register-handler! [this msg-type handler-fn]
    (swap! *message-handlers* assoc msg-type handler-fn)
    this)

  (unregister-handler! [this msg-type]
    (swap! *message-handlers* dissoc msg-type)
    this)

  (connected? [this]
    (and (:client @state)
         (:connected @state))))

;; Constructor function
(defn create-client
  "Create a new JSON WebSocket client.

   Options:
   - :uri              - WebSocket server URI (e.g., \"ws://localhost:3000/ws\")
   - :auto-reconnect   - Whether to automatically reconnect (default: true)
   - :reconnect-delay  - Delay before reconnecting in ms (default: 5000)
   - :heartbeat        - Whether to send heartbeat messages (default: true)
   - :heartbeat-interval - Interval between heartbeats in ms (default: 30000)
   - :handlers         - Map of message type to handler functions
   - :on-connect       - Function to call when client is registered with client-id
   - :format           - Message format to use: \"edn\" or \"json\" (default: \"edn\")
   - :language         - Client language identifier (default: \"clojure\")"
  [options]
  (let [default-options {:auto-reconnect true
                         :reconnect-delay 5000
                         :heartbeat true
                         :heartbeat-interval 30000
                         :format "nippy"
                         :language "clojure"}
        full-options (merge default-options options)]
    (->JsonWebSocketClient full-options (atom {:connected false}))))

;; Helper functions
(defn get-client-id [client]
  (:client-id @(:state client)))

;; Convenience macro for with-client
(defmacro with-client
  "Create, connect, and use a client, then disconnect when done.

   Example:
   (with-client [client {:uri \"ws://localhost:3000/ws\"}]
     (send-message! client \"status\" {:query \"status\"}))"
  [[binding-name options] & body]
  `(let [~binding-name (create-client ~options)]
     (try
       (connect! ~binding-name)
       ~@body
       (finally
         (disconnect! ~binding-name)))))
