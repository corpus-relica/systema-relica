(ns io.relica.portal.handlers.core
  (:require [clojure.core.async :refer [go <!]]
            [io.relica.portal.io.aperture-client
             :as aperture
             :refer [aperture-client ApertureOperations]]))


(defn handle-ping [_]
  (go
    {:success true
     :message "Pong"}))

(defn handle-select-entity [{:keys [uid]}]
  (go
    (try
      (let [result (<! (aperture/select-entity aperture-client uid))]
        {:success true
         :message "Entity selected"})
      (catch Exception e
        {:error "Failed to select entity"}))))

