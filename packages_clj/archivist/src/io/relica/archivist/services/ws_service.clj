(ns io.relica.archivist.services.ws-service
  (:require [mount.core :refer [defstate]]
            [io.relica.archivist.io.ws-server :as ws]
            ))

(defstate ws-service
  :start (let [;;{:keys [host port]} (:ws-server db-config)
               server-port 3000];;(or port 3000)]
           ;; (tap> "Starting WebSocket server...")
           (println "Starting WebSocket server on port" server-port "...")
           ;; (mount.core/args {:xxx gellish-base-service
           ;;                   :port server-port})
           (ws/start {:port server-port})
            ;; {:gellish-base gellish-base-service
            ;;                  :kind kind-service
            ;;                  :entity-retrieval entity-retrieval-service
            ;;                  :general-search general-search-service
            ;;                  :port server-port
            ;;                  :fact-service fact-service
            ;;                  :graph-service graph-service}
                            )
  :stop (do
          (println "EEEEEEE Stopping WebSocket server...")
          (ws/stop ws-service)))
