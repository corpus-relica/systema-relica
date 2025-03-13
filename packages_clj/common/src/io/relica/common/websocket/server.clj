
(ns io.relica.common.websocket.server
  (:require [org.httpkit.server :as http-kit]
            [compojure.core :refer [GET defroutes]]
            [compojure.route :as route]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.keyword-params :refer [wrap-keyword-params]]
            [clojure.tools.logging :as log]
            [clojure.core.async :refer [go go-loop <! >! timeout chan close!]]
            [io.relica.common.websocket.format :as format]))

;; Store connected clients
(defonce connected-clients (atom {}))

;; Store connected UIDs for Sente-like API compatibility
(defonce connected-uids (atom {:ws #{}, :ajax #{}, :any #{}}))

;; Message handlers
(defonce message-handlers (atom {}))

;; Define multimethod for handling WebSocket messages
(defmulti handle-ws-message :id)

;; Default handler for unknown message types
(defmethod handle-ws-message :default [message]
  (log/warn "No handler found for message type:" (:id message))
  (go {:error (str "No handler found for message type: " (:id message))}))

;; Default handler for messages with no registered handler
(defn default-handler [message]
  (log/warn "No handler registered for message type:" (:type message))
  (go {:error (str "No handler registered for message type: " (:type message))}))

;; Protocol for WebSocket server
(defprotocol WebSocketServerProtocol
  (start! [this])
  (stop! [this])
  (send! [this client-id message])
  (broadcast! [this message])
  (get-connected-client-ids [this])
  (get-client-info [this client-id])
  (count-connected-clients [this])
  (register-handler! [this msg-type handler-fn])
  (unregister-handler! [this msg-type]))

;; Handle ping messages immediately without going through the handler system
(defn- handle-ping [channel client-data message]
  (let [response {:id (:id message)
                  :type "pong"
                  :payload {:server-time (System/currentTimeMillis)
                            :received-at (System/currentTimeMillis)}}
        response-str (format/serialize-message client-data response)]
    (http-kit/send! channel response-str)))

;; WebSocket handler function
(defn ws-handler [req]
  (http-kit/with-channel req channel
    (let [client-id (str (java.util.UUID/randomUUID))
          ;; Extract format preferences from query params or headers
          client-format (or (get-in req [:params :format])
                            (get-in req [:headers "x-ws-format"])
                            "json")
          client-language (or (get-in req [:params :language])
                              (get-in req [:headers "x-ws-language"])
                              "unknown")
          client-data {:channel channel
                       :connected-at (System/currentTimeMillis)
                       :format client-format
                       :language client-language}
          event-msg-handler (get-in req [:ws-server :event-msg-handler])]

      ;; Store client information
      (swap! connected-clients assoc client-id client-data)

      ;; Update connected UIDs (for Sente-like API compatibility)
      (swap! connected-uids update-in [:ws] conj client-id)
      (swap! connected-uids update-in [:any] conj client-id)

      ;; Log connection
      (println "Client connected:" client-id "format:" client-format "language:" client-language)

      (http-kit/send! channel (format/serialize-message client-data {:id "12345"
                                                                     :type "system:clientRegistered"
                                                                     :payload {:client-id client-id}}))
      ;; Handle incoming messages
      (http-kit/on-receive channel
                           (fn [data]
                             (try
                               ;; Parse the message using client's preferred format
                               (let [message (format/deserialize-message
                                              (get @connected-clients client-id)
                                              data)
                                     msg-type (:type message)
                                     msg-id (:id message)]

                                 (log/debug "Received message:" message)

                                 (cond
                                   ;; Handle ping messages immediately
                                   (= msg-type "ping")
                                   (handle-ping channel (get @connected-clients client-id) message)

                                   ;; Use custom event handler if provided
                                   event-msg-handler
                                   (let [event-msg {:id (keyword msg-type)
                                                    :?data (:payload message)
                                                    :client-id client-id
                                                    :?reply-fn (fn [response]
                                                                 (let [resp {:id msg-id
                                                                             :type "response"
                                                                             :payload response}
                                                                       _ (println "!!!!!! Response:" resp)
                                                                       resp-str (format/serialize-message
                                                                                 (get @connected-clients client-id)
                                                                                 resp)]
                                                                   (println "!!!!!! client-id:" client-id)
                                                                   (println "!!!!!! Response string:" resp-str)
                                                                   (http-kit/send! channel resp-str)))}]
                                     (event-msg-handler event-msg))

                                   ;; Try multimethod dispatch
                                   :else
                                   (let [;; Prepare message for multimethod dispatch
                                         multimethod-msg {:id (keyword msg-type)
                                                          :?data (:payload message)
                                                          :client-id client-id
                                                          :?reply-fn (fn [response]
                                                                       (let [resp {:id msg-id
                                                                                   :type "response"
                                                                                   :payload response}
                                                                             _ (println "@@@@@@ Response, nukkah:" resp)
                                                                             resp-str (format/serialize-message
                                                                                       (get @connected-clients client-id)
                                                                                       resp)]
                                                                         (println "@@@@@@ client-id, nukkah:" client-id)
                                                                         (println "@@@@@@ Response string, nukkah:" resp-str)
                                                                         (http-kit/send! channel resp-str)))}]
                                     ;; Check if there's a multimethod handler for this message type
                                     (if (get (methods handle-ws-message) (keyword msg-type))
                                       ;; Use multimethod dispatch
                                       (handle-ws-message multimethod-msg)

                                       ;; Fall back to registered handler
                                       (if-let [handler (get @message-handlers msg-type)]
                                         ;; Handler exists, process message
                                         (go
                                           (try
                                             (let [result (<! (handler message))]
                                               ;; Send response if there's a result
                                               (when result
                                                 (let [response {:id msg-id
                                                                 :type "response"
                                                                 :payload result}
                                                       response-str (format/serialize-message
                                                                     (get @connected-clients client-id)
                                                                     response)]
                                                   (http-kit/send! channel response-str))))
                                             (catch Exception e
                                               (log/error "Error processing message:" (.getMessage e))
                                               (let [error-resp {:id msg-id
                                                                 :type "error"
                                                                 :payload {:error (str "Error processing message: " (.getMessage e))}}
                                                     error-str (format/serialize-message
                                                                (get @connected-clients client-id)
                                                                error-resp)]
                                                 (http-kit/send! channel error-str)))))
                                         ;; No handler found, use default handler
                                         (go
                                           (let [result (<! (default-handler message))]
                                             (when result
                                               (let [response {:id msg-id
                                                               :type "response"
                                                               :payload result}
                                                     response-str (format/serialize-message
                                                                   (get @connected-clients client-id)
                                                                   response)]
                                                 (http-kit/send! channel response-str))))))))))
                               (catch Exception e
                                 (log/error "Error parsing message:" (.getMessage e))
                                 (let [error-resp {:id "server"
                                                   :type "error"
                                                   :payload {:error (str "Error parsing message: " (.getMessage e))}}
                                       error-str (format/serialize-message
                                                  (get @connected-clients client-id)
                                                  error-resp)]
                                   (http-kit/send! channel error-str))))))

      ;; Client disconnect handler
      (http-kit/on-close channel
                         (fn [status]
                           (println "Client disconnected:" client-id "status:" status)
                           (swap! connected-clients dissoc client-id)
                           ;; Update connected UIDs (for Sente-like API compatibility)
                           (swap! connected-uids update-in [:ws] disj client-id)
                           (swap! connected-uids update-in [:any] disj client-id))))))

;; Routes for the WebSocket server
(defn create-routes [path event-msg-handler]
  (defroutes app-routes
    (GET path request
      (-> request
          (assoc-in [:ws-server :event-msg-handler] event-msg-handler)
          ws-handler))
    (route/not-found "404")))

;; WebSocket server implementation
(defrecord WebSocketServer [server-atom state options]
  WebSocketServerProtocol

  (start! [this]
    (let [{:keys [port path event-msg-handler]
           :or {port 3000 path "/ws"}} options]
      (println "Starting WebSocket server on port" port)
      (let [routes (create-routes path event-msg-handler)
            wrapped-routes (-> routes
                               wrap-keyword-params
                               wrap-params)
            server (http-kit/run-server wrapped-routes {:port port})]
        (reset! server-atom server)
        (println "WebSocket server started")
        this)))

  (stop! [this]
    (when-let [server @server-atom]
      (println "Stopping WebSocket server")
      (server)
      (reset! server-atom nil)
      (reset! connected-clients {})
      (reset! connected-uids {:ws #{}, :ajax #{}, :any #{}})
      (println "WebSocket server stopped")
      this))

  (send! [this client-id message]
    (if-let [client (get @connected-clients client-id)]
      (let [channel (:channel client)
            message-str (format/serialize-message client message)]
        (http-kit/send! channel message-str)
        true)
      (do
        (log/warn "Client not found:" client-id)
        false)))

  (broadcast! [this message]
    (let [client-count (count @connected-clients)]
      (println "Broadcasting message to" client-count "clients: type=" (:type message) ", payload=" (:payload message))
      (doseq [[client-id client] @connected-clients]
        (let [channel (:channel client)
              message-str (format/serialize-message client message)]
          (println "Sending message to client:" client-id)
          (println "Message:" message-str)
          (http-kit/send! channel message-str)))
      client-count))

  (get-connected-client-ids [this]
    (keys @connected-clients))

  (get-client-info [this client-id]
    (when-let [client (get @connected-clients client-id)]
      (dissoc client :channel)))

  (count-connected-clients [this]
    (count @connected-clients))

  (register-handler! [this msg-type handler-fn]
    (swap! message-handlers assoc msg-type handler-fn)
    this)

  (unregister-handler! [this msg-type]
    (swap! message-handlers dissoc msg-type)
    this))

;; Constructor function
(defn create-server
  ([]
   (create-server {}))
  ([options]
   (->WebSocketServer (atom nil)
                      (atom {:connected-uids connected-uids})
                      options)))

;; Helper functions
(defn get-connected-client-ids []
  (keys @connected-clients))

(defn get-client-info [client-id]
  (when-let [client (get @connected-clients client-id)]
    (dissoc client :channel)))

(defn count-connected-clients [server]
  (count-connected-clients server))
