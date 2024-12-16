(ns rlc.clarity.archivist-client
  (:require [clj-http.client :as http]))

(def base-url "http://localhost:3000")

(defn make-request
  ([path opts token]
   (try
     (let [default-opts {:as :json
                        :content-type :json
                        :accept :json
                        :headers {"Authorization" (str "Bearer " token)}}
           full-opts (merge default-opts opts)]
       (:body (http/get (str base-url path) full-opts)))
     (catch Exception e
       (println "Error:" (.getMessage e))
       {:error (.getMessage e)}))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; REQUEST PATTERNS

(defn get-definition [uid token]
  (make-request (str "/definition/get?uid=" uid)
                {}
                token))

(defn get-classified-facts [params token]
  (make-request "/fact/classified"
                {:query-params params
                 :throw-exceptions false}
                token))

(defn get-classification-fact [uid token]
  (make-request "/fact/classificationFact"
                {:query-params {:uid uid}
                 :throw-exceptions false}
                token))
