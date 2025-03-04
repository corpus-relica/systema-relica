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


(defmulti handle-ws-message :id)

;; System message handlers with low priority
(defmethod ^{:priority -1} handle-ws-message :chsk/uidport-open
  [{:keys [uid] :as msg}]
  (tap> {:event :websocket/client-connected
         :uid uid}))

(defmethod ^{:priority -1} handle-ws-message :chsk/uidport-close
  [{:keys [uid] :as msg}]
  (tap> {:event :websocket/client-disconnected
         :uid uid}))

(defmethod ^{:priority -1} handle-ws-message :chsk/ws-ping
  [_]
  nil)

(defmethod ^{:priority -1} handle-ws-message :chsk/ws-pong
  [_]
  nil)

;; Default handler with lowest priority
(defmethod ^{:priority -100} handle-ws-message :default
  [{:keys [event id] :as msg}]
  (tap> {:event :websocket/unknown-message-type
         :message-id id
         :event-type event}))

(defprotocol WebSocketServer
  (start! [this])
  (stop! [this])
  (broadcast! [this message])
  (send! [this client-id message]))

(defn create-sente-setup [options]
  (tap> {:event :websocket/creating-sente-setup
         :options options})
  (let [{:keys [ch-recv send-fn connected-uids ajax-post-fn ajax-get-or-ws-handshake-fn]}
        (sente/make-channel-socket! (get-sch-adapter)
                                   {:packer :edn
                                    :csrf-token-fn nil
                                    :user-id-fn (fn [ring-req]
                                                ;; (tap> {:event :websocket/generating-user-id
                                                ;;       :req ring-req})
                                                (let [uid (java.util.UUID/randomUUID)]
                                                  ;; (tap> {:event :websocket/generated-user-id
                                                  ;;       :uid uid})
                                                  uid))})]
    ;; (tap> {:event :websocket/sente-setup-complete
    ;;        :connected-uids @connected-uids})
    {:ring-ajax-post ajax-post-fn
     :ring-ajax-get-or-ws-handshake ajax-get-or-ws-handshake-fn
     :ch-chsk ch-recv
     :chsk-send! send-fn
     :connected-uids connected-uids}))

(defn create-routes [sente-fns]
  ;; (tap> {:event :websocket/creating-routes})
  (defroutes routes
    (GET "/chsk" req
      ;; (tap> {:event :websocket/handling-get
      ;;        :uri (:uri req)
      ;;        :params (:params req)
      ;;        :headers (:headers req)})
      ((:ring-ajax-get-or-ws-handshake sente-fns) req))
    (POST "/chsk" req
      ;; (tap> {:event :websocket/handling-post
      ;;        :uri (:uri req)
      ;;        :params (:params req)
      ;;        :body (:body req)})
      ((:ring-ajax-post sente-fns) req))
    (route/not-found "404")))

(defn create-handler [routes]
  ;; (tap> {:event :websocket/creating-handler})
  (-> routes
      wrap-keyword-params
      wrap-params))

(defn start-router! [ch-chsk event-msg-handler]
  ;; (tap> {:event :websocket/starting-router})
  (go-loop []
    (when-let [{:keys [id event ?data ring-req] :as msg} (<! ch-chsk)]
      ;; (tap> {:event-foo :websocket/router-received
      ;;        :msg-id id
      ;;        :event event
      ;;        :data ?data
      ;;        :ring-req (select-keys ring-req [:uri :request-method])
      ;;        :full-msg msg})
      (event-msg-handler msg)
      (recur))))

(defrecord SenteServer [options state]
  WebSocketServer
  (start! [this]
    ;; (tap> {:event :websocket/server-starting
    ;;        :options options})
    (let [sente-fns (create-sente-setup options)
          routes (create-routes sente-fns)
          handler (create-handler routes)
          stop-fn (http-kit/run-server handler {:port (:port options)})
          router (when-let [handler (:event-msg-handler options)]
                  (start-router! (:ch-chsk sente-fns) handler))]
      ;; (tap> {:event :websocket/server-started
      ;;        :port (:port options)
      ;;        :connected-uids @(:connected-uids sente-fns)})
      (reset! state (assoc sente-fns
                          :stop-fn stop-fn
                          :router router))
      this))

  (stop! [this]
    ;; (tap> {:event :websocket/server-stopping})
    (when-let [stop-fn (:stop-fn @state)]
      (stop-fn)
      (reset! state nil)
      ;; (tap> {:event :websocket/server-stopped})
      ))

  (broadcast! [this message]
    ;; (tap> {:event :websocket/broadcasting
    ;;        :message message})
    (when-let [{:keys [chsk-send! connected-uids]} @state]
      (let [connected @connected-uids]
        ;; (tap> {:event :websocket/broadcast-targeting
        ;;        :connected-uids connected})
        (doseq [uid (:any connected)]
          ;; (tap> {:event :websocket/broadcast-to-user
          ;;        :uid uid})
          (chsk-send! uid [:broadcast/message message])))))
          ;; (chsk-send! uid [:chsk/recv message])))))
          ;; (chsk-send! uid [:chsk/recv message])))))

  (send! [this client-id message]
    ;; (tap> {:event :websocket/sending-to-client
    ;;        :client-id client-id
    ;;        :message message})
    (when-let [{:keys [chsk-send!]} @state]
      (chsk-send! client-id [:response/message message]))))

(defn create-server [{:keys [port event-msg-handler] :as options}]
  ;; (tap> {:event :websocket/creating-server
  ;;        :port port
  ;;        :has-handler? (boolean event-msg-handler)})
  (->SenteServer options (atom nil)))

;; ==========================================================================
;; REPL Testing
;; ==========================================================================
(comment
  ;; Create and start a test server on port 3000
  (def test-server (create-server {:port 9030
                                   :event-msg-handler handle-ws-message}))

  (start! test-server)

  ;; Check connected clients
  (when-let [conn-uids (:connected-uids @(.state test-server))]
    @conn-uids)

  ;; Broadcast a test message to all connected clients
  (broadcast! test-server {:type :test-broadcast
                           :message "Hello from server!"
                           :timestamp (java.util.Date.)})

  ;; Send a message to a specific client (need client's UID)
  (let [uid (first (:any @(:connected-uids @(.state test-server))))]
    (send! test-server uid {:type :direct-message
                            :message "This is a direct message"
                            :timestamp (java.util.Date.)}))

  ;; Stop the server
  (stop! test-server)

  )
