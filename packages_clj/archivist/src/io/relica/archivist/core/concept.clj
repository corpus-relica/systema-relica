(ns io.relica.archivist.core.concept
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.db.queries :as queries]
            [io.relica.archivist.servcies.graph-service :as graph]
            [io.relica.common.services.cache-service :as cache]
            [io.relica.archivist.core.gellish-base :as gellish]))


(defn delete-entity [uid]
  (go
    (try
      ;; Get all facts involving the entity
      (let [fact-uids (cache/all-facts-involving-entity cache/cache-service uid)
            facts (map #(gellish/get-fact %) fact-uids)]
        (log/debug "FACT UIDS" fact-uids)

        ;; Delete each fact and update cache
        (doseq [fact facts]
          (log/debug "FACT" fact)
            (cache/remove-from-facts-involving-entity cache/cache-service
                                                         (:lh_object_uid fact)
                                                         (:fact_uid fact))
            (cache/remove-from-facts-involving-entity cache/cache-service
                                                           (:rh_object_uid fact)
                                                           (:fact_uid fact))
          (graph/exec-write-query graph/graph-service
                                queries/delete-fact
                                {:uid (:fact_uid fact)}))

        ;; Remove entity from cache
        (cache/remove-entity cache/cache-service uid)

        ;; Delete the entity node
        (graph/exec-write-query graph/graph-service
                              queries/delete-entity
                              {:uid uid})

        ;; Return success result
        {:result "success"
         :uid uid
         :deleted-facts facts})
      (catch Exception e
        (log/error "Error deleting entity:" e)
        (throw e)))))


(comment
  ;; Test operations
  ;; (let [test-service (create-concept-service graph/graph-service cache/cache-service gellish-base-service)]
  ;;   (delete-entity test-service 123))

  )
