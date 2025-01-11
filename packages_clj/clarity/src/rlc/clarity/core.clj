(ns rlc.clarity.core
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [io.pedestal.interceptor :as interceptor]
            [clj-http.client :as client]
            [rlc.clarity.service :as service]
            [portal.api :as p]
            [ring.middleware.cors :as cors]))

;; Add CORS configuration
(def cors-config
  {:allowed-origins ["*"]
   :allowed-methods [:get :post :put :delete :options]
   :allowed-headers ["Content-Type" "Authorization"]
   :exposed-headers []
   :max-age 3600})

;; (defn wrap-cors [service-map]
;;   (update-in service-map
;;              [::http/interceptors]
;;              conj
;;              (cors/wrap-cors
;;               identity
;;               :allowed-origins (constantly true) ; Allows all origins
;;               :allowed-methods (:allowed-methods cors-config)
;;               :allowed-headers (:allowed-headers cors-config)
;;               :exposed-headers (:exposed-headers cors-config)
;;               :max-age (:max-age cors-config))))

(def cors-interceptor
  (interceptor/interceptor
    {:name ::cors
     :enter (fn [context]
              (let [response ((cors/wrap-cors
                              identity
                              :allowed-origins (constantly true)
                              :allowed-methods (:allowed-methods cors-config)
                              :allowed-headers (:allowed-headers cors-config)
                              :exposed-headers (:exposed-headers cors-config)
                              :max-age (:max-age cors-config))
                             (:request context))]
                (assoc context :response response)))}))

(defn wrap-cors [service-map]
  (update-in service-map
             [::http/interceptors]
             conj
             cors-interceptor))

(defonce server (atom nil))

(defn start [service-map]
  (println "Starting server on port 3002...")
  (tap> "Starting server on port 3002...")
  (try
    (let [server-instance (-> service-map
                             wrap-cors ; Add CORS wrapper
                             http/create-server
                             http/start)]
      (println "Server configuration:" (select-keys service-map [::http/port ::http/host]))
      (reset! server server-instance)
      (.addShutdownHook (Runtime/getRuntime)
                        (Thread. #(when @server (http/stop @server))))
      (println "Server started successfully!"))
    (catch Exception e
      (println "Failed to start server:" (.getMessage e))
      (println "Stack trace:" (ex-data e)))))

;; Rest of your code remains the same...
(defn stop []
  (println "Stopping server...")
  (when @server
    (try
      (http/stop @server)
      (reset! server nil)
      (println "Server stopped successfully!")
      (catch Exception e
        (println "Failed to stop server:" (.getMessage e))))))

(defn restart []
  (stop)
  (start service/service-map))

(defn -main [& args]
  (println "Starting Clarity CLJ service...")
  (p/open {:port 5555
           :host "0.0.0.0"
           :launcher :web
           :window false})
  (add-tap #'p/submit)
  (restart))

(comment
  (restart)

  (start service/service-map)
  (stop)

  @server
  (::http/service-fn @server)
  (::http/server @server)
)
