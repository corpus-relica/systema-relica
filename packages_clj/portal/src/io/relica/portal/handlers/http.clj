(ns io.relica.portal.handlers.http
  (:require [clojure.core.async :refer [go <!]]
            [org.httpkit.server :as http]
            [cheshire.core :as json]
            [io.relica.common.io.aperture-client :as aperture]
            [io.relica.common.io.archivist-client :as archivist]
            [io.relica.common.io.clarity-client :as clarity]
            [io.relica.portal.io.client-instances :refer [aperture-client
                                                          archivist-client
                                                          clarity-client]]
            [io.relica.portal.auth.websocket
             :as ws-auth
             :refer [socket-tokens
                     connected-clients
                     validate-socket-token
                     generate-socket-token]]
            [io.relica.portal.handlers.websocket :refer [handle-ws-message]]))

;; Common response helpers - standardized with Archivist format
(def cors-headers
  {"Access-Control-Allow-Origin" "*"
   "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
   "Access-Control-Allow-Headers" "Content-Type, Authorization"})

(defn json-response [status body]
  {:status status
   :headers (merge {"Content-Type" "application/json"} cors-headers)
   :body (json/generate-string body)})

;; Standardized success/error response format (REL-45/51)
(defn success-response
  ([data]
   (success-response data nil))
  ([data request-id]
   (json-response 200
                 {:success true
                  :request_id request-id
                  :data data})))

(def error-codes
  {;; System errors (1001-1099)
   :service-unavailable            1001
   :internal-error                 1002
   :timeout                        1003
   :service-overloaded             1004
   
   ;; Validation errors (1101-1199)
   :validation-error               1101
   :missing-required-field         1102
   :invalid-field-format           1103
   :invalid-reference              1104
   :constraint-violation           1105
   
   ;; Authorization errors
   :unauthorized                   1301
   :forbidden                      1302
   
   ;; Generic errors
   :not-found                      1401
   :bad-request                    1402
   })

(defn error-response
  ([error-msg]
   (error-response 500 :internal-error error-msg nil nil))
  ([status error-msg]
   (error-response status :internal-error error-msg nil nil))
  ([status error-type error-msg]
   (error-response status error-type error-msg nil nil))
  ([status error-type error-msg details]
   (error-response status error-type error-msg details nil))
  ([status error-type error-msg details request-id]
   (let [error-code (get error-codes error-type 1002)
         error-type-str (name error-type)]
     (json-response status
                   {:success false
                    :request_id request-id
                    :error {:code error-code
                            :type error-type-str
                            :message error-msg
                            :details details}}))))

(defn unauthorized-response
  ([msg] 
   (error-response 401 :unauthorized msg))
  ([msg details]
   (error-response 401 :unauthorized msg details)))

;; Common handler wrapper
(defn wrap-handler-with-error [handler error-msg]
  (fn [req]
    (go
      (try
        (handler req)
        (catch Exception e
          (tap> (str error-msg ":" e))
          (error-response 500 :internal-error error-msg {:exception (str e)}))))))

;; Parameter parsing helpers
(defn parse-int-param [param default]
  (try
    (Integer/parseInt param)
    (catch Exception _
      default)))

(defn parse-json-param [param default]
  (try
    (some-> param read-string)
    (catch Exception _
      default)))

;; Handlers
(defn handle-text-search [{:keys [params]}]
  (go
    (try
      (let [{:keys [searchTerm collectionUID page pageSize filter exactMatch]
             :or {page "1" pageSize "10" exactMatch false}} params
            response (<! (archivist/text-search
                          archivist-client
                          {:searchTerm searchTerm
                           :collectionUID collectionUID
                           :page (parse-int-param page 1)
                           :pageSize (parse-int-param pageSize 10)
                           :filter filter
                           :exactMatch exactMatch}))
            ;; Handle new standardized format with data field
            result (if (:success response)
                     ;; Check if response has a data field (new format) or results field (old format)
                     (if (:data response)
                       (get-in response [:data :results])  ; New format
                       (:results response))               ; Old format
                     nil)]
        (if (:success response)
          (success-response result)
          (let [error (if (map? (:error response))  ; New error format
                        (get-in response [:error :message])
                        (:error response))]         ; Old error format
            (error-response 500 :database-error (or error "Unknown error")))))
      (catch Exception e
        (tap> (str "Error in text search handler: " e))
        (error-response 500 :internal-error "Failed to execute text search" {:exception (str e)})))))

