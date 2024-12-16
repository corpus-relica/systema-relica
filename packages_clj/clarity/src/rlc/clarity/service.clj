(ns rlc.clarity.service
  (:require [rlc.clarity.routes :as routes]))

(def service-map
  {::http/routes routes/routes
   ::http/type   :jetty
   ::http/port   3002
   ::http/host   "0.0.0.0"
   ::http/join?  false
   ;; Enable CORS for development
   ::http/allowed-origins {:creds true :allowed-origins (constantly true)}})
