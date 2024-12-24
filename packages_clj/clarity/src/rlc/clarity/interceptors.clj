(ns rlc.clarity.interceptors
  (:require [io.pedestal.interceptor :refer [interceptor]]))

(def auth-interceptor
  (interceptor
   {:name ::auth
    :enter (fn [context]
             (tap> "AUTH INTERCEPTOR")
             (tap> {:context context
                    :whatever-the-hell-this-is (get-in context [:request :headers])
                    })
             (if-let [auth-header (get-in context [:request :headers "authorization"])]
               (let [token (when (.startsWith auth-header "Bearer ")
                            (subs auth-header 7))]
                 (if token
                   (assoc-in context [:request :auth-token] token)
                   context))
               context))}))
