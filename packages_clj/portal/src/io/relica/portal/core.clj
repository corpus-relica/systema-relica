(ns io.relica.portal.core
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [io.pedestal.interceptor :as interceptor]
            [taoensso.sente :as sente]
            [taoensso.sente.server-adapters.http-kit :refer [get-sch-adapter]]
            [clojure.tools.logging :as log]
            [buddy.sign.jwt :as jwt]))

;; Initialize Sente
(let [{:keys [ch-recv send-fn connected-uids
             ajax-post-fn ajax-get-or-ws-handshake-fn]}
      (sente/make-channel-socket! (get-sch-adapter)
                                 {:user-id-fn (fn [ring-req] (:client-id ring-req))})]
  (def ring-ajax-post ajax-post-fn)
  (def ring-ajax-get-or-ws-handshake ajax-get-or-ws-handshake-fn)
  (def ch-chsk ch-recv)
  (def chsk-send! send-fn)
  (def connected-uids connected-uids))

;; JWT Validation Interceptor
(def validate-jwt
  {:name ::validate-jwt
   :enter (fn [context]
            (let [token (-> context :request :headers (get "authorization") (clojure.string/replace "Bearer " ""))]
              (try
                (let [claims (jwt/unsign token (or (System/getenv "JWT_SECRET") "your-dev-secret-change-me"))]
                  (assoc-in context [:request :identity] claims))
                (catch Exception e
                  (assoc context :response {:status 401 :body "Invalid token"})))))})

;; WebSocket event handler
(defmulti event-msg-handler :id)

(defmethod event-msg-handler :default [{:as ev-msg :keys [event]}]
  (log/info "Unhandled event:" event))

(defmethod event-msg-handler :chsk/uidport-open [{:keys [uid client-id]}]
  (log/info "New connection:" uid client-id))

(defmethod event-msg-handler :chsk/uidport-close [{:keys [uid]}]
  (log/info "Disconnected:" uid))

(defmethod event-msg-handler :chsk/ws-ping [_]
  ; Handle ping
  nil)

;; Sente event router
(defonce router_ (atom nil))

(defn stop-router! []
  (when-let [stop-fn @router_]
    (stop-fn)))

(defn start-router! []
  (stop-router!)
  (reset! router_
          (sente/start-server-chsk-router!
           ch-chsk event-msg-handler)))

;; Pedestal routes
(def routes
  (route/expand-routes
   #{["/chsk" :get [validate-jwt ring-ajax-get-or-ws-handshake] :route-name ::ws-handshake]
     ["/chsk" :post [validate-jwt ring-ajax-post] :route-name ::ws-post]
     ["/health" :get (constantly {:status 200 :body "healthy"}) :route-name ::health]}))

;; Server configuration
(def service-map
  {::http/routes routes
   ::http/type :jetty
   ::http/port 8080
   ::http/host "0.0.0.0"
   ::http/join? false})

(defn start []
  (log/info "Starting server...")
  (start-router!)
  (-> service-map
      http/create-server
      http/start))

(defn -main [& args]
  (start))

;; REPL helpers
(comment
  (def server (start))
  (http/stop server)

  ;; Test sending a message to all connected clients
  (doseq [uid (:any @connected-uids)]
    (chsk-send! uid [:some/event {:data "test"}])))
