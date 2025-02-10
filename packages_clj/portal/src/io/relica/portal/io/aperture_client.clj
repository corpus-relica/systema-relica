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
  (try
    (let [url (str base-url endpoint)
          response (http/request
                    (merge
                      {:method method
                       :url url
                       :as :edn
                       :throw-exceptions false
                       :content-type :json}
                      opts))]
      (if (= 200 (:status response))
        (:body response)
        (throw (ex-info "Request failed"
                       {:status (:status response)
                        :body (:body response)
                        :url url}))))
    (catch Exception e
      (log/error e "Request failed" {:endpoint endpoint :opts opts})
      (throw e))))

;; API Functions
(defn load-specialization-hierarchy [uid user-id]
  (make-request :get (str "/api/environment/" user-id "/load-specialization-heirarchy/" uid)
               {:query-params {}}))
