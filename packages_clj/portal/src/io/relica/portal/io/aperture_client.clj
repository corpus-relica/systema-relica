(ns io.relica.portal.io.aperture-client
  (:require [clj-http.client :as http]
            [cheshire.core :as json]
            [clojure.tools.logging :as log]
            [clojure.string :as str]))


(def endpoints
  {:load-specialization-hierarchy "/api/environment/load-specialization-heirarchy"})

(def base-url
  (or (System/getenv "APERTURE_URL") "http://localhost:2175"))

(defn- make-request
  "Generic request handler with error handling"
  [method endpoint & [opts]]
  (tap> "MMMMMMMMMMMMMMMMMAAAAAAAAAAAAAAAAAAAKKKKKKKKKKKKEEEEEEEEEEE request")
  (try
    (let [url (str base-url endpoint)
          ;; First get raw response to debug
          raw-response (http/request
                        (merge
                          {:method method
                           :url url
                           :as :string           ;; Change to :string temporarily
                           :accept "application/edn"
                           :throw-exceptions false
                           :content-type "application/edn"}
                          opts))]
      (tap> {:msg "Raw response from aperture"
             :body (:body raw-response)
             :headers (:headers raw-response)
             :content-type (get-in raw-response [:headers "content-type"])})

      (if (= 200 (:status raw-response))
        (:body raw-response)
        (throw (ex-info "Request failed"
                       {:status (:status raw-response)
                        :body (:body raw-response)
                        :url url}))))
    (catch Exception e
      (log/error e "Request failed" {:endpoint endpoint :opts opts})
      (throw e))))

;; API Functions
(defn load-specialization-hierarchy [uid user-id]
  (make-request :get (str "/api/environment/" user-id "/load-specialization-heirarchy/" uid)
               {:query-params {}}))

(defn get-environment [user-id]
  (make-request :get (str "/api/environment/" user-id "/get")
               {:query-params {}}))
