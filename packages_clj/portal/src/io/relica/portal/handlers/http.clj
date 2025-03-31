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

;; Common response helpers
(def cors-headers
  {"Access-Control-Allow-Origin" "*"
   "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
   "Access-Control-Allow-Headers" "Content-Type, Authorization"})

(defn json-response [status body]
  {:status status
   :headers (merge {"Content-Type" "application/json"} cors-headers)
   :body (json/generate-string body)})

(defn success-response [data]
  (json-response 200 data))

(defn error-response
  ([msg] (error-response 500 msg))
  ([status msg]
   (json-response status {:error msg})))

(defn unauthorized-response [msg]
  (error-response 401 msg))

;; Common handler wrapper
(defn wrap-handler-with-error [handler error-msg]
  (fn [req]
    (go
      (try
        (handler req)
        (catch Exception e
          (tap> (str error-msg ":" e))
          (error-response error-msg))))))

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
                           :exactMatch exactMatch}))]
        (if (:success response)
          (success-response (:results response))
          (error-response (or (:error response) "Unknown error"))))
      (catch Exception e
        (tap> (str "Error in text search handler: " e))
        (error-response "Failed to execute text search")))))

(defn handle-get-kinds [{:keys [params identity]}]
  (go
    (let [params {:sort (parse-json-param (:sort params) ["name" "ASC"])
                  :range (parse-json-param (:range params) [0 10])
                  :filter (parse-json-param (:filter params) {})
                  :user-id (-> identity :user-id)}]
      (try
        (let [result (<! (archivist/get-kinds archivist-client params))]
          (success-response (:data result)))
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
          (http/send! channel (json/generate-string {:id "system"
                                                     :type "system:clientRegistered"
                                                     :payload {:success true
                                                               :clientID client-id
                                                               :message "Connection established"
                                                               }}))
          (http/on-close channel
                         (fn [status]
                           (swap! connected-clients dissoc client-id)
                           ))
          (http/on-receive channel
                           (fn [data]
                             (handle-ws-message channel data)))))
      {:status 401
       :headers {"Content-Type" "application/json"
                 "Access-Control-Allow-Origin" "*"
                 "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
                 "Access-Control-Allow-Headers" "Content-Type, Authorization"}
       :body (json/generate-string {:error "Invalid token"})})
    {:status 401
     :headers {"Content-Type" "application/json"
               "Access-Control-Allow-Origin" "*"
               "Access-Control-Allow-Methods" "GET, POST, OPTIONS"
               "Access-Control-Allow-Headers" "Content-Type, Authorization"}
     :body (json/generate-string {:error "No token provided"})}))

(defn handle-get-collections [req]
  (go
    (try
      (let [result (<! (archivist/get-collections archivist-client))]
        (success-response (:collections result)))
      (catch Exception e
        (error-response "Failed to fetch collections")))))

(defn handle-get-entity-type [{:keys [params]}]
  (go
    (try
      (let [uid (some-> params :uid parse-long)
            response (<! (archivist/get-entity-type archivist-client uid))]
        (if (:success response)
          (success-response {:type (:type response)})
          (error-response (or (:error response) "Unknown error"))))
      (catch Exception e
        (error-response "Failed to get entity type")))))

(defn handle-get-environment [{:keys [identity params] :as request}]
  (go
    (try
      (let [response (<! (aperture/get-environment
                          aperture-client
                          (:user-id identity)
                          nil))
            env (:environment response)]
        (println "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
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
                          uids))]
          (success-response (:data result)))
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
          (success-response (:model response))
          (error-response (or (:error response) "Unknown error"))))
      (catch Exception e
        (error-response "Failed to get model")))))

(defn handle-get-kind-model [{:keys [params]}]
  (go
    (try
      (let [uid (some-> params :uid parse-long)
            response (<! (clarity/get-kind-model clarity-client uid))]
        (if (:success response)
          (success-response (:model response))
          (error-response (or (:error response) "Unknown error"))))
      (catch Exception e
        (error-response "Failed to get kind model")))))

(defn handle-get-individual-model [{:keys [params]}]
  (go
    (try
      (let [uid (some-> params :uid parse-long)
            response (<! (clarity/get-individual-model clarity-client uid))]
        (if (:success response)
          (success-response (:model response))
          (error-response (or (:error response) "Unknown error"))))
      (catch Exception e
        (error-response "Failed to get individual model")))))

(defn handle-get-classified[{:keys [params]}]
  (go
    (try
      (let [uid (some-> params :uid parse-long)
            response (<! (archivist/get-classified archivist-client uid))]
        (if (:success response)
          (success-response (:facts response))
          (error-response (or (:error response) "Unknown error"))))
      (catch Exception e
        (error-response "Failed to get classified")))))

(defn handle-get-subtypes[{:keys [params]}]
  (go
    (try
      (let [uid (some-> params :uid parse-long)
            response (<! (archivist/get-subtypes archivist-client uid))]
        (tap> "SUKKH MAH DICK")
        (tap> response)
        (if (:success response)
          (success-response (:facts response))
          (error-response (or (:error response) "Unknown error"))))
      (catch Exception e
        (error-response "Failed to get subtypes")))))

(defn handle-get-subtypes-cone[{:keys [params]}]
  (go
    (try
      (let [uid (some-> params :uid parse-long)
            response (<! (archivist/get-subtypes-cone archivist-client uid))]
        (if (:success response)
          (success-response (:facts response))
          (error-response (or (:error response) "Unknown error"))))
      (catch Exception e
        (error-response "Failed to get subtypes cone")))))
