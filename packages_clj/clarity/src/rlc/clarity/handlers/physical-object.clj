(ns rlc.clarity.handlers.physical-object
  (:require [clojure.spec.alpha :as s]
            [rlc.clarity.base :as base]))

(s/def :rlc.clarity.physical-object/physical-object-kind
  (s/merge
   :rlc.clarity.base/entity-kind))

(s/def :rlc.clarity.physical-object/aspects
  (s/coll-of (s/or :uid :rlc.clarity.base/uid
                   :entity #(do (require '[rlc.clarity.aspect])
                               (s/valid? :rlc.clarity.aspect/aspect %)))))

(def physical-object-delayed
  (delay
    (s/spec :rlc.clarity.physical-object/physical-object)))

(s/def :rlc.clarity.physical-object/parts
  (s/coll-of (s/or :uid :rlc.clarity.base/uid
                   :entity (fn [x] (s/valid? @physical-object-delayed x)))))

(s/def :rlc.clarity.physical-object/totalities
  (s/coll-of (s/or :uid :rlc.clarity.base/uid
                   :entity (fn [x] (s/valid? @physical-object-delayed x)))))

(s/def :rlc.clarity.physical-object/adopted-state
  (s/or :uid :rlc.clarity.base/uid
        :entity #(do (require '[rlc.clarity.state])
                     (s/valid? :rlc.clarity.state/state %))))

(s/def :rlc.clarity.physical-object/physical-object
  (s/and :rlc.clarity.base/entity
         (s/keys :opt-un [::aspects
                         ::parts
                         ::totalities
                         ::adopted-state])))


(comment
  (def some-phys-obj
    {:uid 1
     :name "Assembly"
     :nature :individual
     :kind-ref 100
     :parts [2        ;; just the uid
             {:uid 3             ;; full physical object
              :name "Sub-part"
              :nature :individual
              :kind-ref 101}]})

  (s/explain ::physical-object some-phys-obj)

  (def some-phys-obj-with-state
    {:uid 456
     :name "Assembly"
     :nature :individual
     :kind-ref 6789
     :adopted-state {:uid 1
                     :name "some state"
                     :nature :individual
                     :kind-ref 1
                     :cause-of-begin {:uid 1
                                     :name "some occurrence"
                                     :nature :individual
                                     :kind-ref 1
                                     :occurrence-type :activity
                                     :happens-during {:uid 12
                                                      :name "some period of time"
                                                      :nature :individual
                                                      :kind-ref 1000
                                                      :begin-time 1234
                                                      :end-time 5678}}
                     :cause-of-end 54678
                     :begin-time 1234
                     :end-time 789
                     :duration 1000}})

  (s/explain ::physical-object some-phys-obj-with-state)

)
