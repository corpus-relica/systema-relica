(ns io.relica.archivist.core
  (:require [mount.core :as mount]
            [io.relica.archivist.components :refer [postgres-db]]))

(defn start-app []
  (mount/start))

(defn stop-app []
  (mount/stop))

(defn -main [& args]
  (start-app))

(comment

  (start-app)

  (stop-app))
