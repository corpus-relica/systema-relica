(ns rlc.clarity.state
  (:require [clojure.spec.alpha :as s]
            [rlc.clarity.base :as base]
            [rlc.clarity.aspect :as aspect]))

(s/def :rlc.clarity.state/state-kind
  (s/merge :rlc.clarity.base/entity-kind))

(s/def :rlc.clarity.state/cause
  (s/or :uid :rlc.clarity.base/uid
        :entity #(do (require '[rlc.clarity.occurrence :as o])
                     (s/valid? :rlc.clarity.occurrence/occurrence %))))

(s/def :rlc.clarity.state/cause-of-begin ::cause)

(s/def :rlc.clarity.state/cause-of-end ::cause)

(s/def :rlc.clarity.state/adopter
  (s/or :uid :rlc.clarity.base/uid
        :entity #(do (require '[rlc.clarity.physical-object :as po])
                     (s/valid? :rlc.clarity.physical-object/physical-object %))))

(s/def :rlc.clarity.state/begin-time ::aspect/point-in-time)

(s/def :rlc.clarity.state/end-time ::aspect/point-in-time)

(s/def :rlc.clarity.state/is-the-case-at ::aspect/point-in-time)

(s/def :rlc.clarity.state/state
  (s/merge :rlc.clarity.base/entity
           (s/keys :opt-un [::cause-of-begin
                            ::cause-of-end
                            ::begin-time
                            ::end-time
                            ::duration
                            ::adopter
                            ::prestate
                            ::poststate
                            ::is-the-case-at])))

(s/def :rlc.clarity.state/prestate
  (s/or :uid :rlc.clarity.base/uid
        :entity ::state))

(s/def :rlc.clarity.state/poststate
  (s/or :uid :rlc.clarity.base/uid
        :entity ::state))

(comment

  (def state-kind
    {:uid 1
     :name "some kind of state"
     :nature :kind
     :definition "some definition"})

  (s/explain ::state-kind state-kind)

  (def state-inst
    {:uid 1
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
                                      :begin-time 78893
                                      :end-time 730000}}
     :cause-of-end 54678
     :begin-time 730000
     :end-time 730000
     :duration 1000})

  (s/explain ::state state-inst)

  (def state-inst-with-adopter
    {:uid 1
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
                                      :begin-time 730000
                                      :end-time 730000}}
     :cause-of-end 54678
     :begin-time 730000
     :end-time 730000
     :duration 1000
     :adopter {:uid 1
               :name "some physical object"
               :nature :individual
               :kind-ref 1
               :parts [1
                       {:uid 1
                        :name "some part"
                        :nature :individual
                        :kind-ref 1}]}})

  (s/explain ::state state-inst-with-adopter)

  (def state-inst-with-prestate
    {:uid 1
      :name "some state"
      :nature :individual
      :kind-ref 1
     :prestate {:uid 1
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
                                                 :begin-time (java.util.Date.)
                                                 :end-time (java.util.Date.)}}
                :cause-of-end 54678
                :begin-time (java.util.Date.)
                :end-time (java.util.Date.)
                :duration 1000}
     :poststate 3456
     })

  (s/explain ::state state-inst-with-prestate)

  )
