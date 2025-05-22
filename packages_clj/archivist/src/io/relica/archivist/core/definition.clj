(ns io.relica.archivist.core.definition
  (:require [clojure.tools.logging :as log]
            [clojure.pprint :as pp]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.db.queries :as queries]
            [io.relica.archivist.services.graph-service :as graph]))

(defn post-process [results]
  (map (fn [item]
         (let [obj (graph/convert-neo4j-ints (get-in item [:r]))]
           obj))
       results))

(defn exec-and-post-process [query uid]
  (go
    (try
      (let [results (graph/exec-query graph/graph-service query {:uid uid})]
        (post-process results))
      (catch Exception e
        (log/error "Error in exec-and-post-process:" (ex-message e))
        []))))

(defn get-definition [uid]
  (println "GOT UID !!!!!______________________>>>>" uid)
  (go
    (try
      (let [supertypes-res (<! (exec-and-post-process queries/supertypes uid))
            ;; synonyms-res (<! (exec-and-post-process queries/synonyms uid))
            ;; inverses-res (<! (exec-and-post-process queries/inverses uid))
            ;; intrinsic-aspects-res (<! (exec-and-post-process queries/intrinsic-aspects-def uid))
            ;; qualitative-aspects-res (<! (exec-and-post-process queries/qualitative-aspects-def uid))
            ;; intended-functions-res (<! (exec-and-post-process queries/intended-functions-def uid))
            ;; parts-res (<! (exec-and-post-process queries/parts-def uid))
            ;; collections-res (<! (exec-and-post-process queries/collections-def uid))
            defs (map #(:full_definition %) supertypes-res)
            ]

        ;; {:supertypes supertypes-res
        ;;  ;; :aliases {:synonyms synonyms-res
        ;;  ;;           :inverses inverses-res}
        ;;  ;; :intrinsicAspects intrinsic-aspects-res
        ;;  ;; :qualitativeAspects qualitative-aspects-res
        ;;  ;; :intendedFunctions intended-functions-res
        ;;  ;; :pictures {}  ;; TODO: Implement pictures
        ;;  ;; :information {}  ;; TODO: Implement information
        ;;  ;; :parts parts-res
        ;;  ;; :collections collections-res
        ;;  }
         defs
        )
      (catch Exception e
        (log/error "Error in get-definition:" (ex-message e))
        nil))))

(comment
  ;; Example usage in REPL
  (go
    (let [def (<! (get-definition 553068))]
      (pp/pprint def)))

  (print)) 
