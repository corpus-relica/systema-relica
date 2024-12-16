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
            [rlc.clarity.handlers.event :as event]
            [rlc.clarity.interceptors :as interceptors]))

(def common-interceptors
  [(body-params/body-params)
   http/json-body])

(def protected-interceptors
  (into [] (concat common-interceptors [interceptors/auth-interceptor])))

(def routes
  (route/expand-routes
   #{;; Common semantic patterns
     ["/ping" :get (fn [_] {:status 200 :body "pong"}) :route-name :ping]
     ["/entity/:id/classification"
      :get (conj protected-interceptors
                 `entity/get-classification)
      :route-name :entity-classification]
     ;; ["/entity/:id/relations" :get entity/get-relations :route-name :entity-relations]
     ;; ["/entity/:id/context" :get entity/get-context :route-name :entity-context]

     ;; Physical Objects
     ;; ["/physical-object/:id" :get physical-object/get-object]
     ;; ["/physical-object/:id/composition" :get physical-object/get-composition]

     ;; Add other routes as needed...
     ;; Events
     ["/events/list"
      :get (conj protected-interceptors
                 `event/get-all-events)
      :route-name :all-events]
     ["/event/:uid"
      :get (conj protected-interceptors
                 `event/get-event)
      :route-name :event]
     ;; ["/event" :post event/create-event :route-name :create-event]
     ;; ["/event/:id" :put event/update-event :route-name :update-event]
     ;; ["/event/:id" :delete event/delete-event :route-name :delete-event"]
     }))
