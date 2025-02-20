(ns io.relica.portal.handlers.websocket
  (:require [org.httpkit.server :as http]
            [cheshire.core :as json]
            [clojure.core.async :refer [go <!]]
            [clojure.tools.logging :as log]
            [io.relica.portal.auth.websocket
             :as ws-auth
             :refer [generate-socket-token
                     socket-tokens]]
            [io.relica.portal.handlers.core :as handlers]
            [io.relica.portal.auth.jwt :refer [validate-jwt]]
            [io.relica.portal.io.aperture-client
             :as aperture
             :refer [aperture-client]]))

(declare ws-handlers)

(defn handle-auth [{:keys [jwt]}]
  (go
    (if-let [user-id (validate-jwt jwt)]
      (let [socket-token (generate-socket-token)]
        (swap! socket-tokens assoc socket-token
               {:user-id user-id
                :created-at (System/currentTimeMillis)})
        {:success true
         :token socket-token
         :user-id user-id})
      {:error "Invalid JWT"})))

(defn handle-select-entity [{:keys [uid]}]
  (tap> "SELECT ENTITY")
  (tap> uid)
  (go
    (try
      (let [result (<! (aperture/select-entity aperture-client uid))]
        {:success true
         :message "Entity selected"})
      (catch Exception e
        (log/error "Failed to select entity:" e)
        {:error "Failed to select entity"}))
  ))


(defn handle-ping [_]
  (tap> "PING")
  (go
    {:success true
     :message "Pong"})
  )

(defn handle-ws-message [channel data]
      (tap>"HANDLING MESSAGE !")
      (tap> data)
  (try
    (let [message (json/parse-string data true)
          {:keys [id type payload]} message
          handler (get ws-handlers type)]
      (tap> message)
      (if handler
        (go
          (try
            (let [result (<! (handler payload))
                  response {:id id
                          :type "response"
                          :payload result}]
              (tap>"SENDING RESPONSE !!!!!!!!!!!!!!!!!!!!!!!!!!11")
              (tap> response)
              (http/send! channel (json/generate-string response)))
            (catch Exception e
              (log/error "Error processing message:" e)
              (http/send! channel (json/generate-string
                                 {:id id
                                  :type "error"
                                  :error (.getMessage e)})))))
        (do
          (log/warn "No handler found for message type:" type)
          (http/send! channel (json/generate-string
                              {:id id
                               :type "error"
                               :error (str "Unknown message type: " type)})))))
    (catch Exception e
      (log/error "Error parsing message:" e)
      (http/send! channel (json/generate-string
                          {:type "error"
                           :error "Invalid message format"})))))


(def ws-handlers
  {"auth" handle-auth
   ;; "kinds:get" handle-get-kinds
   ;; "entities:resolve" handle-resolve-uids
   ;; "environment:get" handle-get-environment
   "ping" handle-ping
   "selectEntity" handle-select-entity})
