(ns io.relica.prism.io.ws-handlers
  (:require [io.relica.common.websocket.server :as common-ws]
            ;; [io.relica.clarity.services.semantic-model-service :as sms]
            [clojure.core.async :as async :refer [go <!]]
            [io.relica.prism.statechart-controller :as statechart-controller]
            [io.relica.prism.setup :as setup]
            [clojure.tools.logging :as log]
            [clojure.pprint :as pprint]))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :app/heartbeat
  [{:keys [?data ?reply-fn] :as msg}]
  (when ?reply-fn
    (log/info (str "*************************** Heartbeat received:" ?data))
    (go
      (try
        (let [heartbeat-data (:uid ?data)
              _ (log/info heartbeat-data)
              ;; sm (<! (sms/retrieve-semantic-model model-id))
              ]
          ;; (log/info model)
          ;; (pprint/pprint sm)
          (?reply-fn {:success true
                      :heartbeat-data heartbeat-data}))
        (catch Exception e
          (log/error e "Failed to get model")
          (?reply-fn {:success false :error "Failed to get model"}))))))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :setup-status/get
  [{:keys [?data ?reply-fn] :as msg}]
  (log/debug "Handling setup status request")
  (?reply-fn (statechart-controller/get-setup-state)))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :setup/start
  [{:keys [?data ?reply-fn] :as msg}]
  (log/info "Starting setup sequence via WebSocket")
  (statechart-controller/send-event :START_SETUP)
  (?reply-fn {:success true :message "Setup sequence started"}))

(defmethod ^{:priority 10} common-ws/handle-ws-message
  :setup/create-user
  [{:keys [?data ?reply-fn] :as msg}]
  (let [{:keys [username password confirmPassword]} ?data]
    (log/info "Creating admin user via WebSocket:" username)
    (if (and username password confirmPassword)
      (let [validation (setup/validate-credentials username password confirmPassword)]
        (if (:valid validation)
          (do
            (statechart-controller/send-event {:type :SUBMIT_CREDENTIALS
                                               :username username
                                               :password password})
            (if (setup/create-admin-user! username password)
              (do
                (?reply-fn {:success true :message "Admin user created successfully"})
                (statechart-controller/send-event :USER_CREATION_SUCCESS))
              (do
                (?reply-fn {:success false :message "Failed to create admin user"})
                (statechart-controller/send-event :ERROR))))
          (?reply-fn {:success false :message (:message validation)})))
      (?reply-fn {:success false :message "Missing required fields"})))
  )
