(ns rlc.clarity.io.archivist-api
  (:require [rlc.clarity.io.archivist-client :as client]
            [ring.util.response :as response]))

;; (defn get-classification-fact[uid]
;;   (client/auth-get
;;     (str ARCHIVIST_SERVICE_URL "/fact/classificationFact")
;;     {:query-params {:uid uid}
;;      :transform-fn (fn [response-body]
;;                     (:lh_object_name (first response-body)))}))

;; (defn delete-fact! [fact-uid]
;;   (client/auth-delete
;;     (str ARCHIVIST_SERVICE_URL "/fact")
;;     {:query-params {:uid fact-uid}}))

(defn execute-query
  "Execute a query string against the service and transform the results"
  [query-string transform-fn]
  (let [response (client/make-post-request
                  "/query/queryString"
                  {:queryString query-string}
                  {:throw-exceptions false})]
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

(defn get-definition [uid]
  (client/make-request (str "/definition/get?uid=" uid)
                {}))

(defn get-classified-facts [params]
  (client/make-request "/fact/classified"
                {:query-params params
                 :throw-exceptions false}))

(defn get-classification-fact [uid]
  (client/make-request "/fact/classificationFact"
                {:query-params {:uid uid}
                 :throw-exceptions false}))

(defn delete-fact! [fact-uid]
  (tap> "DELETING FACT")
  (tap> "/fact/fact")
  (client/make-delete-request "/fact/fact"
                {:query-params {:uid fact-uid}
                 :throw-exceptions false}))
