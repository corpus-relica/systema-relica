;; src/io/relica/common/websocket/client.clj
(ns io.relica.common.websocket.client
  (:require [clojure.tools.logging :as log]
            [cheshire.core :as json]
            [clojure.core.async :as async :refer [go go-loop <! >! chan timeout]])
  (:import [java.net URI]
           [org.java_websocket.client WebSocketClient]
           [org.java_websocket.handshake ServerHandshake]))

(defprotocol IWebSocketClient
  (send-message! [this type payload timeout-ms])
  (connect! [this])
  (disconnect! [this])
  (connected? [this]))

;; Add this helper function near the start of the file
(defn- queue-message! [options type payload timeout-ms promise-ch]
  (let [queued-msg {:type type
                    :payload payload
                    :timeout-ms timeout-ms
                    :promise-ch promise-ch
                    :queued-at (System/currentTimeMillis)}]
    (swap! (:message-queue options) conj queued-msg)
    (tap> {:event :client/message-queued
           :message (dissoc queued-msg :promise-ch)})))

;; Add this function to retry queued messages
(defn- retry-queued-messages! [client options]
  (let [queued @(:message-queue options)]
    (when (seq queued)
      (tap> {:event :client/retrying-messages
             :count (count queued)})
      (swap! (:message-queue options) empty)
      (doseq [{:keys [type payload timeout-ms promise-ch]} queued]
        (go
          (try
            (let [result (<! (send-message! client type payload timeout-ms))]
              (when promise-ch
                (async/put! promise-ch result)))
            (catch Exception e
              (when promise-ch
                (async/put! promise-ch {:error (.getMessage e)})))))))))

(defn- start-heartbeat! [client options]
  (let [heartbeat-ch (chan)]
    (swap! (:state options) assoc :heartbeat-ch heartbeat-ch)
    (go-loop []
      (when (<! heartbeat-ch)
        (<! (timeout (:heartbeat-interval-ms options)))
        (when (and (connected? client)
                  (:enabled? @(:state options)))  ; Only send heartbeat if enabled
          (try
            (let [response (<! (send-message! client "system:heartbeat" {} (:heartbeat-timeout-ms options)))]
              (when-not (:success response)
                (tap> {:event :client/heartbeat-failed :response response})
                (connect! client)))
            (catch Exception e
              (tap> {:event :client/heartbeat-error :error (.getMessage e)}))))
        (when (:enabled? @(:state options))  ; Only continue loop if enabled
          (recur))))))

(defn- start-reconnection-loop! [client options]
  (let [reconnect-ch (chan)]
    (swap! (:state options) assoc :reconnect-ch reconnect-ch)
    (go-loop []
      (<! (timeout (:reconnect-interval-ms options)))
      (when (and (not (connected? client))
                 (:enabled? @(:state options)))  ; Only reconnect if enabled
        (tap> {:event :client/attempting-reconnect})
        (try
          (connect! client)
          (catch Exception e
            (tap> {:event :client/reconnect-failed
                   :error (.getMessage e)}))))
      (when (:enabled? @(:state options))  ; Only continue loop if enabled
        (recur)))))

(defrecord RelicaWebSocketClient [uri options]
  IWebSocketClient
  (connected? [_]
    (get @(:state options) :connected?))

  (connect! [this]
    (swap! (:state options) assoc :enabled? true)  ; Enable on manual connect
    (when-let [old-client (get-in @(:state options) [:client])]
      (try
        (.close old-client)
        (catch Exception _)))  ; Ignore close errors
    (let [client ((:client-factory options) uri options)]
      (tap> {:event :client/connecting :uri uri})
      (swap! (:state options) assoc :client client)
      (.connect client)
      ;; Wait for initial connection
      (loop [attempts 0]
        (when (and (< attempts (:max-connect-attempts options))
                  (not (connected? this)))
          (Thread/sleep (:connect-retry-ms options))
          (recur (inc attempts))))
      (when (connected? this)
        (tap> {:event :client/connected})
        ;; Trigger heartbeat
        (when-let [heartbeat-ch (:heartbeat-ch @(:state options))]
          (async/put! heartbeat-ch true))
        ;; Retry queued messages
        (retry-queued-messages! this options))
      client))

  (disconnect! [this]
    (let [{:keys [client heartbeat-ch reconnect-ch]} @(:state options)]
      (swap! (:state options) assoc :enabled? false)  ; Disable on manual disconnect
      (when heartbeat-ch
        (async/close! heartbeat-ch))
      (when reconnect-ch
        (async/close! reconnect-ch))
      (when client
        (try
          (.close client)
          (catch Exception e
            (tap> {:event :client/disconnect-error
                   :error (.getMessage e)}))))
      (swap! (:state options) assoc
             :client nil
             :connected? false
             :heartbeat-ch nil
             :reconnect-ch nil)
      (tap> {:event :client/disconnected})))

  (send-message! [_ type payload timeout-ms]
    (let [promise-ch (async/promise-chan)]
      (if-not (connected? _)
        (do
          (tap> {:event :client/message-delayed
                 :reason :not-connected
                 :type type})
          (queue-message! options type payload timeout-ms promise-ch)
          promise-ch)
        (let [id (str (random-uuid))
              request {:id id
                      :type type
                      :payload payload}]
          (tap> {:event :client/sending-message
                 :request request})
          (swap! (:pending-requests options) assoc id promise-ch)
          (.send ^WebSocketClient (get-in @(:state options) [:client])
                 (if (= (:write-mode options) :json)
                   (json/generate-string request)
                   (pr-str request)))
          (go
            (let [[response port] (async/alts! [promise-ch (timeout timeout-ms)])]
              (if (= port promise-ch)
                response
                (do
                  (swap! (:pending-requests options) dissoc id)
                  {:error "Request timed out"})))))))))

