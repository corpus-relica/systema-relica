(ns io.relica.archivist.services.fact-service
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.archivist.services.cache-service :as cache]
            [io.relica.archivist.services.concept-service :as concept]
            [io.relica.archivist.services.uid-service :as uid]
            [io.relica.archivist.db.queries :as queries]))

(defprotocol FactOperations
  (get-subtypes [this uid])
  (get-subtypes-cone [this uid])
  (get-classified [this uid recursive])
  (get-facts-about-individual [this uid])
  (get-all-related-facts [this uid])
  (delete-fact [this uid])
  (delete-entity [this uid]))

(defrecord FactService [graph-service gellish-base-service cache-service concept-service uid-service]
  FactOperations
  (get-subtypes [_ uid]
    (let [result (graph/exec-query graph-service queries/subtypes {:uid uid})]
      (->> result
           (map #(get-in % [:r :properties]))
           (map #(into {} %)))))

  (get-subtypes-cone [this uid]
    (go
      (let [subtypes (<! (cache/all-descendants-of cache-service uid))
            facts (map #(get-subtypes this %) subtypes)]
        (flatten facts))))

  (get-classified [this uid recursive]
    (go
      (try
        (let [direct-results (graph/exec-query graph-service
                                              queries/classified
                                              {:uid uid})
              direct-classified (if (empty? direct-results)
                                []
                                (graph/transform-results graph-service direct-results))]
          (tap> (str "Direct classified: " direct-classified))
          (tap> direct-results)
          (if-not recursive
            direct-classified
            (let [subtypes (<! (cache/all-descendants-of cache-service uid))
                  subtypes-facts (map #(get-classified this % false) subtypes)
                  all-facts (concat direct-classified (flatten subtypes-facts))]
              all-facts)))
        (catch Exception e
          (log/error "Error in get-classified:" e)
          (throw e)))))

  (get-facts-about-individual [_ uid]
    (let [query queries/facts-about-individual
          result (graph/exec-query graph-service query {:uid uid})]
      (->> result
           (map #(get-in % [:r :properties]))
           (map #(into {} %)))))

  (get-all-related-facts [_ uid]
    (tap> "------------------- GET ALL RELATED FACTS -------------------")
    (tap> cache-service)
    (go
      (try
        (let [;; Get all specialization subtypes to exclude
              subtypes-1146 (cache/all-descendants-of cache-service 1146) ;;(set (<! (cache/all-descendants-of cache-service 1146)))
              ;; Get all fact types
              subtypes-2850 (cache/all-descendants-of cache-service 2850) ;;(set (<! (cache/all-descendants-of cache-service 2850)))
              ;; Filter out specialization facts and their subtypes
              rel-type-uids (set (filter #(and (not (contains? subtypes-1146 %))
                                             (not= 1146 %))
                                       subtypes-2850))
              ;; Get all facts involving the entity
              results-2850 (graph/exec-query graph-service
                                     queries/all-related-facts-c
                                     {:start_uid uid
                                      :rel_type_uids rel-type-uids})
              res-2850 (graph/transform-results results-2850)
              _ (tap> res-2850)
              results-2850b (graph/exec-query
                             graph-service
                             queries/all-related-facts-d
                             {:start_uid uid
                              :rel_type_uids rel-type-uids}
                             )
              res-2850b (graph/transform-results results-2850b)
              ]
          (tap> "------------------- GET ALL RELATED FACTS RESULT -------------------")
          (tap> results-2850)
          (tap> results-2850b)
          (tap> res-2850)
          (tap> (concat res-2850 res-2850b))
          (concat res-2850 res-2850b)
          )
        (catch Exception e
          (log/error "Error in get-all-related-facts:" (ex-message e))
          []))))

  (delete-fact [_ uid]
    (let [query queries/delete-fact
          result (graph/exec-write-query graph-service query {:uid uid})]
      result))

  (delete-entity [_ uid]
    (let [query queries/delete-entity
          result (graph/exec-write-query graph-service query {:uid uid})]
      result)))

(defn create-fact-service [{:keys [graph
                                   gellish-base
                                   cache
                                   concept
                                   uid]}]
  (->FactService graph gellish-base cache concept uid))

(defonce fact-service (atom nil))

(defn start [services]
  (println "Starting Fact Service...")
  (let [service (create-fact-service services)]
    (reset! fact-service service)
    service))

(defn stop  []
  (println "Stopping Fact Service..."))


(comment
  ;; Test operations
  (let [test-service (create-fact-service graph-service nil cache-service nil nil)]
    (get-classified test-service 970178))

  @fact-service

  (go (let [xxx (<! (get-classified @fact-service 1000000061 true))]
        (println "XXX")
        (println xxx)
        xxx))


  )
