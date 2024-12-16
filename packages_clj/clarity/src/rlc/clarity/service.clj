(ns rlc.clarity.service
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.body-params :as body-params]
            [rlc.clarity.routes :as routes]))

(def common-interceptors
  [(body-params/body-params)
   http/json-body])

(def service-map
  {::http/routes routes/routes
   ::http/type   :jetty
   ::http/port   3002
   ::http/host   "0.0.0.0"
   ::http/join?  false
   ;; Enable CORS for development
   ::http/allowed-origins {:creds true :allowed-origins (constantly true)}})
