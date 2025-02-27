(ns io.relica.portal.routes
  (:require
   [compojure.core :refer [defroutes GET POST OPTIONS]]
   [compojure.route :as route]
   [io.relica.portal.handlers.core :refer [handle-ping]]
   [io.relica.portal.handlers.http :refer [ws-handler
                                           handle-ws-auth
                                           handle-resolve-uids
                                           handle-get-environment
                                           handle-get-kinds
                                           handle-get-collections
                                           handle-get-entity-type
                                           handle-text-search]]
   [io.relica.portal.middleware :refer [wrap-jwt-auth
                                        wrap-async-handler]]))

;; Define routes with WebSocket support
(defroutes app-routes
  (GET "/chsk" [] ws-handler)
  (POST "/ws-auth" [] (wrap-jwt-auth
                       handle-ws-auth))

  (GET "/kinds" [] (->  handle-get-kinds
                        wrap-async-handler
                        wrap-jwt-auth))

  (OPTIONS "/concept/entities" []
    {:status 200
     :headers {"Access-Control-Allow-Origin" "*"
               "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
               "Access-Control-Allow-Headers" "Content-Type, Authorization"
               "Access-Control-Max-Age" "3600"}})
  (GET "/concept/entities" [] (-> handle-resolve-uids
                                  wrap-async-handler
                                  wrap-jwt-auth))  ; Support GET with query params

  (POST "/concept/entities" [] (-> handle-resolve-uids
                                   wrap-async-handler
                                   wrap-jwt-auth))  ; Support POST with body

  (GET "/environment/retrieve" [] (-> handle-get-environment
                                      wrap-async-handler
                                      wrap-jwt-auth))

  ;; Entity retrieval routes
  (OPTIONS "/retrieveEntity/collections" []
    {:status 200
     :headers {"Access-Control-Allow-Origin" "*"
               "Access-Control-Allow-Methods" "GET, OPTIONS"
               "Access-Control-Allow-Headers" "Content-Type, Authorization"
               "Access-Control-Max-Age" "3600"}})
  (GET "/retrieveEntity/collections" [] (-> handle-get-collections
                                            wrap-async-handler
                                            wrap-jwt-auth))

  (OPTIONS "/retrieveEntity/type" []
    {:status 200
     :headers {"Access-Control-Allow-Origin" "*"
               "Access-Control-Allow-Methods" "GET, OPTIONS"
               "Access-Control-Allow-Headers" "Content-Type, Authorization"
               "Access-Control-Max-Age" "3600"}})
  (GET "/retrieveEntity/type" [] (-> handle-get-entity-type
                                     wrap-async-handler
                                     wrap-jwt-auth))


  (OPTIONS "/generalSearch/text" []
    {:status 200
     :headers {"Access-Control-Allow-Origin" "*"
               "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
               "Access-Control-Allow-Headers" "Content-Type, Authorization"
               "Access-Control-Max-Age" "3600"}})
  (GET "/generalSearch/text" [] (-> handle-text-search
                                    wrap-async-handler
                                    wrap-jwt-auth))

  (GET "/health" [] {:status 200 :body "healthy"})
  (OPTIONS "/*" [] {:status 200
                    :headers {"Access-Control-Allow-Origin" "*"
                              "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
                              "Access-Control-Allow-Headers" "Content-Type, Authorization"
                              "Access-Control-Max-Age" "3600"}})

  ;; Catch-all route for unknown paths
  (route/not-found
   (fn [_]
     {:status 404
      :headers {"Content-Type" "application/json"
                "Access-Control-Allow-Origin" "*"
                "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
                "Access-Control-Allow-Headers" "Content-Type, Authorization"}
      :body {:error "Route not found"}})))
