;; src/io/relica/common/websocket/server.clj
(ns io.relica.common.websocket.server
  (:require [org.httpkit.server :as http-kit]
            [compojure.core :refer [GET POST defroutes]]
            [compojure.route :as route]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.keyword-params :refer [wrap-keyword-params]]
            [taoensso.sente :as sente]
            [taoensso.sente.server-adapters.http-kit :refer [get-sch-adapter]]
            [clojure.core.async :as async :refer [go go-loop <! >!]]
            [clojure.tools.logging :as log]))

(defprotocol WebSocketServer
  (start! [this])
  (stop! [this])
  (broadcast! [this message])
  (send! [this client-id message]))

(defrecord SenteServer [options]
  WebSocketServer
  (start! [this]
    (tap> {:event :ws-server/starting
           :port (:port options)})
    (when-not (:chsk @(:state options))
      (let [{:keys [ch-recv send-fn connected-uids
                   ajax-post-fn ajax-get-or-ws-handshake-fn
                   chsk]
             :as sente-socket}
            (sente/make-channel-socket!
             (get-sch-adapter)
             {:packer :edn
              :csrf-token-fn nil
              :user-id-fn (fn [ring-req]
                           (tap> {:event :ws-server/new-connection
                                 :headers (:headers ring-req)})
                           (str (random-uuid)))})

            routes (defroutes all-routes
                    (GET "/" [] "WebSocket Server Running")
                    (GET "/chsk" req
                      (tap> {:event :ws-server/ws-get
                            :headers (:headers req)})
                      (ajax-get-or-ws-handshake-fn req))
                    (POST "/chsk" req
                      (tap> {:event :ws-server/ws-post
                            :headers (:headers req)})
                      (ajax-post-fn req))
                    (route/not-found "404"))

            handler (-> routes
                       wrap-keyword-params
                       wrap-params)

            server (http-kit/run-server handler {:port (:port options)})]

        ;; Store ALL Sente components
        (swap! (:state options) assoc
               :chsk chsk
               :ch-recv ch-recv
               :send-fn send-fn
               :ajax-post-fn ajax-post-fn
               :ajax-get-fn ajax-get-or-ws-handshake-fn
               :connected-uids connected-uids
               :stop-fn server)

        ;; Start message router
        (go-loop []
          (when-let [{:keys [event ring-req uid ?reply-fn] :as msg} (<! ch-recv)]
            (tap> {:event :ws-server/received-message
                   :msg (dissoc msg :ring-req)})
            (try
              (let [[event-type payload] event]
                (tap> {:event :ws-server/handling-event
                       :type event-type
                       :payload payload})
                (if-let [handler (get-in options [:handlers (name event-type)])]
                  (go
                    (try
                      (let [response (<! (handler payload))]
                        (tap> {:event :ws-server/handler-response
                              :response response})
                        (if ?reply-fn
                          (?reply-fn response)
                          (send-fn uid [:response/message response])))
                      (catch Exception e
                        (tap> {:event :ws-server/handler-error
                              :error (str e)
                              :trace (with-out-str (.printStackTrace e))})
                        (when ?reply-fn
                          (?reply-fn {:error (str e)})))))
                  (tap> {:event :ws-server/no-handler
                         :type event-type})))
              (catch Exception e
                (tap> {:event :ws-server/message-loop-error
                       :error (str e)
                       :trace (with-out-str (.printStackTrace e))})))
            (recur)))

        (tap> {:event :ws-server/started
               :port (:port options)}))))

  (stop! [this]
    (when-let [stop-fn (:stop-fn @(:state options))]
      (stop-fn)
      (swap! (:state options) empty)))

  (broadcast! [this message]
    (when-let [{:keys [send-fn connected-uids]} @(:state options)]
      (doseq [uid (:any @connected-uids)]
        (send-fn uid [:broadcast/message message]))))

  (send! [this client-id message]
    (when-let [{:keys [send-fn]} @(:state options)]
      (send-fn client-id [:response/message message]))))

(defn create-server [port {:keys [handlers] :as opts}]
  (let [state (atom {})  ; Start with empty state
        options (merge opts {:state state
                           :handlers handlers
                           :port port})]
    (->SenteServer options)))
