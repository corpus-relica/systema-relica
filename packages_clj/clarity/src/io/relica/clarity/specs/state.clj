(ns io.relica.clarity.specs.state
  (:require [clojure.spec.alpha :as s]
            [io.relica.clarity.specs.base :as base]
            [io.relica.clarity.specs.aspect :as aspect]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; SPEC ;;

;;;;;;;;;;;;;;;;;;;;;;;;; KIND ;;

(s/def ::kind-of-state
  :io.relica.clarity.specs.base/kind-of-entity)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; INDIVIDUAL ;;

(s/def ::individual-state
  (s/merge :io.relica.clarity.specs.base/individual-entity
           (s/keys :opt-un [
                            ;; ::involved
                            ;; ::aspects

                            ;; ::cause-of-begin
                            ;; ::cause-of-end
                            ;; ::begin-time
                            ;; ::end-time
                            ;; ::duration
                            ;; ::adopter
                            ;; ::prestate
                            ;; ::poststate
                            ;; ::is-the-case-at

                            ])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;o


;; (s/def ::cause
;;   (s/or :uid :io.relica.clarity.specs.base/uid
;;         :entity #(do (require '[io.relica.clarity.occurrence :as o])
;;                      (s/valid? :io.relica.clarity.specs.occurrence/occurrence %))))

;; (s/def ::cause-of-begin ::cause)

;; (s/def ::cause-of-end ::cause)

;; (s/def ::adopter
;;   (s/or :uid :io.relica.clarity.specs.base/uid
;;         :entity #(do (require '[io.relica.clarity.physical-object :as po])
;;                      (s/valid? :io.relica.clarity.specs.physical-object/physical-object %))))

;; (s/def ::begin-time ::aspect/point-in-time)

;; (s/def ::end-time ::aspect/point-in-time)

;; (s/def ::is-the-case-at ::aspect/point-in-time)


;; (s/def ::prestate
;;   (s/or :uid :io.relica.clarity.base/uid
;;         :entity ::state))

;; (s/def ::poststate
;;   (s/or :uid :io.relica.clarity.base/uid
;;         :entity ::state))

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