(defn handle-get-kinds [{:keys [params identity]}]
  (go
    (let [params {:sort (parse-json-param (:sort params) ["name" "ASC"])
                  :range (parse-json-param (:range params) [0 10])
                  :filter (parse-json-param (:filter params) {})
                  :user-id (-> identity :user-id)}]
      (try
        (let [result (<! (archivist/get-kinds archivist-client params))
              ;; Handle response format based on its structure
              kinds-data (if (:data result)
                          ;; New format - might have nested data field
                          (if (contains? (:data result) :data)
                            (get-in result [:data :data])  ; Double-nested data
                            (:data result))                ; Single-nested data
                          ;; Old format - extract directly
                          (:data result))]
          (success-response kinds-data))
        (catch Exception e
          (error-response "Failed to fetch kinds"))))))

(defn handle-ws-auth [{:keys [params] :as request}]
  (if-let [user-id (-> request :identity :user-id)]
    (let [socket-token (generate-socket-token)]
      (swap! socket-tokens assoc socket-token
             {:user-id user-id
              :created-at (System/currentTimeMillis)})
      (success-response {:token socket-token}))
    (unauthorized-response "Authentication failed")))

(defn ws-handler [{:keys [params] :as request}]
  (if-let [token (:token params)]
    (if-let [user-id (validate-socket-token token)]
      (http/with-channel request channel
        (let [client-id (str (random-uuid))]
          (swap! connected-clients assoc client-id {:channel channel :user-id user-id})
          ;; Use standardized response format for client registration
          (http/send! channel (json/generate-string {:id "system"
                                                     :type "system:clientRegistered"
                                                     :success true
                                                     :data {:clientID client-id
                                                            :message "Connection established"}}))
          (http/on-close channel
                         (fn [status]
                           (swap! connected-clients dissoc client-id)
                           ))
          (http/on-receive channel
                           (fn [data]
                             (handle-ws-message channel data)))))
      (unauthorized-response "Invalid token"))
    (unauthorized-response "No token provided")))

(defn handle-get-collections [req]
  (print "GET COLLECTIONS" req)
  (go
    (try
      (let [result (<! (archivist/get-collections archivist-client))
            ;; Handle new standardized format with data field
            collections (if (:data result)
                          (get-in result [:data :collections])  ; New format
                          (:collections result))]               ; Old format
        (println "RESULT" result)
        (success-response collections))
      (catch Exception e
        (error-response 500 :database-error "Failed to fetch collections" {:exception (str e)})))))

(defn handle-get-entity-type [{:keys [params]}]
  (go
    (try
      (let [uid (some-> params :uid parse-long)
            response (<! (archivist/get-entity-type archivist-client uid))]
        (if (:success response)
          (success-response {:type (get-in response [:data :type])})
          (error-response (get-in response [:error :message] "Unknown error"))))
      (catch Exception e
        (error-response "Failed to get entity type")))))

