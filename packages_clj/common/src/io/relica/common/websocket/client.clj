
(ns io.relica.common.websocket.client
  (:require [taoensso.sente :as sente]
            [clojure.core.async :as async :refer [go go-loop <! >! timeout chan]]
            [clojure.tools.logging :as log]))

;; Helper functions for state validation and error handling
(defn- check-state
  "Checks if the state atom contains valid data. Returns [valid? state-val]"
  [state event-name]
  (try
    (if-let [state-val @state]
      [true state-val]
      (do
        (tap> {:event (keyword "websocket" (name event-name))
               :status :error
               :reason :empty-state})
        [false nil]))
    (catch Exception e
      (tap> {:event (keyword "websocket" (name event-name))
             :status :error
             :reason :exception
             :message (.getMessage e)})
      [false nil])))

(defn- with-error-handling
  "Executes a function with standard error handling and tap> reporting"
  [event-name f]
  (try
    (f)
    (catch Exception e
      (tap> {:event (keyword "websocket" (name event-name))
             :status :error
             :reason :exception
             :message (.getMessage e)})
      nil)))

(defprotocol WebSocketClient
  (connect! [this])
  (disconnect! [this])
  (send-message! [this event-type payload timeout])
  (connected? [this])
  (register-handler! [this event-type handler-fn])
  (unregister-handler! [this event-type]))

(defn create-sente-client [{:keys [host port] :as uri} handlers]
  (let [{:keys [chsk ch-recv send-fn state] :as socket}
        (sente/make-channel-socket-client!
         "/chsk" nil
         {:type :ws
          :host (str host ":" port)
          :packer :edn})]
    {:socket socket
     :chsk chsk
     :ch-recv ch-recv
     :send-fn send-fn
     :state state}))

(defn start-client-router! [ch-recv handlers]
  (let [event-handlers (:event-handlers handlers)
        on-connect (:on-connect handlers)
        on-disconnect (:on-disconnect handlers)
        on-message (:on-message handlers)]
    (tap> " START CLIENT ROUTER !!!!!!!!!!!!!!!!!!!!!!!!!!!!!1 SKULLS AND CROSSBONES ")
    (tap> handlers)
    (go-loop []
      (when-let [{:keys [event] :as msg} (<! ch-recv)]
        (tap> {:type :websocket/received-message-NUKKAH
               :event event})
        (let [[ev-id ev-data] event]
          (case ev-id
            :chsk/state (let [{:keys [first-open? open?]} ev-data]
                          (cond
                            first-open? (when on-connect (on-connect))
                            (not open?) (when on-disconnect (on-disconnect))))

            :chsk/recv (let [event-type (first ev-data)
                             payload (second ev-data)]
                         ;; (tap> {:event :websocket/received
                         ;;        :event-type event-type
                         ;;        :payload payload})
                         (if-let [specific-handler (get @event-handlers event-type)]
                           (specific-handler payload)
                           (when on-message (on-message event-type payload))))
            :broadcast/message (let [payload ev-data
                                     type (get-in payload [:type])]
                                ;; (tap> {:event :websocket/received
                                ;;        :event-type :broadcast/message
                                ;;        :payload payload
                                ;;        :type type})
                                ;; (tap> @event-handlers)
                                (if-let [specific-handler (get @event-handlers type)]
                                  (specific-handler payload)
                                  (when on-message (:broadcast/message payload))))
            nil))
        (recur)))))

(defn format-event [event-type payload]
  (if (keyword? event-type)
    [event-type payload]
    [(keyword (str "client/" (name event-type))) payload]))

