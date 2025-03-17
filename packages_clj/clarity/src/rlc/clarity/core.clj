(ns rlc.clarity.core
  (:require
   [io.relica.common.websocket.server :as common-ws]
   [rlc.clarity.io.ws-server :as ws]
   ;; [rlc.clarity.xxx :refer [xxx]]
    [clojure.core.async :as async :refer [go <!]]
    [cheshire.core :as json]
    ;; [io.relica.common.io.archivist-client :as archivist]
    ;; [rlc.clarity.io.client-instances :refer [archivist-client]]
    [rlc.clarity.services.semantic-model-service :as sms]
   ;; [io.pedestal.http :as http]
   ;; [io.pedestal.http.route :as route]
   ;; [clj-http.client :as client]
   ;; [portal.api :as p]
    [clojure.tools.logging :as log]
    [clojure.pprint :as pprint]
   ))

;; Server instance
(defonce server-instance (atom nil))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :get/model
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (log/info (str "*************************** Getting model for user:" ?data))
    (go
      (try
        (let [model-id (:uid ?data)
              _ (log/info model-id)
              sm (<! (sms/retrieve-semantic-model model-id))]
          ;; (log/info model)
          (pprint/pprint sm)
          (if sm
            (?reply-fn {:success true
                        :model sm})
            (?reply-fn {:success false
                        :error "Model not found"})))
        (catch Exception e
          (log/error e "Failed to get model")
          {:error "Failed to get model"})))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :get/models
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (log/info (str "Getting models for user:" ?data))
    (go
      (try
        (let [model-ids (:uids ?data)
              _ (log/info "Model IDs:" model-ids)
              models (loop [ids model-ids
                          acc []]
                     (if (empty? ids)
                       acc
                       (let [model (<! (sms/retrieve-semantic-model (first ids)))]
                         (log/info "Retrieved model for ID:" (first ids))
                         (recur (rest ids)
                                (if model
                                  (conj acc model)
                                  acc)))))]
          (log/info "All models retrieved:" (count models))
          (if (seq models)
            (do
              (log/info "Sending success response with models")
              (?reply-fn {:success true
                         :models models}))
            (do
              (log/info "No models found, sending error response")
              (?reply-fn {:success false
                         :error "Models not found"}))))
        (catch Exception e
          (log/error e "Failed to get models")
          (?reply-fn {:error (str "Failed to get models: " (.getMessage e))}))))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :get/kind-model
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (log/info (str "Getting kind for user:" ?data))
    (go
      (try
        (let [kind-id (:kind-id ?data)
              kind (<! (sms/retrieve-semantic-model kind-id))]
          ;; (log/info kind)
          (pprint/pprint kind)
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
    (log/info (str "Getting individual for user: " ?data))
    (go
      (try
        (let [individual-id (:individual-id ?data)
              individual (<! (sms/retrieve-semantic-model individual-id))]
          ;; (log/info individual)
          (pprint/pprint individual)
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
      (log/info (str "Clarity WebSocket server started on port" port))
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
  (stop!)

  )
