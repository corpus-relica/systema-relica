(ns io.relica.portal.handlers.http
  (:require [clojure.core.async :refer [go <!]]
            [org.httpkit.server :as http]
            [cheshire.core :as json]
            [io.relica.portal.io.archivist-client
             :as archivist
             :refer [archivist-client]]
            [io.relica.portal.io.aperture-client
             :as aperture
             :refer [aperture-client]]
            [io.relica.portal.auth.websocket
             :as ws-auth
             :refer [socket-tokens
                     connected-clients
                     validate-socket-token
                     generate-socket-token]]
            [io.relica.portal.handlers.websocket :refer [handle-ws-message]]))


(defn handle-get-kinds [{:keys [params] :as req}]
  (let [user-id (-> req :identity :user-id)
        params {:sort (or (some-> params :sort read-string)
                     ["name" "ASC"])
           :range (or (some-> params :range read-string)
                      [0 10])
           :filter (or (some-> params :filter read-string)
                       {})
                ;;parse float
           :user-id user-id}]
  (go
    (try
      (let [result (<! (archivist/get-kinds
                        archivist-client
                        params))]
        {:status 200
         :headers {"Content-Type" "application/json"}
         :body (json/generate-string (:data result))})
      (catch Exception e
        (tap> (str "Failed to fetch kinds:" e))
        {:status 500
         :headers {"Content-Type" "application/json"}
         :body {:error "Failed to fetch kinds"
                :message (.getMessage e)}})))))


(defn ws-handler [{:keys [params] :as request}]
  (tap> "WS HANDLER START")
  (if-let [token (:token params)]
    (if-let [user-id (validate-socket-token token)]
      (http/with-channel request channel
        (let [client-id (str (random-uuid))] (swap! connected-clients assoc client-id {:channel channel :user-id user-id})
          (tap> "WS HANDLER MORE OR LESS COMPLETE")
          (http/on-close channel
                        (fn [status]
                          (swap! connected-clients dissoc client-id)
                          (tap> (str "WebSocket closed:" status))))
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


(defn handle-ws-auth [request]
  (if-let [user-id (-> request :identity :user-id)]
    (let [socket-token (generate-socket-token)]
      (swap! socket-tokens assoc socket-token
             {:user-id user-id
              :created-at (System/currentTimeMillis)})
      {:status 200
       :body {:token socket-token}})
    {:status 401
     :body {:error "Authentication failed"}}))


(defn handle-resolve-uids [{:keys [params body] :as request}]
  (let [uids (or (some-> params :uids read-string)  ; Handle query param array
                 (:uids body)                        ; Handle JSON body
                 [])]
    (go
      (try
        (let [result (<! (archivist/resolve-uids
                          archivist-client
                          uids))]
          {:status 200
           :headers {"Content-Type" "application/json"}
           :body (json/generate-string (:data result))})
        (catch Exception e
          (tap> (str"Failed to resolve UIDs:" e))
          {:status 500
           :headers {"Content-Type" "application/json"}
           :body {:error "Failed to resolve entities"
                 :message (.getMessage e)}})))))

(defn handle-get-environment [{:keys [identity]}]
  (go
    (try
      (let [response (<! (aperture/get-environment
                          aperture-client
                          (:user-id identity)))]
        {:status 200
         :headers {"Content-Type" "application/json"}
         :body (json/generate-string (:environment response))})
      (catch Exception e
        (tap> (str "Failed to fetch environment:" e))
        {:error "Failed to fetch environment"}))))
