(ns rlc.clarity.handlers.entity
  (:require [clj-http.client :as http]))

(defn get-classification
  [request]
  (let [id (get-in request [:path-params :id])
        definition (try
                    (http/get (str "http://localhost:3000/definition/get?uid=" id)
                             {:as :json
                              :content-type :json
                              :accept :json})
                    (catch Exception e
                      (println "Error:" (.getMessage e))))]
    {:status 200
     :body (:body definition)}))

(defn get-relations [request]
  {:status 200
   :body {:message "Not implemented yet"}})

(defn get-context [request]
  {:status 200
   :body {:message "Not implemented yet"}})
