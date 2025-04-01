(ns io.relica.aperture.io.ws-handlers
  (:require [clojure.tools.logging :as log]
            [io.relica.common.websocket.server :as common-ws]
            [io.relica.aperture.io.ws-server :as ws]
            [io.relica.aperture.config :refer [get-default-environment]]
            [io.relica.aperture.services.environment-service :as env-service]
            [clojure.core.async :refer [go <!]]))

;; The environment service will be injected when registering the handlers
(defonce environment-service (atom nil))

;; Function to set the environment service
(defn set-environment-service! [service]
  (reset! environment-service service))

;; Environment Message Handlers
(defmethod ^{:priority 10} common-ws/handle-ws-message
  :environment/get
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (go
      (println "FUGGING GETTING ENVIRONMENT")
      (println ?data)
      (println (type (:user-id ?data)))
      (let [result (<! (env-service/get-environment @environment-service 
                                                  (:user-id ?data) 
                                                  (:environment-id ?data)))]
        (println "RESULT")
        ;; (println result)
        (?reply-fn result)))))