(defrecord SenteClient [uri options state]
  WebSocketClient
  (connect! [this]
    (with-error-handling :connect
      (fn []
        (let [[valid? current-state] (check-state state :connect)]
          (tap> {:event :websocket/connect-attempt
                 :has-socket? (and valid? (boolean (:socket current-state)))})

          (when (or (not valid?) (not (:socket current-state)))
            (let [_ (tap> "~~~~~~~~~~~~~ CONNECTING ~~~~~~~~~~~~~")
                  _ (tap> current-state)
                  _ (tap> state)
                  _ (tap> options)
                  event-handlers (atom (:event-handlers current-state))
                  handlers (assoc (:handlers options) :event-handlers event-handlers)
                  - (tap> "~~~~~~~~~~~~~ HANDLERS ~~~~~~~~~~~~~")
                  - (tap> handlers)
                  _ (tap> {:event :websocket/creating-sente-client
                           :uri uri})
                  sente-client (create-sente-client uri handlers)
                  _ (tap> {:event :websocket/sente-client-created
                           :has-chsk? (boolean (:chsk sente-client))
                           :has-ch-recv? (boolean (:ch-recv sente-client))})
                  router (start-client-router! (:ch-recv sente-client) handlers)]
              (reset! state (assoc sente-client
                                  :router router
                                  :event-handlers event-handlers))
              (tap> {:event :websocket/client-connected
                     :state-keys (keys @state)}))))))
    this)

  (disconnect! [this]
    (with-error-handling :disconnect
      (fn []
        (tap> {:event :websocket/disconnect-attempt})

        (let [[valid? state-val] (check-state state :disconnect)]
          (if valid?
            (let [chsk (:chsk state-val)
                  router (:router state-val)]
              (tap> {:event :websocket/disconnecting
                     :has-chsk? (boolean chsk)
                     :has-router? (boolean router)})

              (when chsk
                (try
                  (.close chsk)
                  (tap> {:event :websocket/chsk-closed})
                  (catch Exception e
                    (tap> {:event :websocket/chsk-close
                           :status :error
                           :message (.getMessage e)}))))

              (when router
                (try
                  (async/close! router)
                  (tap> {:event :websocket/router-closed})
                  (catch Exception e
                    (tap> {:event :websocket/router-close
                           :status :error
                           :message (.getMessage e)}))))

              (reset! state nil)
              (tap> {:event :websocket/disconnected})
              true)
            false)))))

  (connected? [this]
    (with-error-handling :connection-status
      (fn []
        (let [[valid? state-val] (check-state state :connection-status)]
          (if valid?
            (if-let [state-atom (:state state-val)]
              (let [connection-state @state-atom]
                (tap> {:event :websocket/connection-status
                       :open? (:open? connection-state)})
                (:open? connection-state))
              (do
                (tap> {:event :websocket/connection-status
                       :status :error
                       :reason :no-state-atom})
                false))
            false)))))

  (register-handler! [this event-type handler-fn]
    (with-error-handling :register-handler
      (fn []
        (tap> {:event :websocket/register-handler-attempt
               :event-type event-type
               :handler-fn handler-fn})
        (tap> state)
        (tap> (check-state state :register-handler))
        (let [[valid? state-val] (check-state state :register-handler)]
          (if valid?
            (if-let [event-handlers (:event-handlers state-val)]
              (let [new-event-handlers (assoc event-handlers event-type handler-fn)]

                (swap! state assoc :event-handlers new-event-handlers)
                (tap> {:event :websocket/handler-registered
                       :event-type event-type})
                true)
              (do
                (tap> {:event :websocket/register-handler
                       :status :error
                       :reason :no-event-handlers
                       :event-type event-type})
                false))
            false)))))

  (unregister-handler! [this event-type]
    (with-error-handling :unregister-handler
      (fn []
        (let [[valid? state-val] (check-state state :unregister-handler)]
          (if valid?
            (if-let [event-handlers (:event-handlers state-val)]
              (do
                (swap! event-handlers dissoc event-type)
                (tap> {:event :websocket/handler-unregistered
                       :event-type event-type})
                true)
              (do
                (tap> {:event :websocket/unregister-handler
                       :status :error
                       :reason :no-event-handlers
                       :event-type event-type})
                false))
            false)))))

  (send-message! [this event-type payload timeout-ms]
    (tap> {:event :websocket/send-attempt
           :event-type event-type
           :payload payload})

    (let [result-ch (chan)]
      (with-error-handling :send-message
        (fn []
          (let [connected (connected? this)]
            (if connected
              (let [[valid? state-val] (check-state state :send-message)]
                (if valid?
                  (if-let [send-fn (:send-fn state-val)]
                    (do
                      (tap> {:event :websocket/pre-send
                             :using-send-fn? true})
                      ;; Format event properly for Sente
                      (let [formatted-event (if (keyword? event-type)
                                              event-type
                                              (keyword "client" (name event-type)))]
                        (tap> {:event :websocket/sending
                               :formatted-event [formatted-event payload]})
                        (send-fn [formatted-event payload]
                                timeout-ms
                                (fn [reply]
                                  (tap> {:event :websocket/reply-received
                                         :reply reply})
                                  (go (>! result-ch reply))))))
                    (do
                      (tap> {:event :websocket/send-message
                             :status :error
                             :reason :no-send-fn})
                      (go (>! result-ch {:error "Send function not available"}))))
                  (go (>! result-ch {:error "Client state not initialized"}))))
              (do
                (tap> {:event :websocket/send-message
                       :status :error
                       :reason :not-connected})
                (go (>! result-ch {:error "Not connected"})))))))

      ;; Always return the channel, even if error occurred
      result-ch)))

(defn parse-uri [uri]
  (if-let [[_ host port] (re-matches #"(?:https?://|ws://)?([^:/]+)(?::(\d+))?" uri)]
    {:host host
     :port (Integer/parseInt (or port "3000"))}
    (throw (ex-info "Invalid URI format" {:uri uri}))))

(defn create-client [uri options]
  (tap> "CREATE CLIENT")
  (tap> options)
  (let [parsed-uri (parse-uri uri)
        state (atom {:event-handlers (:handlers options)})]
    (->SenteClient parsed-uri options state)))

;; ==========================================================================
;; REPL Testing
;; ==========================================================================
(comment
  ;; Create a client that connects to localhost:3000
  (def test-client (create-client "localhost:3000"
                                 {:handlers
                                  {:on-connect #(tap> {:event :test-client/connected})
                                   :on-disconnect #(tap> {:event :test-client/disconnected})
                                   :on-message (fn [event-type payload]
                                                (tap> {:event :test-client/received-message
                                                       :type event-type
                                                       :payload payload}))}}))

  ;; Connect to the server
  (connect! test-client)

  ;; Check connection status - should give detailed diagnostics now
  (connected? test-client)

  ;; Inspect the client state
  @(.state test-client)

  ;; Debug connection
  (when-let [state-atom (:state @(.state test-client))]
    (tap> {:debug/connection-state @state-atom}))

  ;; Register a specific handler for broadcast messages
  (register-handler! test-client :broadcast/message
                     (fn [payload]
                       (tap> {:event :test-client/broadcast-received
                              :payload payload})))

  ;; Attempt sending even if not connected - will give helpful errors now
  (def result-ch (send-message! test-client :test/ping "Are you there?" 5000))
  (async/<!! result-ch) ;; Wait for response, should have error details if failed

  ;; Disconnect from server
  (disconnect! test-client)

  ;; Reconnection test
  (connect! test-client)
  (send-message! test-client :test/reconnect "Back again!" 5000)
  )
