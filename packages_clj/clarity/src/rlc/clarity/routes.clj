(ns rlc.clarity.routes
  (:require [io.pedestal.http.route :as route]
            [io.pedestal.http :as http]
            [io.pedestal.http.body-params :as body-params]
            [rlc.clarity.handlers.entity :as entity]
            [rlc.clarity.handlers.physical-object :as physical-object]
            [rlc.clarity.handlers.aspect :as aspect]
            [rlc.clarity.handlers.role :as role]
            [rlc.clarity.handlers.relation :as relation]
            [rlc.clarity.handlers.state :as state]
            [rlc.clarity.handlers.occurrence :as occurrence]
            [rlc.clarity.handlers.event :as event]))

(def common-interceptors
  [(body-params/body-params)
   http/json-body])

(def routes
  (route/expand-routes
   #{;; Common semantic patterns
     ["/ping" :get (fn [_] {:status 200 :body "pong"}) :route-name :ping]
     ["/entity/:id/classification"
      :get (conj common-interceptors `entity/get-classification)
      :route-name :entity-classification]

     ;; Events
     ["/events/list"
      :get (conj common-interceptors `event/get-all)
      :route-name :all-events]

     ["/event/:uid"
      :get (conj common-interceptors `event/get-event)
      :route-name :event]

     ["/event/:uid/time"
      :get (conj common-interceptors `event/get-time)
      :route-name :event-time]

     ["/event/:uid/time-value"
      :get (conj common-interceptors `event/get-time-value)
      :route-name :event-time-value]

     ["/event/:uid/participants"
      :get (conj common-interceptors `event/get-participants)
      :route-name :event-participants]

     ;; Physical Objects
     ["/physical-object/:uid"
      :delete (conj common-interceptors `physical-object/delete-object)
      :route-name :delete-physical-object]}))
