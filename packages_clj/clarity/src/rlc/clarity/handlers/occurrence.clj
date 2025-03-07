(ns rlc.clarity.handlers.occurrence
  (:require [clojure.spec.alpha :as s]
            [expound.alpha :as expound]
            [rlc.clarity.handlers.base :as base]
            [rlc.clarity.handlers.state :as state]
            [rlc.clarity.handlers.aspect :as aspect]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; SPEC ;;

;;;;;;;;;;;;;;;;;;;;;;;;; KIND ;;

;; ASPECT

(s/def ::kinds-of-aspects
  (s/coll-of (s/or :uid :rlc.clarity.handlers.base/uid
                   :entity #(do (require '[rlc.clarity.handlers.aspect])
                               (s/valid? :rlc.clarity.handlers.aspect/kind-of-aspect %)))))

(s/def ::definitive-kinds-of-aspects
  ::kinds-of-aspects)

(s/def ::possible-kinds-of-aspects
  ::kinds-of-aspects)

(s/def ::required-kinds-of-aspects
  ::kinds-of-aspects)

;; INVOLVEMENT

;; (s/def ::kinds-of-involvements
;;   (s/coll-of (s/or :uid :rlc.clarity.handlers.base/uid
;;                    :entity #(do (require '[rlc.clarity.handlers.relation])
;;                                (s/valid? :rlc.clarity.handlers.relation/relation-kind %)))))

(s/def ::kind-of-involvement
  (s/or :uid :rlc.clarity.handlers.base/uid
        :entity #(do (require '[rlc.clarity.handlers.relation])
                     (s/valid? :rlc.clarity.handlers.relation/kind-of-relation %))))

(s/def ::kind-of-involved
  (s/or :uid int?
        :entity :rlc.clarity.handlers.base/kind-of-entity))

(s/def ::kind-of-involvement-tuple
  (s/tuple ::kind-of-involvement ::kind-of-involved))

(s/def ::definitive-kinds-of-involvement
  (s/coll-of ::kind-of-involvement-tuple :kind vector? :min-count 1))

(s/def ::possible-kinds-of-involvement
  (s/coll-of ::kind-of-involvement-tuple :kind vector? :min-count 1))

(s/def ::required-kinds-of-involvement
  (s/coll-of ::kind-of-involvement-tuple :kind vector? :min-count 1))

;; DEFINITION

(s/def ::kind-of-occurrence
  (s/merge
    :rlc.clarity.handlers.state/kind-of-state
    (s/keys :opt-un [
                     ::definitive-kinds-of-aspects
                     ::possible-kinds-of-aspects
                     ::required-kinds-of-aspects

                     ;; relations where this is the involving occurrence
                     ::definitive-kinds-of-involvement
                     ::possible-kinds-of-involvement
                     ::required-kinds-of-involvement

                     ])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; INDIVIDUAL ;;

;; ASPECT

(s/def ::aspects
  (s/coll-of (s/or :uid :rlc.clarity.handlers.base/uid
                   :entity #(do (require '[rlc.clarity.handlers.aspect])
                               (s/valid? :rlc.clarity.handlers.aspect/individual-aspect %)))))

;; INVOLVEMENT

(s/def ::individual-involvement
  (s/or :uid int?
        :entity :rlc.clarity.handlers.relation/individual-relation))

(s/def ::individual-involved
  (s/or :uid int?
        :entity :rlc.clarity.handlers.base/individual-entity))

(s/def ::individual-involvement-tuple
  (s/tuple ::individual-involvement ::individual-involved))

(s/def ::involvements
  (s/coll-of ::individual-involvement-tuple :kind vector? :min-count 1))

(s/def ::occurrence-type #{:activity :process :event :deed})

(s/def :rlc.clarity.handlers.occurrence/individual-occurrence
  (s/merge :rlc.clarity.handlers.state/individual-state
           (s/keys :req-un [::occurrence-type]
                   :opt-un [

                            ::aspects
                            ::involvements

                            ;; ::happens-during
                            ;; ::happens-within
                            ;; ::place-of-begin
                            ;; ::place-of-end
                            ;; ::involved

                            ])))

;; (s/def ::state #{:new :in-progress :completed :terminated})
;; (s/def ::timestamp inst?)
;; (s/def ::place-of-begin ::base/kind-ref)
;; (s/def ::place-of-end ::base/kind-ref)


;; (s/def :rlc.clarity.handlers.occurrence/happens-during ::aspect/period-in-time)

;; (s/def :rlc.clarity.handlers.occurrence/happens-within ::aspect/period-in-time)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; TEST ;;

(comment
  (def test-kind-of-occurrence
    {:uid 1
     :name "test kind of occurrence"
     :nature :kind
     :definitions ["some definition" "some other definition" "yet another definition"]
     :supertypes [1 2 3]
     :definitive-kinds-of-aspects [1 2 3]
     :possible-kinds-of-aspects [1 2 3]
     :required-kinds-of-aspects [1 2 3]
     :definitive-kinds-of-involvement [[1 2]]
     :possible-kinds-of-involvement [[1 2]]
     :required-kinds-of-involvement [[1 2]]
     })

  (expound/expound ::kind-of-occurrence test-kind-of-occurrence)

  (def test-individual-occurrence
    {:uid 1
     :name "test individual occurrence"
     :nature :individual
     :classifiers [1 2 3]
     :occurrence-type :activity
     :aspects [1 2 3]
     :involvements [[1 2]]
     })

  (expound/expound ::individual-occurrence test-individual-occurrence)

  )
