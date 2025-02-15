;; src/io/relica/common/websocket/client.clj
(ns io.relica.common.websocket.client
  (:require [taoensso.sente :as sente]
            [clojure.core.async :as async :refer [go go-loop <! >! timeout chan]]
            [clojure.tools.logging :as log]))

(defprotocol WebSocketClient
  (connect! [this])
  (disconnect! [this])
  (send-message! [this event-type payload timeout])
  (connected? [this]))

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
  (go-loop []
    (when-let [{:keys [event] :as msg} (<! ch-recv)]
      (let [[ev-id ev-data] event]
        (case ev-id
          :chsk/state (when (:first-open? ev-data)
                       (when-let [handler (:on-connect handlers)]
                         (handler)))
          :chsk/recv (when-let [handler (:on-message handlers)]
                      (handler ev-data))
          nil))
      (recur))))

(defn format-event [event-type payload]
  (if (keyword? event-type)
    [event-type payload]
    [(keyword (str "client/" (name event-type))) payload]))

(defrecord SenteClient [uri options state]
  WebSocketClient
  (connect! [this]
    (when-not (:socket @state)
      (let [sente-client (create-sente-client uri (:handlers options))
            router (start-client-router! (:ch-recv sente-client) (:handlers options))]
        (reset! state (assoc sente-client :router router)))
      this))

  (disconnect! [this]
    (when-let [{:keys [chsk router]} @state]
      (.close chsk)
      (async/close! router)
      (reset! state nil)))

  (connected? [this]
    (when-let [state-atom (:state @state)]
      (:open? @state-atom)))

  (send-message! [this event-type payload timeout-ms]
  (tap> {:event :websocket/send-attempt
         :event-type event-type
         :payload payload})
  (if (connected? this)
    (let [result-ch (chan)
          send-fn (:send-fn @state)]
      (if send-fn
        (do
          (tap> {:event :websocket/pre-send
                 :using-send-fn? true
                 :state @state})
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
          (tap> {:event :websocket/send-failed
                 :reason :no-send-fn})
          (go (>! result-ch {:error "Send function not available"}))))
      result-ch)
    (do
      (tap> {:event :websocket/send-failed
             :reason :not-connected})
      (go {:error "Not connected"})))))

(defn parse-uri [uri]
  (if-let [[_ host port] (re-matches #"(?:https?://|ws://)?([^:/]+)(?::(\d+))?" uri)]
    {:host host
     :port (Integer/parseInt (or port "3000"))}
    (throw (ex-info "Invalid URI format" {:uri uri}))))

(defn create-client [uri {:keys [handlers] :as options}]
  (let [parsed-uri (parse-uri uri)
        state (atom {})]
    (->SenteClient parsed-uri (assoc options :handlers handlers) state)))
