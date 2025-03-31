(ns io.relica.aperture.io.client-instances
  (:require [io.relica.common.io.archivist-client :as archivist]
            [io.relica.common.io.clarity-client :as clarity]))

;; ARCHIVIST

(defonce archivist-client (archivist/create-client))
(archivist/connect! archivist-client)

;; CLARITY

(defonce clarity-client (clarity/create-client
                         "ws://localhost:2176/ws"
                         {}))
