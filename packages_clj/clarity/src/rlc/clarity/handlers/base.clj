(ns rlc.clarity.handlers.base
  (:require [clojure.spec.alpha :as s]
            [expound.alpha :as expound]))

;; Core specs
(s/def ::uid int?)
(s/def ::name string?)
(s/def ::definition string?)
(s/def ::definitions (s/coll-of ::definition :kind vector? :min-count 1))
(s/def ::nature #{:kind
                  :individual
                  :qualification})
(s/def ::kind-ref ::uid)
(s/def ::supertypes (s/coll-of ::kind-ref :kind vector? :min-count 1))
(s/def ::classifiers (s/coll-of ::kind-ref :kind vector? :min-count 1))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; SPEC ;;

(s/def ::entity-base
  (s/keys :req-un [::uid
                   ::name
                   ::nature]))

;;;;;;;;;;;;;;;;;;;;;;;;; KIND ;;

(s/def ::kind-of-entity
  (s/and ::entity-base
         #(= (:nature %) :kind)
         (s/keys :req-un [::definitions ::supertypes])
         #(= (count (:definitions %)) (count (:supertypes %)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; INDIVIDUAL ;;

(s/def ::individual-entity
  (s/and ::entity-base
         #(= (:nature %) :individual)
         (s/keys :req-un [::classifiers])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; QUALIFICATION ;;

(s/def ::qualified-entity
  (s/or :uid ::uid
        :entity ::kind-of-entity))

(s/def ::qualification-entity
  (s/and ::entity-base
         #(= (:nature %) :qualification)
         (s/keys :req-un [::qualified-entity])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; GENERIC ;;

(s/def ::entity
  (s/or :kind ::kind-of-entity
        :individual ::individual-entity))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; TEST ;;

(comment

  (def some-entity
    {:uid 1
     :name "some kind of occurrence"
     :nature :kind
     :definitions ["some definition" "some other definition" "yet another definition"]
     :supertypes [1 2 3]
     })

  (expound/expound :rlc.clarity.handlers.base/entity some-entity)

  (def some-other-entity
    {:uid 2
     :name "some other kind of occurrence"
     :nature :individual
     :classifiers [1 2 3]
     })

  (expound/expound :rlc.clarity.handlers.base/entity some-other-entity)

  ;; Valid example
  (def valid-kind
    {:uid 1
     :name "Valid Kind"
     :nature :kind
     :definitions ["Def 1" "Def 2"]
     :supertypes [100 200]})

  ;; Invalid example (count mismatch)
  (def invalid-kind
    {:uid 2
     :name "Invalid Kind"
     :nature :kind
     :definitions ["Only one definition"]
     :supertypes [300 400 500]})

  ;; Test validation
  (s/valid? ::kind-of-entity valid-kind)   ;; should return true

  (s/valid? ::kind-of-entity invalid-kind) ;; should return false

  (expound/expound ::kind-of-entity invalid-kind)

  (def some-qualified-entity
    {:uid 3
     :name "some qualified entity"
     :nature :qualification
     :qualified-entity {:uid 1
                        :name "some kind of occurrence"
                        :nature :kind
                        :definitions ["some definition"]
                        :supertypes [1]}})

  (def some-qualified-entity-too
    {:uid 3
     :name "some qualified entity"
     :nature :qualification
     :qualified-entity 1})

  (expound/expound ::qualification-entity some-qualified-entity)

  (expound/expound ::qualification-entity some-qualified-entity-too)

  )
