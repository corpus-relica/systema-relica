(ns io.relica.portal.io.archivist-client
  (:require [clj-http.client :as http]
            [cheshire.core :as json]
            [clojure.tools.logging :as log]
            [clojure.string :as str]))


;; Constants (would typically be in a separate constants namespace)
(def endpoints
  {:specialization-hierarchy "/api/specialization/hierarchy"
   :collections "/api/collections"
   :definition "/api/definition"
   :uid-search "/api/search/uid"
   :text-search "/api/search/text"
   :entity-type "/api/entity/type"
   :related-facts "/api/facts/related"
   :subtypes "/api/subtypes"
   :subtypes-cone "/api/subtypes/cone"
   :classified "/api/classified"
   :classification-fact "/api/classification/fact"
   :concept-entities "/concept/entities"
   :entity-prompt "/retrieveEntity/prompt"
   :validate-binary-fact "/api/facts/binary/validate"
   :submit-binary-fact "/api/facts/binary/submit"})

(def base-url
  (or (System/getenv "ARCHIVIST_URL") "http://localhost:3000"))

(defn- make-request
  "Generic request handler with error handling"
  [method endpoint & [opts]]
  (try
    (let [url (str base-url endpoint)
          response (http/request
                    (merge
                      {:method method
                       :url url
                       :as :json
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
(defn get-specialization-hierarchy [uid]
  (make-request :get (endpoints :specialization-hierarchy)
               {:query-params {:uid uid}}))

(defn get-collections [uid]
  (make-request :get (endpoints :collections)
               {:query-params {:uid uid}}))

(defn get-definition [uid]
  (make-request :get (endpoints :definition)
               {:query-params {:uid uid}}))

(defn uid-search
  ([search-term] (uid-search search-term ""))
  ([search-term collection-uid]
   (make-request :get (endpoints :uid-search)
                {:query-params {:searchTerm search-term
                              :collectionUID collection-uid}})))

(defn text-search
  ([search-term]
   (text-search search-term 1 50))
  ([search-term page page-size]
   (make-request :get (endpoints :text-search)
                {:query-params {:searchTerm search-term
                              :page page
                              :pageSize page-size
                              :collectionUID ""}})))

(defn get-entity-type [uid]
  (make-request :get (endpoints :entity-type)
               {:query-params {:uid uid}}))

(defn get-all-related-facts
  ([uid] (get-all-related-facts uid 1))
  ([uid depth]
   (make-request :get (endpoints :related-facts)
                {:query-params {:uid uid
                              :depth depth}})))

(defn get-subtypes [uid]
  (make-request :get (endpoints :subtypes)
               {:query-params {:uid uid}}))

(defn get-subtypes-cone [uid]
  (make-request :get (endpoints :subtypes-cone)
               {:query-params {:uid uid}}))

(defn get-classified [uid]
  (make-request :get (endpoints :classified)
               {:query-params {:uid uid}}))

(defn get-classification-fact [uid]
  (make-request :get (endpoints :classification-fact)
               {:query-params {:uid uid}}))

(defn resolve-uids [uids]
  (make-request :get (endpoints :concept-entities)
               {:query-params {:uids (str "[" (str/join "," uids) "]")}}))

(defn get-entity-prompt [[_ uid]]
  (make-request :get (endpoints :entity-prompt)
               {:query-params {:uid uid}}))

(defn post-entity-prompt [uid prompt]
  (make-request :post (endpoints :entity-prompt)
               {:form-params {:uid uid
                            :prompt prompt}}))

(defn validate-binary-fact [fact]
  (make-request :get (endpoints :validate-binary-fact)
               {:query-params fact}))

(defn submit-binary-fact [fact]
  (make-request :post (endpoints :submit-binary-fact)
               {:body (json/generate-string fact)}))

;; Kind-specific functions (from previous discussion)
(defn get-kinds [{:keys [sort range filter user-id]}]
  (let [[sort-field sort-order] sort
        [range-start range-end] range
        request-params {"sort" (json/generate-string sort)
                       "range" (json/generate-string range)
                       "filter" (json/generate-string filter)
                       "user_id" user-id}]
    (tap> {:msg "Making request to Archivist get-kinds"
           :url (str base-url "/kinds")
           :params request-params})
    (make-request :get "/kinds"
                 {:query-params request-params})))

;; (defn get-kinds [{:keys [sort range filter user-id]}]
;;   (try
;;     (let [[sort-field sort-order] sort
;;           [range-start range-end] range
;;           response (http/get (str base-url "/api/kinds")
;;                            {:as :json
;;                             :throw-exceptions false
;;                             :query-params {"sort_field" sort-field
;;                                          "sort_order" sort-order
;;                                          "offset" range-start
;;                                          "limit" (- range-end range-start)
;;                                          "filter" (json/generate-string filter)
;;                                          "user_id" user-id}})]
;;       (if (= 200 (:status response))
;;         (:body response)
;;         (throw (ex-info "Failed to fetch kinds from Archivist"
;;                        {:status (:status response)
;;                         :body (:body response)}))))
;;     (catch Exception e
;;       (log/error e "Error fetching kinds from Archivist")
;;       (throw e))))
