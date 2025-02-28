(ns rlc.clarity.io.client-instances
  (:require [io.relica.common.io.archivist-client :as archivist]))

(defonce archivist-client (archivist/create-client))
(archivist/connect! archivist-client)
