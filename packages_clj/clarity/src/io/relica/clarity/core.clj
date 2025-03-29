(ns io.relica.clarity.core
  (:require
   [io.relica.common.websocket.server :as common-ws]
   [io.relica.clarity.io.ws-server :as ws-server]
    [clojure.core.async :as async :refer [go <!]]
    [cheshire.core :as json]
    [io.relica.clarity.services.semantic-model-service :as sms]
    [clojure.tools.logging :as log]
    [clojure.pprint :as pprint]
    [mount.core :as mount]
    [io.relica.clarity.components :as components]
    [io.relica.clarity.io.ws-handlers])
  (:gen-class))

;; WebSocket handler methods moved to io.relica.clarity.io.ws-handlers

(defn -main [& args]
  (.addShutdownHook (Runtime/getRuntime) (Thread. components/stop-system))
  (components/start-system))

;; REPL helpers
(comment
  ;; Start system using mount
  (mount/start)
  
  ;; Get active connections
  (ws-server/get-active-sessions mount.core/ws-server-component)

  ;; Test broadcast
  (ws-server/broadcast! mount.core/ws-server-component
                {:type "system-notification"
                 :message "Test broadcast"})

  ;; Stop system
  (mount/stop)

  )
