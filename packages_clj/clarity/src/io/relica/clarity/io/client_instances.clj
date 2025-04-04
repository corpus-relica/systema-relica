(ns io.relica.clarity.io.client-instances
  (:require [io.relica.common.io.archivist-client :as archivist]
            [io.relica.clarity.config :refer [app-config]]))

(defonce archivist-client (archivist/create-client {:host (get-in app-config [:archivist :host])
                                                   :port (get-in app-config [:archivist :port])}))
