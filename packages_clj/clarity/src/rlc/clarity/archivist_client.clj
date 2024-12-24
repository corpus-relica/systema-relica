(ns rlc.clarity.archivist-client
  (:require [clj-http.client :as http]
            [clojure.data.json :as j]
            [ring.util.response :as response]))

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

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; REQUEST PATTERNS

(defn execute-query
  "Execute a query string against the service and transform the results"
  [query-string transform-fn token]
  (let [response (make-post-request
                  "/query/queryString"
                  {:queryString query-string}
                  {:throw-exceptions false}
                  token)]
    (tap> {:stage "initial response" :value response})
    (if (:error response)
      (response/status 500 {:error "Service connection error"
                           :details (:error response)})
      (let [facts (:facts response)
            _ (tap> {:stage "facts" :value facts})
            transformed (transform-fn facts)
            _ (tap> {:stage "after transform" :value transformed})
            final-response (response/response {:value transformed})
            _ (tap> {:stage "final response" :value final-response})]
        final-response))))

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
