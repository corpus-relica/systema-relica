(ns io.relica.archivist.basis.lineage
  (:require [clojure.core.async :refer [<! go]]
            [io.relica.archivist.basis.core :refer [get-relations
                                                    get-relations-r]]
           ;;                                         get-paths-between-entities]]
            [io.relica.common.services.cache-service :as cache :refer [cache-service-comp]]
            [io.relica.archivist.core.linearization :as linearization]))



(defn get-supertype
  "get supertype concepts from a given entity;
  returns a set of uids"
  [uid]
  (let [result (get-relations uid {:direction :outgoing
                                   :edge-type 1146})]
    result))

(defn get-supertypes-r
  "get supertype concepts recursively to distance n;
  returns a set of uids"
  [uid n]
  (get-relations-r uid {:direction :outgoing
                        :edge-type 1146
                        :max-depth n}))

(defn calculate-lineage
  "compute all paths from input node to root node 73000,
  collapse into deterministic list of uids;
  returns list of uids"
  [uid]
  ;; maybe use get-paths-between-two-entitties
  (linearization/calculate-lineage uid))

(defn get-lineage
  "get deterministic ordered list of all ancestors of input uid;
  returns list of uids"
  [uid]
  (cache/lineage-of @cache-service-comp uid))

;; ------------------------------------------------------------------

(defn find-common-ancestor
  "Find closest common ancestor between two entities;
   returns uid or nil"
  [uid1 uid2]
  (let [lineage1 (get-lineage uid1)
        lineage2 (get-lineage uid2)
        ;; Reverse both lineages to start from the root
        ;; This assumes lineages are ordered from entity to root
        rev-lineage1 (reverse lineage1)
        rev-lineage2 (reverse lineage2)
        ;; Find the point of divergence by comparing pairs
        common-prefix (take-while (fn [[a b]] (= a b))
                                  (map vector rev-lineage1 rev-lineage2))
        ;; The last element before divergence is the closest common ancestor
        closest-common (when (seq common-prefix)
                         (first (last common-prefix)))]
    closest-common))

;; ------------------------------------------------------------------

(comment

  (go
    (let [val (<! (get-supertype 730044))]
      (println "Supertypes of 730044:" (count val))))

  (go
    (let [val (<! (get-supertypes-r 193671 5))]
      (println "Supertypes of 193671:" (count val))))

  (go
    (let [val  (calculate-lineage 193671)]
      (println "Lineage of 730044:" val)))

  (go
    (let [val (get-lineage 730044)]
      (println "Lineage of 730044:" val)))

  (go
    (let [val (get-lineage 193671)]
      (println "Lineage of 193671:" val)))

  (println "Common ancestor of 730044 and 730045:"
           (find-common-ancestor 790229 193671))

  (print))
