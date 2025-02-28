(ns rlc.clarity.service
  (:require [rlc.clarity.routes :as routes]
            [io.pedestal.http :as http]))


(def service-map
  {::http/routes routes/routes
   ::http/type   :jetty
   ::http/port   2176
   ::http/host   "0.0.0.0"
   ::http/join?  false
   ::http/allowed-origins {:creds true :allowed-origins (constantly true)}})


