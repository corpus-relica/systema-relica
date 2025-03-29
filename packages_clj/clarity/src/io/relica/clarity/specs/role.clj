(ns io.relica.clarity.specs.role
  (:require [clojure.spec.alpha :as s]
            [expound.alpha :as expound]
            [io.relica.clarity.specs.base :as base]))


;; (s/def ::role-player
;;   (s/or :uid :io.relica.clarity.specs.base/uid
;;         :entity :io.relica.clarity.specs.base/entity-kind))

;; (s/def ::role-players
;;   (s/coll-of ::role-player :kind vector? :min-count 1))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; SPEC ;;

;;;;;;;;;;;;;;;;;;;;;;;;; KIND ;;

;; relation

(s/def ::kind-of-requiring-relation
  (s/or :uid :io.relica.clarity.specs.base/uid
        :entity #(do (require '[io.relica.clarity.specs.relation])
                     (s/valid? :io.relica.clarity.specs.relation/kind-of-relation %))))

(s/def ::requiring-kinds-of-relations
  (s/coll-of ::kind-of-requiring-relation :kind vector? :min-count 1))

;; roll-player

(s/def ::kind-of-role-player
  (s/or :uid :io.relica.clarity.specs.base/uid
        :entity :io.relica.clarity.specs.base/kind-of-entity))

(s/def ::possible-kinds-of-role-players
  (s/coll-of ::kind-of-role-player :kind vector? :min-count 1))

;;

(s/def ::kind-of-role
  (s/merge :io.relica.clarity.specs.base/kind-of-entity
           (s/keys :req-un [
                            ;; might also want to know in what position the role is in the relation
                            ::requiring-kinds-of-relations
                            ::possible-kinds-of-role-players
                            ])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;; INDIVIDUAL ;;

;; role is not to be instantiated directly,
;; instantiation is implied an individuals involved in a relation

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(comment

  (def some-kind-of-role
    {:uid 1
     :name "some kind of role"
     :nature :kind
     :definitions ["some definition"]
     :supertypes [1]
     :possible-kinds-of-role-players [1 2 3]
     :requiring-kinds-of-relations [1 2 3]})

  (expound/expound ::kind-of-role some-kind-of-role)

  )
