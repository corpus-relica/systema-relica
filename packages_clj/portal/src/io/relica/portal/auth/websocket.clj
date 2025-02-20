(ns io.relica.portal.auth.websocket
  (:require [clojure.tools.logging :as log]))

(defonce socket-tokens (atom {}))
(defonce connected-clients (atom {}))

(defn generate-socket-token []
  (str (java.util.UUID/randomUUID)))

(defn validate-socket-token [token]
  (when-let [{:keys [user-id created-at]} (get @socket-tokens token)]
    ;; Optional: Add token expiry check
    (when (< (- (System/currentTimeMillis) created-at) (* 24 60 60 1000))
      user-id)))
