(ns io.relica.archivist.core
  (:require [mount.core :as mount]
            [io.relica.archivist.services.ws-service]
            [io.relica.archivist.services.postgres-service]
            [io.relica.archivist.services.graph-service]
            [io.relica.archivist.services.uid-service]))

(defn start-app []
  (mount/start))

(defn stop-app []
  (mount/stop))

(defn -main [& args]
  (start-app))

(comment

  (start-app)

  (stop-app)

  (print))
