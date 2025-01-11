(ns rlc.clarity.io.archivist-api
  (:require [rlc.clarity.io.archivist-client :as client]
            [ring.util.response :as response]))

;; (defn get-classification-fact[uid]
;;   (client/auth-get
;;     (str ARCHIVIST_SERVICE_URL "/fact/classificationFact")
;;     token
;;     {:query-params {:uid uid}
;;      :transform-fn (fn [response-body]
;;                     (:lh_object_name (first response-body)))}))

;; (defn delete-fact! [fact-uid]
;;   (client/auth-delete
;;     (str ARCHIVIST_SERVICE_URL "/fact")
;;     token
;;     {:query-params {:uid fact-uid}}))

(defn execute-query
  "Execute a query string against the service and transform the results"
  [query-string transform-fn token]
  (let [response (client/make-post-request
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
  (client/make-request (str "/definition/get?uid=" uid)
                {}
                token))

(defn get-classified-facts [params token]
  (client/make-request "/fact/classified"
                {:query-params params
                 :throw-exceptions false}
                token))

(defn get-classification-fact [uid token]
  (client/make-request "/fact/classificationFact"
                {:query-params {:uid uid}
                 :throw-exceptions false}
                token))

(defn delete-fact! [fact-uid token]
  (tap> "DELETING FACT")
  (tap> "/fact/fact")
  (client/make-delete-request "/fact/fact"
                {:query-params {:uid fact-uid}
                 :throw-exceptions false}
                token))