(defn handle-get-environment [{:keys [identity params] :as request}]
  (go
    (try
      (let [t (System/currentTimeMillis)
            response (<! (aperture/get-environment
                          aperture-client
                          (:user-id identity)
                          nil))
            env (get-in response [:data :environment])]
        (println "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        (println "TIME" (- (System/currentTimeMillis) t) "ms")
        (println "ENVIRONMENT" response)
        (swap! connected-clients update-in [(:clientId params)] assoc :environment-id (:id env))
        (success-response env))
      (catch Exception e
        (error-response "Failed to fetch environment")))))

(defn handle-resolve-uids [{:keys [params body] :as request}]
  (let [uids (or (some-> params :uids read-string)  ; Handle query param array
                 (:uids body)                        ; Handle JSON body
                 [])]
    (go
      (try
        (let [result (<! (archivist/resolve-uids
                          archivist-client
                          uids))
              ;; Handle response format based on its structure
              resolved-data (if (:data result)
                             ;; New format - extract from data field
                             (if (contains? (:data result) :data)
                               (get-in result [:data :data])  ; Double-nested data
                               (:data result))                ; Single-nested data
                             ;; Old format - extract directly 
                             (:data result))]
          (success-response resolved-data))
        (catch Exception e
          (error-response "Failed to resolve entities"))))))

;; ---------------------------------------------------------------------------

(defn handle-get-model [{:keys [params]}]
  (go
    (try
      (let [uids (:uids params)
            uid (parse-long (first uids))
            response (<! (clarity/get-model clarity-client uid))]
        (if (:success response)
          (success-response (get-in response [:data :model]))
          (error-response (get-in response [:error :message] "Unknown error"))))
      (catch Exception e
        (error-response "Failed to get model")))))

(defn handle-get-kind-model [{:keys [params]}]
  (go
    (try
      (let [uid (some-> params :uid parse-long)
            response (<! (clarity/get-kind-model clarity-client uid))]
        (if (:success response)
          (success-response (get-in response [:data :model]))
          (error-response (get-in response [:error :message] "Unknown error"))))
      (catch Exception e
        (error-response "Failed to get kind model")))))

(defn handle-get-individual-model [{:keys [params]}]
  (go
    (try
      (let [uid (some-> params :uid parse-long)
            response (<! (clarity/get-individual-model clarity-client uid))]
        (if (:success response)
          (success-response (get-in response [:data :model]))
          (error-response (get-in response [:error :message] "Unknown error"))))
      (catch Exception e
        (error-response "Failed to get individual model")))))

(defn handle-get-classified[{:keys [params]}]
  (go
    (try
      (let [uid (some-> params :uid parse-long)
            response (<! (archivist/get-classified archivist-client uid))
            ;; Handle response format based on its structure
            facts (if (:data response)
                    ;; New format - extract from data field
                    (get-in response [:data :facts])
                    ;; Old format - extract directly 
                    (:facts response))]
        (if (:success response)
          (success-response facts)
          (let [error (if (map? (:error response))
                        ;; New format - extract error message
                        (get-in response [:error :message])
                        ;; Old format - use error directly
                        (:error response))]
            (error-response (or error "Unknown error")))))
      (catch Exception e
        (error-response "Failed to get classified")))))

(defn handle-get-subtypes[{:keys [params]}]
  (go
    (try
      (let [uid (some-> params :uid parse-long)
            response (<! (archivist/get-subtypes archivist-client uid))
            ;; Handle response format based on its structure
            facts (if (:data response)
                    ;; New format - extract from data field
                    (get-in response [:data :facts])
                    ;; Old format - extract directly 
                    (:facts response))]
        (tap> "GET SUBTYPES RESPONSE")
        (tap> response)
        (if (:success response)
          (success-response facts)
          (let [error (if (map? (:error response))
                        ;; New format - extract error message
                        (get-in response [:error :message])
                        ;; Old format - use error directly
                        (:error response))]
            (error-response (or error "Unknown error")))))
      (catch Exception e
        (error-response "Failed to get subtypes")))))

(defn handle-get-subtypes-cone[{:keys [params]}]
  (go
    (try
      (let [uid (some-> params :uid parse-long)
            response (<! (archivist/get-subtypes-cone archivist-client uid))
            ;; Handle response format based on its structure
            facts (if (:data response)
                    ;; New format - extract from data field
                    (get-in response [:data :facts])
                    ;; Old format - extract directly 
                    (:facts response))]
        (if (:success response)
          (success-response facts)
          (let [error (if (map? (:error response))
                        ;; New format - extract error message
                        (get-in response [:error :message])
                        ;; Old format - use error directly
                        (:error response))]
            (error-response (or error "Unknown error")))))
      (catch Exception e
        (error-response "Failed to get subtypes cone")))))
