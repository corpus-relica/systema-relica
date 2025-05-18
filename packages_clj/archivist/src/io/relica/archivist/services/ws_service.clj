(ns io.relica.archivist.services.ws-service
  (:require [mount.core :refer [defstate]]
            [io.relica.archivist.io.ws-server :as ws]))

(defstate ws-service
  :start (let [;;{:keys [host port]} (:ws-server db-config)
               server-port 3000];;(or port 3000)]
           (println "Starting WebSocket server on port" server-port "...")
           (ws/start {:port server-port}))

  :stop (do
          (println "Stopping Archivist WebSocket server...")
          (ws/stop ws-service)))
