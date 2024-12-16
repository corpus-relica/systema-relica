(ns rlc.clarity.handlers.occurrence
  (:require [clojure.spec.alpha :as s]
            [rlc.clarity.handlers.base :as base]
            [rlc.clarity.handlers.state :as state]
            [rlc.clarity.handlers.aspect :as aspect]))

(s/def ::occurrence-type #{:activity :process :event :deed})
(s/def ::state #{:new :in-progress :completed :terminated})
(s/def ::timestamp inst?)
(s/def ::place-of-begin ::base/kind-ref)
(s/def ::place-of-end ::base/kind-ref)

(s/def ::involvement-type
  (s/or :uid :rlc.clarity.handlers.base/uid
        :entity #(do (require '[rlc.clarity.handlers.relation])
                     (s/valid? :rlc.clarity.handlers.relation/relation-kind %))))

(s/def ::involved-individual
  (s/or :uid int?
        :entity :rlc.clarity.handlers.base/entity))

(s/def ::involvement-tuple
  (s/tuple ::involvement-type ::involved-individual))

(s/def ::involved
  (s/coll-of ::involvement-tuple :kind vector? :min-count 1))

(s/def :rlc.clarity.handlers.occurrence/occurrence-kind
  (s/merge
    :rlc.clarity.handlers.base/entity-kind))

(s/def :rlc.clarity.handlers.occurrence/happens-during ::aspect/period-in-time)

(s/def :rlc.clarity.handlers.occurrence/happens-within ::aspect/period-in-time)


(s/def :rlc.clarity.handlers.occurrence/occurrence
  (s/merge :rlc.clarity.handlers.state/state
           (s/keys :req-un [::occurrence-type]
                   :opt-un [::happens-during
                            ::happens-within
                            ::place-of-begin
                            ::place-of-end
                            ::involved])))

(comment
  (def occurrence-kind
    {:uid 1
     :name "some kind of occurrence"
     :nature :kind
     :definition "some definition"})

  (s/explain ::occurrence-kind occurrence-kind)

  (def individual-occurrence
    {:uid 1
     :name "some individual occurrence"
     :nature :individual
     :kind-ref 1
     :occurrence-type :activity
     :happens-during {:uid 12
                       :name "some period of time"
                       :nature :individual
                       :kind-ref 1000
                       :begin-time 730000
                       :end-time 730000}
     :involved [[12345 12]
                [{:uid 43892
                  :name "Test Relation Kind"
                  :nature :kind
                  :definition "some definition"
                  :required-role-1 12345
                  :required-role-2 89076
                  }
                 {:uid 1
                  :name "Test individual physical object"
                  :nature :individual
                  :kind-ref 1
                  :aspects [123 456]
                  :state :new}]]
     })

  ;; (s/explain ::involvements [[:participant 12]])

  (s/explain ::occurrence individual-occurrence)

  (def test-occurrence
   {:uid 1
                     :name "some occurrence"
                     :nature :individual
                     :kind-ref 1
                     :occurrence-type :activity
                     :happens-during {:uid 12
                                      :name "some period of time"
                                      :nature :individual
                                      :aspect-nature :quantitative
                                      :kind-ref 1000
                                      :begin-time 1234
                                      :end-time {:uid 8432
                                                 :name "some point in timne"
                                                 :nature :individual
                                                 :kind-ref 1243
                                                 :aspect-nature :quantitative
                                                 :possessor 43423
                                                 :value (java.util.Date.)
                                                 :uom :iso8601}}} )

  (s/explain ::occurrence test-occurrence)

  )


;; (defn foo
;;   "I don't do a whole lot ... yet."
;;   []
;;   (println "Hello, World! Bar!"))

;; (defn create-occurrence
;;   [occurrence]
;;   (println occurrence))

;; (defn get-occurrence
;;   [uid]
;;   (println id))

;; (defn destroy-occurrence
;;   [uid]
;;   (println uid))
