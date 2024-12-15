(ns rlc.clarity.routes
  (:require [io.pedestal.http.route :as route]
            [rlc.clarity.handlers.entity :as entity]
            [rlc.clarity.handlers.physical-object :as physical-object]
            [rlc.clarity.handlers.aspect :as aspect]
            [rlc.clarity.handlers.role :as role]
            [rlc.clarity.handlers.relation :as relation]
            [rlc.clarity.handlers.state :as state]))

(def routes
  (route/expand-routes
   #{;; Common semantic patterns
     ["/entity/:id/classification" :get entity/get-classification]
     ["/entity/:id/relations" :get entity/get-relations]
     ["/entity/:id/context" :get entity/get-context]

     ;; Physical Objects
     ["/physical-object/:id" :get physical-object/get-object]
     ["/physical-object/:id/composition" :get physical-object/get-composition]

     ;; Add other routes as needed...
     }))
