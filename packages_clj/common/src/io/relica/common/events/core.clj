(ns io.relica.common.events.core
  (:require [clojure.core.async :as async]))

(defonce event-bus (async/chan (async/sliding-buffer 100)))
(defonce event-mult (async/mult event-bus))

(defn publish-event [event]
  (async/put! event-bus event))

(defn subscribe []
  (let [ch (async/chan)]
    (async/tap event-mult ch)
    ch))
