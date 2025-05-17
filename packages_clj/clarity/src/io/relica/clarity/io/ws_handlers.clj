(ns io.relica.clarity.io.ws-handlers
  (:require [io.relica.common.websocket.server :as common-ws]
            [io.relica.clarity.services.semantic-model-service :as sms]
            [clojure.core.async :as async :refer [go <!]]
            [clojure.tools.logging :as log]
            [clojure.pprint :as pprint]
            [io.relica.common.utils.response :as response]))

;; Model Operations
(response/def-ws-handler :clarity.model/get
  (let [model-id (:uid ?data)
        _ (log/info "Getting model for user:" ?data)
        _ (log/info "Model ID:" model-id)
        sm (<! (sms/retrieve-semantic-model model-id))]
    (pprint/pprint sm)
    (if sm
      (respond-success {:model sm})
      (respond-error :resource-not-found "Model not found")))
  (catch Exception e
    (log/error e "Failed to get model")
    (respond-error :internal-error "Failed to get model" {:exception (str e)})))

(response/def-ws-handler :clarity.model/get-batch
  (let [model-ids (:uids ?data)
        _ (log/info "Getting models for user:" ?data)
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
        (respond-success {:models models}))
      (do
        (log/info "No models found, sending error response")
        (respond-error :resource-not-found "Models not found"))))
  (catch Exception e
    (log/error e "Failed to get models")
    (respond-error :internal-error
                   (str "Failed to get models: " (.getMessage e))
                   {:exception (str e)})))

;; Kind Operations
(response/def-ws-handler :clarity.kind/get
  (let [kind-id (:kind-id ?data)
        _ (log/info "Getting kind for user:" ?data)]
    (log/info "Kind ID:" kind-id)
    (let [kind (<! (sms/retrieve-semantic-model kind-id))]
      (pprint/pprint kind)
      (if kind
        (respond-success {:model kind})
        (respond-error :resource-not-found "Kind not found"))))
  (catch Exception e
    (log/error e "Failed to get kind")
    (respond-error :internal-error "Failed to get kind" {:exception (str e)})))

;; Individual Operations
(response/def-ws-handler :clarity.individual/get
  (let [individual-id (:individual-id ?data)
        _ (log/info "Getting individual for user:" ?data)]
    (log/info "Individual ID:" individual-id)
    (let [individual (<! (sms/retrieve-semantic-model individual-id))]
      (pprint/pprint individual)
      (if individual
        (respond-success {:model individual})
        (respond-error :resource-not-found "Individual not found"))))
  (catch Exception e
    (log/error e "Failed to get individual")
    (respond-error :internal-error "Failed to get individual" {:exception (str e)})))
