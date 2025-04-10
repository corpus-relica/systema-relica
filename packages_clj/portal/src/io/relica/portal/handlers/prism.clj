(ns io.relica.portal.handlers.prism
  (:require [clojure.core.async :refer [go <!]]
            [clojure.tools.logging :as log]
            [io.relica.common.io.prism-client :as prism]
            [io.relica.portal.io.client-instances :refer [prism-client]]
            [cheshire.core :as json]))

;; Get setup status from Prism
(defn handle-setup-status [request]
  (go
    (try
      (let [result (<! (prism/get-setup-status prism-client))]
        {:status 200
         :headers {"Content-Type" "application/json"}
         :body (json/generate-string result)})
      (catch Exception e
        (log/error e "Error getting setup status from Prism")
        {:status 500
         :headers {"Content-Type" "application/json"}
         :body (json/generate-string 
                {:error "Failed to get setup status"
                 :message (.getMessage e)})}))))

;; Start setup sequence
(defn handle-start-setup [request]
  (go
    (try
      (let [result (<! (prism/start-setup prism-client))]
        {:status 200
         :headers {"Content-Type" "application/json"}
         :body (json/generate-string result)})
      (catch Exception e
        (log/error e "Error starting setup sequence")
        {:status 500
         :headers {"Content-Type" "application/json"}
         :body (json/generate-string 
                {:error "Failed to start setup sequence"
                 :message (.getMessage e)})}))))

;; Create admin user
(defn handle-create-user [request]
  (go
    (try
      (let [body (-> request :body)
            username (:username body)
            password (:password body)
            confirm-password (:confirmPassword body)]
        (println "Foobarbaz" request)
        (println "Creating admin user with username:" username password confirm-password)
        (if (and username password confirm-password)
          (let [result (<! (prism/create-admin-user prism-client username password confirm-password))]
            {:status 200
             :headers {"Content-Type" "application/json"}
             :body (json/generate-string result)})
          
          {:status 400
           :headers {"Content-Type" "application/json"}
           :body (json/generate-string 
                  {:success false
                   :message "Missing required fields"})}))
      (catch Exception e
        (log/error e "Error creating admin user")
        {:status 500
         :headers {"Content-Type" "application/json"}
         :body (json/generate-string 
                {:success false
                 :message (str "Failed to create admin user: " (.getMessage e))})}))))

;; Process setup stage
(defn handle-process-stage [request]
  (go
    (try
      (let [result (<! (prism/process-setup-stage prism-client))]
        {:status 200
         :headers {"Content-Type" "application/json"}
         :body (json/generate-string result)})
      (catch Exception e
        (log/error e "Error processing setup stage")
        {:status 500
         :headers {"Content-Type" "application/json"}
         :body (json/generate-string 
                {:success false
                 :message (str "Failed to process setup stage: " (.getMessage e))})}))))
