(ns rlc.clarity.core
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [clj-http.client :as client]
            [rlc.clarity.service :as service]
            [portal.api :as p]))

(defonce server (atom nil))

;; (defn start-server [service-map]
;;   (http/start (http/create-server service-map)))

(defn start [service-map]
  (println "Starting server on port 3002...")
  (tap> "Starting server on port 3002...")
  (try
    (let [server-instance (-> service-map
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

  ;; Start portal with web UI
  (p/open {:port 5555
           :host "0.0.0.0"  ;; Allow external connections
           :launcher :web    ;; Ensure web UI is used
           :window false})   ;; Don't try to open a browser window
  (add-tap #'p/submit)

  (restart))

(comment
  (restart)

  (start service/service-map)

  (stop)

  @server

  ;; Add these:
  (::http/service-fn @server)  ;; Should return a function if server is running

  (::http/server @server)

  )
