(ns io.relica.archivist.services.uid-service
  (:require [mount.core :refer [defstate]]
            [clojure.tools.logging :as log]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.archivist.db.queries :as queries]
            [clojure.core.async :refer [<! go]]
            [neo4j-clj.core :as neo4j]
            ))

(defprotocol UIDOperations
  (init [this])
  (reserve-uid [this n]))

(defrecord UIDService [state]
  UIDOperations
  (init [_]
    (go
      (try
        (let [min-threshold 1000000000
              max-threshold 2000000000
              result (graph/exec-query graph/graph-service
                                       queries/highest-uid
                                        {:minThreshold min-threshold
                                         :maxThreshold max-threshold})
              highest-value (if (and (seq result)
                                     (get-in (first result) [:highestValue]))
                              (inc (graph/resolve-neo4j-int (get-in (first result) [:highestValue])))
                              min-threshold)]
          (println "//// init UID Service; current highest value:" highest-value)
          (reset! (:highest-value (.-state _)) highest-value)
          highest-value)
        (catch Exception e
          (println "Error initializing UID service:" e)
          (throw e)))))

  (reserve-uid
    [this n]
     (try
       (let [reserved-uids (atom [])]
         (dotimes [_ n]
           (let [next-uid (swap! (:highest-value (.-state this)) inc)]
             (println "//// reserve UID:" next-uid)
             (swap! reserved-uids conj next-uid)))
         @reserved-uids)
       (catch Exception e
         (log/error "An error occurred while reserving UIDs:" e)
         (throw e)))))

(defn create-uid-service []
  (->UIDService {:highest-value (atom 0)}))

;; Singleton instance for backward compatibility
;; (defonce uid-service (create-uid-service nil))

(defn start []
  (let [service (create-uid-service)]
    (go
      (<! (init service))
      service)))

(defn stop []
  ;; Currently, there's no specific cleanup needed for the UIDService,
  ;; but this function can be extended if necessary in the future.
  (log/info "Stopping UID Service..."))

;; UID SERVICE

(defstate uid-service
  :start (do
           (println "Starting UID service...")
           (start))
  :stop (do
          (println "Stopping Graph service...")
          (stop)))

(comment

  (def conn (neo4j/connect
             (java.net.URI. "bolt://localhost:7687")
             "neo4j"
             "password"))

  (def graph-service (graph/create-graph-service (fn [] (neo4j/get-session conn))))

  (def test-service (create-uid-service graph-service))

  ;; Test operations
  (go
    (let [foo (<! (init test-service))]
      (println "//// test-service --- foo:" foo)
      ))

  (reserve-uid test-service 5)


  )

