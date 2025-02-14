;; src/io/relica/common/websocket/server.clj
(ns io.relica.common.websocket.server
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :as async :refer [go go-loop <! >! chan close!]])
  (:import [org.java_websocket.server WebSocketServer]
           [org.java_websocket.handshake ClientHandshake]
           [org.java_websocket WebSocket]
           [java.net InetSocketAddress]))

(defprotocol IWebSocketServer
  (start! [this])
  (stop! [this])
  (broadcast! [this message])
  (send! [this client-id message]))

(defrecord RelicaWebSocketServer [options]
  IWebSocketServer
  (start! [_]
    (when-not (:server @(:state options))
      (let [server ((:server-factory options) options)]
        (tap> {:event :server/starting
               :port (:port options)
               :options (dissoc options :server-factory)})
        (swap! (:state options) assoc :server server)
        (.start server)
        (tap> {:event :server/started
               :port (:port options)})
        server)))

  (stop! [_]
      (when-let [server (:server @(:state options))]
        (tap> {:event :server/stopping})
        ;; First close all client connections
        (doseq [conn (.getConnections server)]
          (try
            (.close conn)
            (catch Exception e
              (tap> {:event :server/client-close-error
                     :error (.getMessage e)}))))
        ;; Close all channels
        (doseq [[_ ch] @(:client-channels options)]
          (close! ch))
        ;; Stop the server
        (try
          (.stop server 1000)  ; Give it 1 second to shutdown
          (catch Exception e
            (tap> {:event :server/stop-error
                   :error (.getMessage e)})))
        ;; Clear state
        (swap! (:state options) assoc :server nil)
        (swap! (:clients options) empty)
        (swap! (:client-channels options) empty)
        ;; Add a small delay to ensure port is released
        (Thread/sleep 1000)
        (tap> {:event :server/stopped})))

  (broadcast! [_ message]
    (when-let [server (:server @(:state options))]
      (let [edn-msg (pr-str message)]
        (tap> {:event :server/broadcasting
               :message message})
        (doseq [conn (.getConnections server)]
          (.send conn edn-msg)))))

  (send! [_ client-id message]
    (when-let [server (:server @(:state options))]
      (when-let [conn (get @(:clients options) client-id)]
        (tap> {:event :server/sending
               :client-id client-id
               :message message})
        (.send conn (pr-str message))))))

(defn handle-incoming-message! [message conn options]
  (try
    (let [{:keys [id type payload]} (read-string message)
          handler (get-in options [:handlers type])]
      (tap> {:event :websocket/handling-message
             :message-type type
             :has-handler? (boolean handler)})
      (if handler
        (go
          (try
            (let [result (<! (handler payload))
                  response {:id id
                          :type "response"
                          :payload result}]
              (tap> {:event :websocket/handler-response
                     :response response})
              (.send conn (pr-str response)))
            (catch Exception e
              (tap> {:event :websocket/handler-error
                     :error (.getMessage e)})
              (.send conn (pr-str
                         {:id id
                          :type "error"
                          :error (.getMessage e)})))))
        (do
          (tap> {:event :websocket/unknown-message-type
                 :type type})
          (.send conn (pr-str
                      {:id id
                       :type "error"
                       :error (str "Unknown message type: " type)})))))
    (catch Exception e
      (tap> {:event :websocket/parse-error
             :error (.getMessage e)})
      (.send conn (pr-str
                  {:type "error"
                   :error "Invalid message format"})))))

(defn create-default-server-factory []
  (fn [{:keys [port state clients client-channels handlers] :as options}]
    (proxy [WebSocketServer] [(InetSocketAddress. port)]
      (onStart []
        (tap> {:event :websocket/started
               :port port}))

      (onOpen [^WebSocket conn ^ClientHandshake handshake]
        (tap> {:event :websocket/connecting
               :remote-addr (str (.getRemoteSocketAddress conn))})
        (try
          (let [client-id (str (random-uuid))
                client-ch (chan)]
            (tap> {:event :websocket/connected
                   :client-id client-id
                   :remote-addr (str (.getRemoteSocketAddress conn))})
            (swap! clients assoc client-id conn)
            (swap! client-channels assoc client-id client-ch)
            ;; Handle client channel messages
            (go-loop []
              (when-let [msg (<! client-ch)]
                (.send conn (pr-str msg))
                (recur))))
          (catch Exception e
            (tap> {:event :websocket/error
                   :phase :open
                   :error (.getMessage e)
                   :stacktrace (with-out-str (.printStackTrace e))}))))

      (onClose [^WebSocket conn code reason remote]
        (try
          (let [client-id (some (fn [[id c]] (when (= c conn) id)) @clients)]
            (when client-id
              (tap> {:event :websocket/closed
                     :client-id client-id
                     :code code
                     :reason reason
                     :remote remote})
              (swap! clients dissoc client-id)
              (when-let [ch (get @client-channels client-id)]
                (close! ch)
                (swap! client-channels dissoc client-id))))
          (catch Exception e
            (tap> {:event :websocket/error
                   :phase :close
                   :error (.getMessage e)
                   :stacktrace (with-out-str (.printStackTrace e))}))))

      (onMessage [^WebSocket conn ^String message]
        (tap> {:event :websocket/message-received
               :remote-addr (str (.getRemoteSocketAddress conn))
               :message message})
        (handle-incoming-message! message conn options))

      (onError [^WebSocket conn ^Exception ex]
        (tap> {:event :websocket/error
               :remote-addr (when conn (str (.getRemoteSocketAddress conn)))
               :error (.getMessage ex)
               :stacktrace (with-out-str (.printStackTrace ex))})))))

(def system-handlers
  {"system:heartbeat" (fn [_]
                       (go {:success true}))})

(defn create-server
  ([port]
   (create-server port {}))
  ([port {:keys [handlers]
          :or {handlers {}}
          :as opts}]
   (let [state (atom {:server nil})
         clients (atom {})
         client-channels (atom {})
         options (merge opts
                       {:port port
                        :state state
                        :clients clients
                        :client-channels client-channels
                        :handlers (merge system-handlers handlers)
                        :server-factory (create-default-server-factory)})]
     (->RelicaWebSocketServer options))))
