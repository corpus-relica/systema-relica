(ns io.relica.portal.routes
  (:require
   [compojure.core :refer [defroutes GET POST OPTIONS]]
   [compojure.route :as route]
   [cheshire.core :as json]
   [clojure.core.async :refer [go <!]]
   [io.relica.portal.handlers.http :refer [ws-handler
                                           handle-ws-auth
                                           handle-resolve-uids
                                           handle-get-environment
                                           handle-get-kinds
                                           handle-get-collections
                                           handle-get-entity-type
                                           handle-text-search
                                           handle-get-model
                                           handle-get-kind-model
                                           handle-get-individual-model
                                           handle-get-classified
                                           handle-get-subtypes
                                           handle-get-subtypes-cone
                                           ]]
   [io.relica.portal.handlers.websocket :as ws-handlers]
   [io.relica.portal.handlers.prism :as prism-handlers]
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

  ;; General search routes

  (OPTIONS "/generalSearch/text" []
    {:status 200
     :headers {"Access-Control-Allow-Origin" "*"
               "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
               "Access-Control-Allow-Headers" "Content-Type, Authorization"
               "Access-Control-Max-Age" "3600"}})
  (GET "/generalSearch/text" [] (-> handle-text-search
                                    wrap-async-handler
                                    wrap-jwt-auth))

  ;; Model routes

  (OPTIONS "/model" []
    {:status 200
     :headers {"Access-Control-Allow-Origin" "*"
               "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
               "Access-Control-Allow-Headers" "Content-Type, Authorization"
               "Access-Control-Max-Age" "3600"}})
  (GET "/model" [] (-> handle-get-model
                       wrap-async-handler
                       wrap-jwt-auth))

  (OPTIONS "/model/kind" []
    {:status 200
     :headers {"Access-Control-Allow-Origin" "*"
               "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
               "Access-Control-Allow-Headers" "Content-Type, Authorization"
               "Access-Control-Max-Age" "3600"}})
  (GET "/model/kind" [] (-> handle-get-kind-model
                           wrap-async-handler
                           wrap-jwt-auth))

  (OPTIONS "/model/individual" []
    {:status 200
    :headers {"Access-Control-Allow-Origin" "*"
              "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
              "Access-Control-Allow-Headers" "Content-Type, Authorization"
              "Access-Control-Max-Age" "3600"}
           })
  (GET "/model/individual" [] (-> handle-get-individual-model
                                  wrap-async-handler
                                  wrap-jwt-auth))

  ;; Fact routes

  (OPTIONS "/fact/classified" []
    {:status 200
    :headers {"Access-Control-Allow-Origin" "*"
              "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
              "Access-Control-Allow-Headers" "Content-Type, Authorization"
              "Access-Control-Max-Age" "3600"}
           })
  (GET "/fact/classified" [] (-> handle-get-classified
                                  wrap-async-handler
                                  wrap-jwt-auth))

  (OPTIONS "/fact/subtypes"[]
    {:status 200
    :headers {"Access-Control-Allow-Origin" "*"
              "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
              "Access-Control-Allow-Headers" "Content-Type, Authorization"
              "Access-Control-Max-Age" "3600"}
           })
  (GET "/fact/subtypes" [] (-> handle-get-subtypes
                                  wrap-async-handler
                                  wrap-jwt-auth))

  (OPTIONS "/fact/subtypes-cone" []
    {:status 200
    :headers {"Access-Control-Allow-Origin" "*"
              "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
              "Access-Control-Allow-Headers" "Content-Type, Authorization"
              "Access-Control-Max-Age" "3600"}
           })
  (GET "/fact/subtypes-cone" [] (-> handle-get-subtypes-cone
                                  wrap-async-handler
                                  wrap-jwt-auth))

  ;;

  ;; Prism setup endpoints
  (OPTIONS "/api/prism/setup/status" []
    {:status 200
     :headers {"Access-Control-Allow-Origin" "*"
               "Access-Control-Allow-Methods" "GET, OPTIONS"
               "Access-Control-Allow-Headers" "Content-Type, Authorization"
               "Access-Control-Max-Age" "3600"}})
  (GET "/api/prism/setup/status" [] (-> prism-handlers/get-setup-status
                                      wrap-async-handler))
  
  (OPTIONS "/api/prism/setup/start" []
    {:status 200
     :headers {"Access-Control-Allow-Origin" "*"
               "Access-Control-Allow-Methods" "POST, OPTIONS"
               "Access-Control-Allow-Headers" "Content-Type, Authorization"
               "Access-Control-Max-Age" "3600"}})
  (POST "/api/prism/setup/start" [] (-> prism-handlers/handle-start-setup
                                      wrap-async-handler
                                      ;; wrap-json-body
                                      ))
  
  (OPTIONS "/api/prism/setup/user" []
    {:status 200
     :headers {"Access-Control-Allow-Origin" "*"
               "Access-Control-Allow-Methods" "POST, OPTIONS"
               "Access-Control-Allow-Headers" "Content-Type, Authorization"
               "Access-Control-Max-Age" "3600"}})
  (POST "/api/prism/setup/user" [] (-> prism-handlers/handle-create-user
                                     wrap-async-handler
                                     ;; wrap-json-body
                                     ))
  
  ;; (OPTIONS "/api/prism/setup/process-stage" []
  ;;   {:status 200
  ;;    :headers {"Access-Control-Allow-Origin" "*"
  ;;              "Access-Control-Allow-Methods" "POST, OPTIONS"
  ;;              "Access-Control-Allow-Headers" "Content-Type, Authorization"
  ;;              "Access-Control-Max-Age" "3600"}})
  ;; (POST "/api/prism/setup/process-stage" [] (-> prism-handlers/handle-process-stage
  ;;                                             wrap-async-handler
  ;;                                             ;; wrap-json-body
  ;;                                             ))

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
