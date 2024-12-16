(ns rlc.clarity.handlers.entity
 (:require [rlc.clarity.archivist-client :as archivist]))

(defn get-classification
 [request]
 (let [id (get-in request [:path-params :id])
       token (get request :auth-token)
       definition (archivist/get-definition id token)]
   {:status 200
    :body definition}))

(defn get-relations
 [request]
 (let [id (get-in request [:path-params :id])
       token (get request :auth-token)]
   {:status 200
    :body {:message "Not implemented yet"}}))

(defn get-context
 [request]
 (let [id (get-in request [:path-params :id])
       token (get request :auth-token)]
   {:status 200
    :body {:message "Not implemented yet"}}))
