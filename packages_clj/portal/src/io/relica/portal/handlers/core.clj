(ns io.relica.portal.handlers.core
  (:require [clojure.core.async :refer [go <!]]))


(defn handle-ping [_]
  (go
    {:success true
     :message "Pong"}))
