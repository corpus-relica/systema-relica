;; src/io/relica/aperture/core.clj
(ns io.relica.aperture.core
  (:require [clojure.tools.logging :as log]
            [io.relica.common.websocket.server :as common-ws]
            [io.relica.aperture.io.ws-server-ii :as ws]
            [io.relica.aperture.env :refer [get-user-environment get-user-environments
                                            update-user-environment! select-entity!
                                            deselect-entity! get-default-environment
                                            create-user-environment!]]
            [clojure.core.async :as async :refer [go <! >! chan]]
            [cheshire.core :as json]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.aperture.io.client-instances :refer [archivist-client]]
            [io.relica.aperture.services.environment-service :as env-service]
            [io.relica.aperture.handlers.environment-handlers :as env-handlers]

            ;; [io.relica.archivist.services.linearization-service :as lin]
            ))

;; Server instance
(defonce server-instance (atom nil))

;; Initialize environment service
(defonce environment-service (env-service/create-environment-service archivist-client))

;; Register the environment service with the handlers
(env-handlers/set-environment-service! environment-service)

;; Server management
(defn start! []
  (when-not @server-instance
    (let [port 2175
          server (ws/start! port)]
      (reset! server-instance server)
      (tap> (str "Aperture WebSocket server started on port" port))
      server)))

(defn stop! []
  (when-let [server @server-instance]
    (ws/stop! server)
    (reset! server-instance nil)
    (tap> "Aperture WebSocket server stopped")))

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

  (get-user-environments 7)

  (create-user-environment! 7 "Test env tres")

  (get-default-environment 7)

  (get-environment @aperture-client 7 1)
  (list-environments @aperture-client 7)
  (update-environment! @aperture-client 7 1 {:name "Test env" :description "Test env"})
  (load-specialization-hierarchy @aperture-client 7 7)
  (select-entity @aperture-client 7 1)
  (select-entity @aperture-client 7 1 1)

  ;; Stop server
  (stop!))