(defn create-default-client-factory [{:keys [handlers read-mode write-mode]}]
  (fn [uri options]
    (proxy [WebSocketClient] [uri]
      (onOpen [^ServerHandshake handshake]
        (tap> {:event :client/websocket-opened})
        (swap! (:state options) assoc :connected? true)
        (when-let [on-open (:on-open handlers)]
          (try
            (on-open handshake)
            (catch Exception e
              (tap> {:event :client/handler-error
                     :handler :on-open
                     :error (.getMessage e)})))))

      (onClose [code reason remote]
        (tap> {:event :client/websocket-closed
               :code code
               :reason reason})
        (swap! (:state options) assoc :connected? false)
        (when-let [on-close (:on-close handlers)]
          (try
            (on-close code reason remote)
            (catch Exception e
              (tap> {:event :client/handler-error
                     :handler :on-close
                     :error (.getMessage e)})))))

      (onMessage [message]
        (try
          (let [response (if (= read-mode :json)
                           (json/parse-string message true)
                           (read-string message))
                {:keys [id type payload error]} response]
            (tap> {:event :client/message-received
                   :response response})
            (case type
              "response" (when-let [promise-ch (get @(:pending-requests options) id)]
                          (async/>!! promise-ch payload)
                          (swap! (:pending-requests options) dissoc id))
              "error" (when-let [promise-ch (get @(:pending-requests options) id)]
                       (async/>!! promise-ch {:error (or error "Unknown error")})
                       (swap! (:pending-requests options) dissoc id))
              (when-let [on-message (:on-message handlers)]
                (try
                  (on-message response)
                  (catch Exception e
                    (tap> {:event :client/handler-error
                           :handler :on-message
                           :error (.getMessage e)}))))))
          (catch Exception e
            (tap> {:event :client/message-error
                   :error (.getMessage e)}))))

      (onError [ex]
        (tap> {:event :client/websocket-error
               :error (.getMessage ex)})
        (when-let [on-error (:on-error handlers)]
          (try
            (on-error ex)
            (catch Exception e
              (tap> {:event :client/handler-error
                     :handler :on-error
                     :error (.getMessage e)}))))))))

(defn create-client
  ([uri]
   (create-client uri {}))
  ([uri {:keys [handlers
                max-connect-attempts
                connect-retry-ms
                heartbeat-interval-ms
                heartbeat-timeout-ms
                reconnect-interval-ms
                read-mode
                write-mode]
         :or {max-connect-attempts 5
              connect-retry-ms 1000
              heartbeat-interval-ms 30000    ; 30 seconds between heartbeats
              heartbeat-timeout-ms 5000      ; 5 second timeout for heartbeat response
              reconnect-interval-ms 5000     ; Check connection every 5 seconds
              read-mode :edn
              write-mode :edn
              handlers {}}                   ; All handlers are optional
         :as opts}]
   (let [state (atom {:connected? false
                     :client nil
                     :heartbeat-ch nil
                     :reconnect-ch nil
                     :enabled? true})
         pending-requests (atom {})
         message-queue (atom [])  ; Add message queue
         options (merge opts
                       {:state state
                        :pending-requests pending-requests
                        :message-queue message-queue  ; Include in options
                        :max-connect-attempts max-connect-attempts
                        :connect-retry-ms connect-retry-ms
                        :heartbeat-interval-ms heartbeat-interval-ms
                        :heartbeat-timeout-ms heartbeat-timeout-ms
                        :reconnect-interval-ms reconnect-interval-ms
                        :read-mode read-mode
                        :write-mode write-mode
                        :client-factory (create-default-client-factory opts)})
         client (->RelicaWebSocketClient (URI. uri) options)]
     ;; Start both heartbeat and reconnection loops
     (start-heartbeat! client options)
     (start-reconnection-loop! client options)
     client)))
