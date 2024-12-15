(ns rlc.clarity.core
  (:require [io.pedestal.http :as http]
            [io.pedestal.http.route :as route]
            [clj-http.client :as client]
            [rlc.clarity.routes :as routes]
            [rlc.clarity.service :as service]))

(defonce server (atom nil))

(defn start-server [service-map]
  (http/start (http/create-server service-map)))

(defn stop-server []
  (when-let [s @server]
    (http/stop s)))

(defn restart []
  (stop-server)
  (reset! server (start-server service/service-map)))

(defn -main [& args]
  (println "Starting Clarity CLJ service...")
  (reset! server (start-server service/service-map)))
