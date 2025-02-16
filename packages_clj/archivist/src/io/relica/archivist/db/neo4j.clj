(ns io.relica.archivist.db.neo4j
  (:require [mount.core :refer [defstate]]
            [neo4j-clj.core :as neo4j]
            [io.relica.archivist.db.queries :as queries])
  (:import (java.net URI)))

;;

;; (neo4j/defquery match-entities
;;   "MATCH (n) WHERE n.uid IN $uids RETURN n")

;; ;;(neo4j/defquery match-entities-by-uid
;; (neo4j/defquery uid-search-query
;;   "MATCH (kind:Entity)--(r:Fact)-->(parent:Entity)
;;    WHERE r.rel_type_uid IN $relTypeUIDs
;;    AND r.lh_object_uid = $searchTerm
;;    AND ($collectionUID = '' OR r.collection_uid = $collectionUID)
;;    RETURN r
;;    ORDER BY r.lh_object_name
;;    SKIP $skip LIMIT $pageSize")


;;


(defprotocol Neo4jOperations
  (execute-query [this query params])
  (execute-transaction [this tx-fn])
  (get-connection [this])
  (create-node [this labels properties])
  (create-relationship [this from-node to-node type properties]))

(defrecord Neo4jComponent [conn]
  Neo4jOperations
  (execute-query [this query params]
    (with-open [session (neo4j/get-session conn)]
      (let [results (query session params)]
        ;; Fully realize the results while session is open
        (doall (map (fn [record]
                     (into {} record))
                   results)))))

  (execute-transaction [this tx-fn]
    ;; (neo4j/with-transaction conn tx
    ;;   (tx-fn tx))
    )

  (get-connection [_]
    conn)

  (create-node [this labels properties]
    ;; (let [label-str (string/join ":" labels)
    ;;       query (str "CREATE (n:" label-str " $props) RETURN n")]
    ;;   (execute-query this query {:props properties}))
    )

  (create-relationship [this from-node to-node type properties]
    ;; (let [query (str "MATCH (a), (b) "
    ;;                 "WHERE ID(a) = $from AND ID(b) = $to "
    ;;                 "CREATE (a)-[r:" type " $props]->(b) "
    ;;                 "RETURN r")]
    ;;   (execute-query this query
    ;;                 {:from (:id from-node)
    ;;                  :to (:id to-node)
    ;;                  :props properties})))
  ))

(defn create-neo4j-component [^URI uri user password]
  (->Neo4jComponent (neo4j/connect uri user password)))

(defonce conn (atom nil))

(defn start [uri user password]
  (println "connecting to neo4j...")
  (let [connection (create-neo4j-component uri user password)]
    (reset! conn connection)))

(defn stop []
  (println "disconnecting from neo4j...")
  ;; (neo4j/disconnect @conn)
  )

(comment

  (start (URI. "bolt://localhost:7687") "neo4j" "password")

  @conn

  ;; (io.relica.archivist.db.neo4j/execute-query @conn "MATCH (n) RETURN n LIMIT 10" {})

  (io.relica.archivist.db.neo4j/execute-query @conn queries/entities {:uids [1225]})

  (io.relica.archivist.db.neo4j/execute-query @conn queries/uid-search-query {:relTypeUIDs [1146 1225]
                                                                      :searchTerm 990010
                                                                      :collectionUID ""
                                                                      :skip 0
                                                                      :pageSize 10})

  (stop)
  )
