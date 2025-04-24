(ns io.relica.prism.io.client-instances
  (:require [clojure.core.async :as async :refer [go <! >! chan]]
            [clojure.tools.logging :as log]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.prism.config :refer [config]] ; Assuming config system exists
            )) ; Assuming client helpers exist

(defonce archivist-client (archivist/create-client {:host (get-in config [:archivist :host])
                                                   :port (get-in config [:archivist :port])}))

(defn request-lineage
  "Sends a :lineage/get request to Archivist via websocket and returns a channel for the response."
  [uid]
  (go
    (if-not archivist-client ; Check the dereferenced state
      (do
        (log/error "Archivist WS client not available for lineage request.")
        (async/go {:success false :error "Archivist client not connected"})) ; Return a failed channel
      (try
        (let [result (<! (archivist/get-lineage archivist-client ; Use the dereferenced client instance
                                              uid ; The message vector
                                              ) ; Optional timeout in ms
                         )]
          result)
        (catch Exception e
          (log/error e "Failed to send lineage request to Archivist for UID:" uid)
          (async/go {:success false :error "Failed to send request"}))))) ; Return a failed channel
  )
