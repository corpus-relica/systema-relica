;; src/io/relica/portal/io/ws_test.clj
(ns io.relica.portal.io.ws-test
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :as async :refer [go go-loop <! >! chan timeout]]
            [cheshire.core :as json])
  (:import [java.net URI]
           [org.java_websocket.client WebSocketClient]
           [org.java_websocket.handshake ServerHandshake]))

;; Store pending requests
(defonce pending-requests (atom {}))

;; Connection state
(defonce client-state (atom {:connected? false
                            :client nil}))

;; Create WebSocket client
(defn create-ws-client []
  (let [uri (URI. "ws://localhost:3000/ws")]  ; Updated path to match server
    (proxy [WebSocketClient] [uri]
      (onOpen [^ServerHandshake handshake]
        (log/info "Connection opened")
        (log/debug "Handshake status:" (.getHttpStatus handshake))
        (log/debug "Handshake status message:" (.getHttpStatusMessage handshake))
        (swap! client-state assoc :connected? true))

      (onClose [code reason remote]
        (log/info "Connection closed:" code reason remote)
        (swap! client-state assoc :connected? false))

      (onMessage [message]
        (try
          (let [response (json/parse-string message true)
                {:keys [id type payload error]} response]  ; Added error to destructuring
            (log/debug "Received message:" response)

            ;; Handle different response types
            (case type
              "response" (when-let [promise-ch (get @pending-requests id)]
                          (async/put! promise-ch payload)
                          (swap! pending-requests dissoc id))

              "error" (when-let [promise-ch (get @pending-requests id)]
                       (async/put! promise-ch {:error (or error "Unknown error")})
                       (swap! pending-requests dissoc id))

              ;; Default case
              (log/warn "Unknown message type:" type)))
          (catch Exception e
            (log/error "Error handling message:" e))))

      (onError [ex]
        (log/error "WebSocket error:" ex)
        (log/error "Error message:" (.getMessage ex))))))

;; Helper function to make requests
(defn make-request [type payload timeout-ms]
  (if-not (:connected? @client-state)
    (throw (ex-info "Not connected" {:error :not-connected}))
    (let [id (str (random-uuid))
          promise-ch (async/promise-chan)
          request {:id id
                  :type type
                  :payload payload}]
      (log/debug "Sending request:" request)
      ;; Store the promise channel
      (swap! pending-requests assoc id promise-ch)

      ;; Send the request
      (.send ^WebSocketClient (:client @client-state)
             (json/generate-string request))

      ;; Return a channel that will complete with timeout
      (go
        (let [[response port] (async/alts! [promise-ch (timeout timeout-ms)])]
          (if (= port promise-ch)
            response
            (do
              (swap! pending-requests dissoc id)
              {:error "Request timed out"})))))))

;; Connection management
(defn connect! []
  (when-not (:client @client-state)
    (let [client (create-ws-client)]
      (log/info "Connecting to WebSocket server...")
      (swap! client-state assoc :client client)
      (.connect client)
      (Thread/sleep 1000) ; Wait a bit for connection
      (if (:connected? @client-state)
        (log/info "Successfully connected")
        (log/warn "Connection not established after timeout"))
      client)))

(defn disconnect! []
  (when-let [client (:client @client-state)]
    (.close client)
    (swap! client-state assoc :client nil :connected? false)))

;; API Functions
(defn get-kinds [{:keys [sort range filter user-id]}]
  (make-request "getKinds"
                {:sort sort
                 :range range
                 :filter filter
                 :userId user-id}
                5000))

;; Test function
(defn test-connection []
  (connect!)
  (go
    (println "Testing connection...")
    (let [response (<! (get-kinds {:sort ["name" "ASC"]
                                  :range [0 10]
                                  :filter {}
                                  :user-id "test"}))]
      (println "Got response:" response))))

;; REPL helpers
(comment
  ;; Test the connection
  (test-connection)

  ;; Manual tests
  (connect!)

  ;; Check state
  @client-state

  ;; Test request
  (go
    (let [response (<! (get-kinds {:sort ["name" "ASC"]
                                  :range [0 10]
                                  :filter {}
                                  :user-id "test"}))]
      (println "Got response:" response)))

  ;; Cleanup
  (disconnect!)

  )
