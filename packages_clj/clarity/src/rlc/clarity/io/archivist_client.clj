(ns rlc.clarity.io.archivist-client
  (:require [clj-http.client :as http]
            [clojure.data.json :as j]))

(def base-url "http://archivist:3000")

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

(defn make-post-request
  [path body opts token]
  (try
    (let [default-opts {:as :json
                       :content-type :json
                       :accept :json
                       :headers {"Authorization" (str "Bearer " token)}
                       :body (j/write-str body)}
          full-opts (merge default-opts opts)]
      (:body (http/post (str base-url path) full-opts)))
    (catch Exception e
      (println "Error:" (.getMessage e))
      {:error (.getMessage e)})))

(defn make-put-request
  [path body opts token]
  (try
    (let [default-opts {:as :json
                       :content-type :json
                       :accept :json
                       :headers {"Authorization" (str "Bearer " token)}
                       :body (j/write-str body)}
          full-opts (merge default-opts opts)]
      (:body (http/put (str base-url path) full-opts)))
    (catch Exception e
      (println "Error:" (.getMessage e))
      {:error (.getMessage e)})))

(defn make-delete-request
  [path opts token]
  (try
    (let [default-opts {:as :json
                       :content-type :json
                       :accept :json
                       :headers {"Authorization" (str "Bearer " token)}}
          full-opts (merge default-opts opts)]
      (:body (http/delete (str base-url path) full-opts)))
    (catch Exception e
      (println "Error:" (.getMessage e))
      {:error (.getMessage e)})))
