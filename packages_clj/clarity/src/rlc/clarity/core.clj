(ns rlc.clarity.core
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [clj-http.client :as client]
            [rlc.clarity.service :as service]
            [portal.api :as p]))

(defonce server (atom nil))

(defn start [service-map]
  (println "Starting server on port 3002...")
  (tap> "Starting server on port 3002...")
  (try
    (let [server-instance (-> service-map
                             (assoc ::http/port 3002
                                    ::http/host "0.0.0.0"
                                    ::http/allowed-origins {:creds true
                                                          :allowed-origins (constantly true)})
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
  (::http/server @server))
