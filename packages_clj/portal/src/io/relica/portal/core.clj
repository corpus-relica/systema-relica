(ns io.relica.portal.core
  (:require [org.httpkit.server :as http]
            [compojure.handler :refer [api site]]
            [clojure.string :as str]
            [compojure.route :as route]
            [clojure.tools.logging :as log]
            [clojure.core.async :refer [go <! chan put! take!]]
            [cheshire.core :as json]
            [buddy.sign.jwt :as jwt]
            [ring.util.response :as response]
            [ring.middleware.cors :refer [wrap-cors]]
            [ring.middleware.json :refer [wrap-json-response wrap-json-body]]
            [io.relica.portal.config :as config]
            [io.relica.portal.routes :as routes]
            [io.relica.portal.middleware :as middleware]
            [io.relica.portal.auth.websocket :as ws-auth]
            [io.relica.portal.handlers.websocket :as ws-handlers]
            [io.relica.portal.handlers.http :as http-handlers]))

;; Server instance
(defonce server-instance (atom nil))

;; Server setup
(def app
  (-> routes/app-routes
      api
      middleware/wrap-error-handling
      middleware/wrap-cors-headers
      wrap-json-response
      (wrap-json-body {:keywords? true})))

(defn start! []
  (when-not @server-instance
    (let [port config/server-port
          server (http/run-server app {:port port})]
      (reset! server-instance server)
      (tap> (str "Portal server started on port " port))
      server)))

(defn stop! []
  (when-let [stop-fn @server-instance]
    (stop-fn)  ; http-kit servers are stopped by calling the returned function
    (reset! server-instance nil)
    (reset! ws-auth/connected-clients {})  ; Clear connected clients
    (log/info "Portal server stopped")))

(defn -main [& args]
  (start!))

;; REPL helpers
(comment
  ;; Start server
  (def server (start!))

  ;; Test authentication
  (ws-handlers/handle-auth {:jwt "your.test.jwt"})

  ;; Test kinds query
  (http-handlers/handle-get-kinds {:sort ["name" "ASC"]
                     :range [0 10]
                     :user-id "test-user"})

  ;; Stop server
  (stop!)

  ;; Check active sessions
  ;; (ws/get-active-sessions @server-instance)

  ;; Clean up expired tokens
  (let [now (System/currentTimeMillis)
        day-ms (* 24 60 60 1000)]
    (swap! ws-auth/socket-tokens
           #(into {} (filter (fn [[_ v]]
                              (< (- now (:created-at v)) day-ms)) %))))
  )
