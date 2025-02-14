;; src/io/relica/aperture/core.clj
(ns io.relica.aperture.core
  (:require [clojure.tools.logging :as log]
            [io.relica.common.websocket.server :as ws]
            [io.relica.aperture.env :refer [get-user-environment update-user-environment!]]
            [io.relica.io.archivist-client :as archivist]
            [clojure.core.async :as async :refer [go <! >! chan]]
            [cheshire.core :as json]))

;; Server instance
(defonce server-instance (atom nil))

;; Message Handlers
(defn handle-get-environment [{:keys [user-id]}]
  (tap> (str "Getting environment for user:" user-id))
  (tap> (type user-id))
  (go
    (try
      (if-let [env (get-user-environment user-id)]
        {:success true
         :environment env}
        {:error "Environment not found"})
      (catch Exception e
        (log/error e "Failed to get environment")
        {:error "Failed to get environment"}))))

(defn handle-update-environment [{:keys [user-id updates]}]
  (go
    (try
      (if-let [updated (update-user-environment! (parse-long user-id) updates)]
        (do
          ;; Broadcast update to all connected clients
          (ws/broadcast! server-instance
                        {:type "environment-updated"
                         :user-id user-id
                         :environment updated})
          {:success true
           :environment updated})
        {:error "Failed to update environment"})
      (catch Exception e
        (log/error e "Failed to update environment")
        {:error "Failed to update environment"}))))

(defn handle-load-specialization [{:keys [user-id uid]}]
  (go
    (try
      (let [
            ;; user-id (parse-long user-id)
            ;; uid (parse-long uid)
            sh (archivist/get-specialization-hierarchy uid user-id)
            facts (:facts sh)]
        (if facts
          (do
            (update-user-environment! user-id {:facts facts})
            {:success true
             :facts facts})
          {:error "Specialization not found"}))
      (catch Exception e
        (log/error e "Failed to load specialization")
        {:error "Failed to load specialization"}))))

;; Health check handler
(defn handle-health-check [_]
  (go {:status "healthy"
       :timestamp (System/currentTimeMillis)}))

;; Message handlers map
(def handlers
  {"environment:get" handle-get-environment
   "environment:update" handle-update-environment
   "environment:load-specialization" handle-load-specialization
   "system:health" handle-health-check})

;; Server management
(defn start! []
  (when-not @server-instance
    (let [port 2175
          server (ws/create-server port {:handlers handlers})]
      (ws/start! server)
      (reset! server-instance server)
      (log/info "Aperture WebSocket server started on port" port)
      server)))

(defn stop! []
  (when-let [server @server-instance]
    (ws/stop! server)
    (reset! server-instance nil)
    (log/info "Aperture WebSocket server stopped")))

(defn -main [& args]
  (start!))

;; REPL helpers
(comment
  ;; Start server
  (def server (start!))

  ;; Get active connections
  (ws/get-active-sessions @server-instance)

  ;; Test broadcast
  (ws/broadcast! @server-instance
                {:type "system-notification"
                 :message "Test broadcast"})

  ;; Stop server
  (stop!)

  ;; Test individual handlers
  (handle-get-environment {:user-id "7"})

  ;; Test environment updates
  (handle-update-environment
    {:user-id "7"
     :updates {:facts [{:type "new-fact"
                       :value "test"
                       :metadata {:source "repl"}}]}})
  )
