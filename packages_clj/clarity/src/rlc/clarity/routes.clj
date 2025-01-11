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
                 `event/get-all)
      :route-name :all-events]

     ["/event/:uid"
      :get (conj protected-interceptors
                 `event/get-event)
      :route-name :event]

     ["/event/:uid/time"
      :get (conj protected-interceptors
                 `event/get-time)
      :route-name :event-time]

     ["/event/:uid/time-value"
      :get (conj protected-interceptors
                 `event/get-time-value)
      :route-name :event-time-value]

      ["/event/:uid/participants"
       :get (conj protected-interceptors
                  `event/get-participants)
       :route-name :event-participants]

     ;; ["/event/:uid/participation-fact"
     ;;  :get (conj protected-interceptors
     ;;             `event/get-participation-fact)
     ;;  :route-name :event-participation-fact]

     ;; ["/event" :post event/create-event :route-name :create-event]
     ;; ["/event/:id" :put event/update-event :route-name :update-event]
     ;; ["/event/:id" :delete event/delete-event :route-name :delete-event"]

     ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; PHYSICAL-OBJECT ;;

     ;; ["/physical-object/:id"
     ;;  :get (conj protected-interceptors
     ;;             `physical-object/get-object)
     ;;  :route-name :physical-object]

     ;; ["/physical-object/:id/composition"
     ;;  :get (conj protected-interceptors
     ;;             `physical-object/get-composition)
     ;;  :route-name :physical-object-composition]

     ;; ["/physical-object/:id/totalities"
     ;;  :get (conj protected-interceptors
     ;;             `physical-object/get-totalities)
     ;;  :route-name :physical-object-totalities]

     ;; ["/physical-object/:id/parts"
     ;;  :get (conj protected-interceptors
     ;;             `physical-object/get-parts)
     ;;  :route-name :physical-object-parts]

     ;; ["/physical-object/:id/adopted-state"
     ;;  :get (conj protected-interceptors
     ;;             `physical-object/get-adopted-state)
     ;;  :route-name :physical-object-adopted-state]

     ;; ["/physical-object"
     ;;  :post (conj protected-interceptors
     ;;              `physical-object/create-object)
     ;;  :route-name :create-physical-object]

     ;; ["/physical-object/:id"
     ;;  :put (conj protected-interceptors
     ;;             `physical-object/update-object)
     ;;  :route-name :update-physical-object]

     ["/physical-object/:uid"
      :delete (conj protected-interceptors
                    `physical-object/delete-object)
      :route-name :delete-physical-object]

     }))
