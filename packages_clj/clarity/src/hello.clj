(ns hello
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]))

(defn respond-hello [request]
  {:status 200 :body request})

(def routes
  (route/expand-routes
   #{["/greet" :get respond-hello :route-name :greet]
    ;;  ["/physical-object" :get respond-physical-object :route-name :physical-object]
    ;;  ["/aspect" :get respond-aspect :route-name :aspect]
    ;;  ["/role" :get respond-role :route-name :aspect]
    ;;  ["/relation" :get respond-relation :route-name :aspect]
    ;;  ["/state" :get respond-state :route-name :aspect]
    ;;  ["/occurrence" :get respond-occurrence :route-name :aspect]
     }))

(defn create-server []
  (http/create-server
   {::http/routes routes
    ::http/type :jetty
    ::http/port 3002
    ::http/host "0.0.0.0"
    ::http/join? false}))

(def server (atom nil))

(defn start []
  (println "Starting server on port 3002...")
  (future
    (try
      (let [server-instance (http/start (create-server))]
        (reset! server server-instance)
        (.addShutdownHook (Runtime/getRuntime)
                          (Thread. #(when @server (http/stop @server))))
        (println "Server started successfully!"))
      (catch Exception e
        (println "Failed to start server:" (.getMessage e))))))

(defn stop []
  (println "Stopping server...")
  (when @server
    (try
      (http/stop @server)
      (reset! server nil)
      (println "Server stopped successfully!")
      (catch Exception e
        (println "Failed to stop server:" (.getMessage e))))))


(comment
  (start)

  (stop))