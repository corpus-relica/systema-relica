(ns rlc.clarity.handlers.aspect
  (:require [clojure.spec.alpha :as s]
            [expound.alpha :as expound]
            [rlc.clarity.handlers.base :as base]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; SPEC ;;

(s/def ::aspect-nature #{:qualitative :quantitative})

(s/def ::qualitative-value
  (s/or :uid :rlc.clarity.handlers.base/uid
       :entity :rlc.clarity.handlers.base/qualification-entity))

(s/def ::uom-value
  (s/or :uid :rlc.clarity.handlers.base/uid
        :entity :rlc.clarity.handlers.base/kind-entity))

;;;;;;;;;;;;;;;;;;;;;;;;; KIND ;;

;; ;; (s/def ::intrinsic boolean?)

(s/def ::kind-of-possessor-or-ref
  (s/or :uid :rlc.clarity.handlers.base/uid
        :entity :rlc.clarity.handlers.base/kind-of-entity))

(s/def ::kinds-of-possessors
  (s/coll-of ::kind-of-possessor-or-ref))

(s/def ::definitive-kinds-of-possessors
  ::kinds-of-possessors)

(s/def ::possible-kinds-of-possessors
  ::kinds-of-possessors)

(s/def ::required-kinds-of-possessors
  ::kinds-of-possessors)

(s/def ::kind-of-aspect
  (s/merge
    :rlc.clarity.handlers.base/kind-of-entity
    (s/keys :opt-un [::required-kind-of-role-1
                     ::required-kind-of-role-2]))
    ;; ::definitive-kinds-of-possessors
    ;; ::possible-kinds-of-possessors
    ;; ::required-kinds-of-possessors
    )

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; INDIVIDUAL ;;

(s/def ::quantitative-value (s/or :int int?
                                  :float float?
                                  :ratio (s/and float? #(<= 0 % 1))))

(s/def ::possessor
  (s/or :uid :rlc.clarity.handlers.base/uid
        :physical-object #(do (require '[rlc.clarity.handlers.physical-object])
                                  (s/valid? :rlc.clarity.handlers.physical-object/individual-physical-object %))
        :occurrence #(do (require '[rlc.clarity.handlers.occurrence :as o])
                             (s/valid? :rlc.clarity.handlers.occurrence/individual-occurrence %))))

(s/def ::individual-aspect
  (s/and :rlc.clarity.handlers.base/individual-entity
         (s/keys :req-un [::aspect-nature
                          ::possessor])
         #(case (:aspect-nature %)
            :qualitative (s/valid? (s/keys :req-un [::qualitative-value]) %)
            :quantitative (s/valid? (s/keys :req-un [::quantitative-value ::uom-value]) %)
            false)))


;; (s/def ::point-in-time
;;   (s/or
;;    :uid :rlc.clarity.handlers.base/uid
;;    :entity (s/and ::aspect
;;               #(= (:aspect-nature %) :quantitative)
;;               #(inst? (:value %))
;;               #(contains? #{:iso8601 :unix-epoch :julian-date} (:uom %)))))

;; (defn update-point-in-time
;;   "Updates both the name and value of a temporal point aspect"
;;   [time-point new-time]
;;   (-> time-point
;;       (assoc :name (str "Time at " new-time))
;;       (assoc :value new-time)))

;; (s/def ::begin-time ::point-in-time)

;; (s/def ::end-time ::point-in-time)

;; (s/def ::period-in-time
;;   (s/merge :rlc.clarity.handlers.base/entity
;;            (s/keys :req-un [::begin-time
;;                             ::end-time])))

;; (defn update-period-in-time
;;   "Updates both begin and end times of a time period"
;;   [period start end]
;;   (-> period
;;       (update-in [:begin-time] update-point-in-time start)
;;       (update-in [:end-time] update-point-in-time end)))

(comment

  (def some-kind-of-aspect
    {:uid 1
     :name "some kind of aspect"
     :nature :kind
     :definitions ["some definition"]
     :supertypes [1]
     ;; :definitive-kinds-of-possessors [{:uid 1
     ;;                                   :name "some kind of physical object"
     ;;                                   :nature :kind
     ;;                                   :definitions ["some definition"]
     ;;                                   :supertypes [1]}
     ;;                                  {:uid 2
     ;;                                   :name "some kind of occurrence"
     ;;                                   :nature :individual
     ;;                                   :classifiers [1 2 3]}]
     ;; :possible-kinds-of-possessors [{:uid 1
     ;;                                 :name "some kind of physical object"
     ;;                                 :nature :kind
     ;;                                 :definitions ["some definition"]
     ;;                                 :supertypes [1]}
     ;;                                {:uid 2
     ;;                                 :name "some kind of occurrence"
     ;;                                 :nature :individual
     ;;                                 :classifiers [1 2 3]}]
     ;; :required-kinds-of-possessors [{:uid 1
     ;;                                 :name "some kind of physical object"
     ;;                                 :nature :kind
     ;;                                 :definitions ["some definition"]
     ;;                                 :supertypes [1]}
     ;;                                {:uid 2
     ;;                                 :name "some kind of occurrence"
     ;;                                 :nature :individual
     ;;                                 :classifiers [1 2 3]}]
     })

  (expound/expound ::kind-of-aspect some-kind-of-aspect)

  (def some-individual-aspect
    {:uid 1
     :name "some individual aspect"
     :nature :individual
     :classifiers [1 2 3]
     :aspect-nature :qualitative
     :possessor 1
     :qualitative-value {:uid 1
                         :name "some qualitative value"
                         :nature :qualification
                         :qualified-entity 1}
     })

  ;; {:uid 1,
  ;;  :name "some individual aspect",
  ;;  :nature :individual,
  ;;  :classifiers [1 2 3],
  ;;  :aspect-nature
  ;;  :qualitative,
  ;;  :possessor [:uid 1]}

  (expound/expound ::individual-aspect some-individual-aspect)

  (def some-other-individual-aspect
    {:uid 1
     :name "some other individual aspect"
     :nature :individual
     :classifiers [1 2 3]
     :aspect-nature :qualitative
     :qualitative-value {:uid 1
                         :name "some qualitative value"
                         :nature :qualification
                         :qualified-entity 1}
     :possessor {:uid 1
                 :name "some individual physical object"
                 :nature :individual
                 :classifiers [1]}
     })

  (expound/expound ::individual-aspect some-other-individual-aspect)

)
