(ns io.relica.portal.io.client-instances
  (:require [io.relica.common.io.archivist-client :as archivist]
            [io.relica.common.io.aperture-client :as aperture]))

(defonce archivist-client (archivist/create-client))
(archivist/connect! archivist-client)

(defonce aperture-client (aperture/create-client))
(aperture/connect! aperture-client)
