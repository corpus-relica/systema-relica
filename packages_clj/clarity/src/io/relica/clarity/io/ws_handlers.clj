(ns io.relica.clarity.io.ws-handlers
  (:require [io.relica.common.websocket.server :as common-ws]
            [io.relica.clarity.services.semantic-model-service :as sms]
            [clojure.core.async :as async :refer [go <!]]
            [clojure.tools.logging :as log]
            [clojure.pprint :as pprint]))

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
          (?reply-fn {:success false :error "Failed to get model"}))))))

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
          (?reply-fn {:success false :error (str "Failed to get models: " (.getMessage e))}))))))

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
          (?reply-fn {:success false :error "Failed to get kind"}))))))

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
          (?reply-fn [:get/individual-model-response ;; <-- Should this event be different?
                      {:success false :error "Failed to get individual"}]))))))
