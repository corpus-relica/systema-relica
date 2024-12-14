(ns rlc.clarity.core
  (:require [rlc.clarity.occurrence :as occ]
            [clj-http.client :as http]))

(defn -main
  "Service entry point"
  [& args]
  (println "Starting Clarity CLJ service...Bitch!")
  ;; Keep the service running
  @(promise)) ;; Block indefinitely using a deref'd promise

(defn get-definition [uid]
  (tap> uid)
  (try
    (let [response (http/get (str "http://localhost:3000/definition/get?uid=" uid)
                             {:as :json
                              :content-type :json
                              :accept :json})]
      (:body response))
    (catch Exception e
      (println "Error:" (.getMessage e)))))


;; (get-definition 1146)
