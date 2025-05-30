(ns io.relica.portal.handlers.cache
  (:require [clojure.tools.logging :as log]
            [io.relica.common.io.prism-client :as prism]
            [io.relica.portal.io.client-instances :refer [prism-client]]
            [io.relica.portal.auth.websocket :refer [wrap-ws-auth]]
            [io.relica.common.websocket.server :as ws-server]))

(defn handle-cache-rebuild
  "Handles cache rebuild requests from frontend"
  [{:keys [?data ?reply-fn] :as msg}]
  (log/info "Handling cache rebuild request:" ?data)
  (let [{:keys [cacheTypes]} ?data]
    (if (empty? cacheTypes)
      (?reply-fn {:success false
                  :error "No cache types specified"})
      (try
        ;; Forward request to Prism
        (let [result @(prism/rebuild-caches! prism-client cacheTypes)]
          (?reply-fn result))
        (catch Exception e
          (log/error e "Failed to initiate cache rebuild")
          (?reply-fn {:success false
                      :error (.getMessage e)}))))))

(defn handle-cache-status
  "Handles cache status requests from frontend"
  [{:keys [?reply-fn] :as msg}]
  (log/debug "Handling cache status request")
  (try
    ;; Forward request to Prism
    (let [result @(prism/get-cache-status prism-client)]
      (?reply-fn result))
    (catch Exception e
      (log/error e "Failed to get cache status")
      (?reply-fn {:success false
                  :error (.getMessage e)}))))

;; WebSocket event handlers for Prism responses
(defn handle-cache-rebuild-progress
  "Handles cache rebuild progress updates from Prism"
  [event-type payload]
  (log/debug "Received cache rebuild progress:" payload)
  ;; Broadcast progress to all connected clients
  (ws-server/broadcast! nil {:type :portal.cache/rebuild-progress
                             :data payload}))

(defn handle-cache-rebuild-complete
  "Handles cache rebuild completion from Prism"
  [event-type payload]
  (log/info "Cache rebuild completed:" payload)
  ;; Broadcast completion to all connected clients
  (ws-server/broadcast! nil {:type :portal.cache/rebuild-complete
                             :data payload}))

(defn handle-cache-rebuild-error
  "Handles cache rebuild errors from Prism"
  [event-type payload]
  (log/error "Cache rebuild error:" payload)
  ;; Broadcast error to all connected clients
  (ws-server/broadcast! nil {:type :portal.cache/rebuild-error
                             :data payload}))

;; Register WebSocket handlers
(defmethod ws-server/handle-ws-message :portal.cache/rebuild
  [msg]
  ((wrap-ws-auth handle-cache-rebuild) msg))

(defmethod ws-server/handle-ws-message :portal.cache/status
  [msg]
  ((wrap-ws-auth handle-cache-status) msg))

;; Register Prism event handlers
(defmethod ws-server/handle-ws-message :prism.cache/rebuild-progress
  [msg]
  (handle-cache-rebuild-progress (:type msg) (:data msg)))

(defmethod ws-server/handle-ws-message :prism.cache/rebuild-complete
  [msg]
  (handle-cache-rebuild-complete (:type msg) (:data msg)))

(defmethod ws-server/handle-ws-message :prism.cache/rebuild-error
  [msg]
  (handle-cache-rebuild-error (:type msg) (:data msg)))