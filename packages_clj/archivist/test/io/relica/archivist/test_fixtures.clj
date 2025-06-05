(ns io.relica.archivist.test-fixtures
  "Test fixtures and mock services for archivist tests"
  (:require [mount.core :as mount]
            [io.relica.archivist.services.uid-service :as uid-svc]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.common.services.cache-service :as cache]
            [clojure.tools.logging :as log]))

;; Mock UID Service implementation
(defrecord MockUIDService [counter]
  uid-svc/UIDOperations
  (init [_] 
    (reset! counter 10000)
    10000)
  
  (reserve-uid [_ n]
    (let [start @counter
          uids (vec (range start (+ start n)))]
      (swap! counter + n)
      uids)))

(defn create-mock-uid-service []
  (->MockUIDService (atom 10000)))

;; Mock Graph Service
(def mock-graph-results (atom {}))

(defn mock-exec-query [_ query params]
  (log/debug "Mock exec-query called with" {:query query :params params})
  (get @mock-graph-results query []))

(defn mock-exec-write-query [_ query params]
  (log/debug "Mock exec-write-query called with" {:query query :params params})
  ;; Return a mock fact with the provided properties
  ;; Since we're using higher-level mocks in the tests, this can be simple
  (let [fact-properties (merge {:fact_uid (rand-int 100000)} 
                              (:properties params))]
    [{:r {:properties fact-properties}}]))

;; Mock Cache Service
(def mock-cache-state (atom {:updated-entities #{}
                            :entity-facts {}}))

(defn mock-update-facts-involving-entity [_ uid]
  (swap! mock-cache-state update :updated-entities (fnil conj #{}) uid))

(defn mock-add-to-entity-facts-cache [_ entity-uid fact-uid]
  (swap! mock-cache-state update-in [:entity-facts entity-uid] conj fact-uid))

(defn mock-clear-descendants [_]
  (swap! mock-cache-state assoc :descendants-cleared true))

;; Test fixture for mounting mock services
(defn with-mock-services [f]
  (let [original-states (mount/stop)]
    (try
      ;; Set up mock services
      (with-redefs [uid-svc/uid-service (create-mock-uid-service)
                    graph/graph-service (atom {:mock true})
                    graph/exec-query mock-exec-query
                    graph/exec-write-query mock-exec-write-query
                    graph/convert-neo4j-ints identity
                    graph/transform-results (fn [results] 
                                             (map #(get-in % [:r :properties]) results))
                    cache/cache-service (atom {:mock true})
                    cache/update-facts-involving-entity mock-update-facts-involving-entity
                    cache/add-to-entity-facts-cache mock-add-to-entity-facts-cache
                    cache/clear-descendants mock-clear-descendants]
        ;; Reset mock states
        (reset! mock-graph-results {})
        (reset! mock-cache-state {:updated-entities #{}
                                 :entity-facts {}})
        ;; Run the test
        (f))
      (finally
        ;; Restore original states if needed
        (when original-states
          (mount/start))))))

;; Convenience function to set expected query results
(defn set-mock-query-result! [query result]
  (swap! mock-graph-results assoc query result))

;; Convenience function to get mock cache state
(defn get-mock-cache-state []
  @mock-cache-state)