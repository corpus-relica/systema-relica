(ns io.relica.prism.services.cache-rebuild
  (:require [taoensso.timbre :as log]
            [clojure.core.async :refer [go <!]]
            [io.relica.prism.services.cache :as cache]
            [io.relica.prism.io.ws-server :as ws-server])
  (:import (java.lang Exception)))

(def ^:private rebuild-status (atom {:status :idle
                                     :progress 0
                                     :message nil
                                     :error nil}))

(defn- broadcast-status!
  "Broadcasts the current rebuild status to all connected clients"
  []
  (ws-server/broadcast! {:type :prism.cache/rebuild-progress
                         :data @rebuild-status}
                        10))

(defn- update-status!
  "Updates the rebuild status and broadcasts the update"
  [status-map]
  (swap! rebuild-status merge status-map)
  (broadcast-status!))

(defn get-rebuild-status
  "Returns the current rebuild status"
  []
  @rebuild-status)

(defn rebuild-all-caches!
  "Orchestrates the complete cache rebuild process.
   Returns a channel that will receive the final result."
  []
  (go
    (try
      ;; Check if already rebuilding
      (when (= (:status @rebuild-status) :rebuilding)
        (throw (ex-info "Cache rebuild already in progress" {})))

      ;; Start rebuild
      (update-status! {:status :rebuilding
                       :progress 0
                       :message "Starting cache rebuild"
                       :error nil})

      ;; Build entity facts cache (0-33%)
      (update-status! {:message "Building entity facts cache"})
      (let [facts-result (<! (cache/build-entity-facts-cache!))]
        (when-not facts-result
          (throw (ex-info "Failed to build entity facts cache" {})))
        (update-status! {:progress 33}))

      ;; Build entity lineage cache (33-66%)
      (update-status! {:message "Building entity lineage cache"})
      (let [lineage-result (<! (cache/build-entity-lineage-cache!))]
        (when-not lineage-result
          (throw (ex-info "Failed to build entity lineage cache" {})))
        (update-status! {:progress 66}))

      ;; Build subtypes cache (66-100%)
      (update-status! {:message "Building subtypes cache"})
      (let [subtypes-result (<! (cache/build-subtypes-cache!))]
        (when-not subtypes-result
          (throw (ex-info "Failed to build subtypes cache" {})))
        (update-status! {:progress 100}))

      ;; Complete
      (update-status! {:status :complete
                       :progress 100
                       :message "Cache rebuild completed successfully"})
      (log/info "Cache rebuild completed successfully")
      true
      (catch Exception e
        (log/error e "Error rebuilding caches")
        (update-status! {:status :error
                         :error (.getMessage e)
                         :message "Cache rebuild failed"})
        false))))

(defn reset-rebuild-status!
  "Resets the rebuild status to idle"
  []
  (reset! rebuild-status {:status :idle
                          :progress 0
                          :message nil
                          :error nil})
  (broadcast-status!))
