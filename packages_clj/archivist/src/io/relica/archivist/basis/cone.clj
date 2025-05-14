(ns io.relica.archivist.basis.cone
  (:require [io.relica.archivist.basis.core :refer [get-relations
                                                    get-relations-r
                                                    expand-types]]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.services.graph-service :as graph :refer [graph-service]]
            [clojure.set :as set]))


(defn get-subtypes
  "get subtype concepts of a given entity;
   returns a set of facts"
  [uid]
  (let [result (get-relations uid {:direction :incoming
                                   :edge-type 1146})]
    result))

(defn get-subtypes-r
  "get subtype concpts recursively to distance n;
  returns a set of uids"
  ([uid n]
   (get-relations-r uid {:direction :incoming
                         :edge-type 1146
                         :max-depth n})))

(defn calculate-cone
  "compute descendants from input node;
  returns set of uids"
  [uid]
  (go
    (let [subtype-rels (<! (get-subtypes-r uid 100))
          _ (println (count subtype-rels))
          subtype-uids (set (map :lh_object_uid subtype-rels))]
      subtype-uids)))

(defn get-cone
  "get the set of all descendants of input entity;
  returns set of uids"
  [uid]
  (expand-types uid))

;; ------------------------------------------------------------------

(comment

  (go
    (let [val (<! (get-subtypes 730034))]
      (println "Subtypes of 730044:" val)))

  (go
    (let [val (<! (get-subtypes-r 730034 2))]
      (println "Cone of 1146:" (count val))))

  (go
    (let [foo (<! (get-relations-r 730034 {:max-depth 1
                                           :direction :incoming
                                           :edge-type 1146}))]
      (println (count foo))))

  (go
    (let [val (<! (calculate-cone 730034))]
      (println "Cone of 1146:" (count val))))

  (go
    (let [val (<! (get-cone 730034))]
      (println "Cone of 1146:" (count val))))

  (print))
