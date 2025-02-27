(ns io.relica.portal.middleware
  (:require [clojure.core.async :refer [take!]]
            [clojure.string :as clojure.string]
            [io.relica.portal.auth.jwt :as jwt]
            [org.httpkit.server :as http]))

(defn wrap-async-handler [handler]
  (fn [request]
    (http/with-channel request channel
      (take! (handler request)
             (fn [result]
               (http/send! channel
                          {:status (:status result 404)  ; Use result status or 404 as default
                           :headers {"Content-Type" "application/json"
                                   "Access-Control-Allow-Origin" "*"
                                   "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
                                   "Access-Control-Allow-Headers" "Content-Type, Authorization"}
                           :body (:body result)}))))))

(defn wrap-cors-headers [handler]
  (fn [request]
    (let [response (handler request)]
      (-> response
          (update :headers merge
                  {"Access-Control-Allow-Origin" "*"
                   "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
                   "Access-Control-Allow-Headers" "Content-Type, Authorization"
                   "Access-Control-Max-Age" "3600"})))))

;; Error handling middleware with CORS
(defn wrap-error-handling [handler]
  (fn [request]
    (try
      (handler request)
      (catch Exception e
        (tap> (str "Unhandled exception:" e))
        {:status 500
         :headers {"Content-Type" "application/json"}
         :body {:error "Internal server error"
                :message (.getMessage e)}}))))

(defn wrap-jwt-auth [handler]
  (fn [request]
    (if-let [token (-> request :headers (get "authorization") (clojure.string/replace "Bearer " ""))]
      (if-let [user-id (jwt/validate-jwt token)]
        (handler (assoc request :identity {:user-id user-id}))
        {:status 401 :body "Invalid token"})
      {:status 401 :body "No token provided"})))
