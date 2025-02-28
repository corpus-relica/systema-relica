(ns rlc.clarity.core
  (:require
   [io.relica.common.websocket.server :as common-ws]
   [rlc.clarity.io.ws-server :as ws]
   ;; [rlc.clarity.xxx :refer [xxx]]
    [clojure.core.async :as async :refer [go <!]]
    [cheshire.core :as json]
    ;; [io.relica.common.io.archivist-client :as archivist]
    ;; [rlc.clarity.io.client-instances :refer [archivist-client]]
    [rlc.clarity.services.model-service :as model-service]
   ;; [io.pedestal.http :as http]
   ;; [io.pedestal.http.route :as route]
   ;; [clj-http.client :as client]
   ;; [rlc.clarity.service :as service]
   ;; [portal.api :as p]
    [clojure.tools.logging :as log]
   ))

;; Server instance
(defonce server-instance (atom nil))

;; (defmethod ....
(defmethod ^{:priority 10} common-ws/handle-ws-message
  :get/kind-model
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (tap> (str "Getting kind for user:" (:user-id ?data)))
    (go
      (try
        (let [kind-id (:kind-id ?data)
              kind (<! (model-service/retrieve-kind-model kind-id))]
          (log/info kind)
          (if kind
            (?reply-fn {:success true
                        :model kind})
            (?reply-fn {:success false
                        :error "Kind not found"})))
        (catch Exception e
          (log/error e "Failed to get kind")
          {:error "Failed to get kind"})))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :get/individual-model
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (tap> (str "Getting individual for user:" (:user-id ?data)))
    (go
      (try
        (let [individual-id (:individual-id ?data)
              individual (<! (model-service/retrieve-individual-model individual-id))]
          (log/info individual)
          (if individual
            ;; Return a vector with an event ID and the data, not just a map
            (?reply-fn {:success true
                         :model individual})
            (?reply-fn {:success false
                        :error "Individual not found"})))
        (catch Exception e
          (log/error e "Failed to get individual")
          ;; Make sure to return a vector here too if you're using the reply-fn inside the catch
          (?reply-fn [:get/individual-model-response
                      {:error "Failed to get individual"}]))))))

;; Server management
(defn start! []
  (when-not @server-instance
    (let [port 2176
          server (ws/start! port)]
      (reset! server-instance server)
      (tap> (str "Clarity WebSocket server started on port" port))
      server)))

(defn stop! []
  (when-let [server @server-instance]
    (ws/stop! server)
    (reset! server-instance nil)
    (tap> "Clarity WebSocket server stopped")))

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
  (stop!))
