(ns io.relica.common.websocket.client
  (:require [taoensso.sente :as sente]
            [clojure.core.async :as async :refer [go go-loop <! >! timeout chan]]
            [clojure.tools.logging :as log]))

(defprotocol WebSocketClient
  (connect! [this])
  (disconnect! [this])
  (send-message! [this event-type payload timeout])
  (connected? [this]))

(defrecord SenteClient [uri options]
  WebSocketClient
  (connect! [this]
    (when-not (:socket @(:state options))
      (let [{:keys [chsk ch-recv send-fn state] :as socket}
            (sente/make-channel-socket-client!
             "/chsk" nil
             {:type :ws
              :host (str (:host uri) ":" (:port uri))
              :packer :edn})

            router (go-loop []
                    (when-let [{:keys [event] :as msg} (<! ch-recv)]
                      (tap> {:event :ws-client/received-message
                            :msg msg})
                      (let [[ev-id ev-data] event]
                        (case ev-id
                          :chsk/state (when (:first-open? (second ev-data))
                                       (tap> {:event :ws-client/connected}))
                          :chsk/handshake (tap> {:event :ws-client/handshake-complete
                                                :data ev-data})
                          :chsk/recv (when-let [handler (:on-message (:handlers options))]
                                      (handler (second ev-data)))
                          nil))
                      (recur)))]

        (swap! (:state options) assoc
               :socket socket
               :router router
               :state state))))

  (disconnect! [this]
    (when-let [{:keys [socket router]} @(:state options)]
      (when-let [chsk (:chsk socket)]
        (.close chsk))
      (when router
        (async/close! router))
      (swap! (:state options) assoc :socket nil :router nil)))

  (connected? [this]
    (when-let [state (:state @(:state options))]
      (:open? @state)))

  (send-message! [this event-type payload timeout-ms]
    (if (connected? this)
      (let [result-ch (chan)]
        (if-let [{:keys [send-fn]} (:socket @(:state options))]
          (do
            (tap> {:event :ws-client/sending-message
                   :type event-type
                   :payload payload})
            (send-fn [event-type payload]
                    timeout-ms
                    (fn [reply]
                      (tap> {:event :ws-client/received-reply
                            :reply reply})
                      (go (>! result-ch reply)))))
          (go (>! result-ch {:error "Send function not available"})))
        result-ch)
      (do
        (tap> {:event :ws-client/send-failed
               :reason :not-connected
               :state (some-> this :options :state deref :state deref)})
        (go {:error "Not connected"})))))

(defn parse-uri [uri]
  (if-let [[_ host port] (re-matches #"(?:https?://|ws://)?([^:/]+)(?::(\d+))?" uri)]
    {:host host
     :port (Integer/parseInt (or port "3000"))}
    (throw (ex-info "Invalid URI format" {:uri uri}))))

(defn create-client [uri {:keys [handlers] :as opts}]
  (let [parsed-uri (parse-uri uri)
        state (atom {})
        options (merge opts
                      {:state state
                       :handlers handlers})]
    (tap> {:event :ws-client/creating
           :uri parsed-uri})
    (->SenteClient parsed-uri options)))
