(ns rlc.clarity.handlers.base
  (:require [clojure.spec.alpha :as s]))

;; Core specs
(s/def :rlc.clarity.base/uid int?)
(s/def :rlc.clarity.base/name string?)
(s/def :rlc.clarity.base/definition string?)
(s/def :rlc.clarity.base/nature #{:kind :individual})
(s/def :rlc.clarity.base/kind-ref :rlc.clarity.base/uid)

(s/def :rlc.clarity.base/entity-base
  (s/keys :req-un [:rlc.clarity.base/uid
                   :rlc.clarity.base/name
                   :rlc.clarity.base/nature]))

(s/def :rlc.clarity.base/entity-kind
  (s/and :rlc.clarity.base/entity-base
         (s/keys :req-un [:rlc.clarity.base/definition])
         #(= (:nature %) :kind)))

(s/def :rlc.clarity.base/involver-occurrence
  (s/or :uid :rlc.clarity.base/uid
        :entity #(do (require '[rlc.clarity.occurrence])
                     (s/valid? :rlc.clarity.occurrence/occurrence %))))

(s/def :rlc.clarity.base/involving-relation
  (s/or :uid :rlc.clarity.base/uid
        :entity #(do (require '[rlc.clarity.relation])
                     (s/valid? :rlc.clarity.relation/relation-kind %))))

(s/def :rlc.clarity.base/involvement-tuple
  (s/tuple :rlc.clarity.base/involving-relation
           :rlc.clarity.base/involver-occurrence))

(s/def :rlc.clarity.base/involvers
  (s/coll-of :rlc.clarity.base/involvement-tuple :kind vector? :min-count 1))

(s/def :rlc.clarity.base/entity
  (s/and :rlc.clarity.base/entity-base
         (s/keys :req-un [:rlc.clarity.base/kind-ref]
                 :opt-un [:rlc.clarity.base/involvers])
         #(= (:nature %) :individual)))

(comment

  (def some-entity
    {:uid 1
     :name "some entity"
     :nature :individual
     :kind-ref 1
     :involvers [[1 1]
                 [{:uid 1234
                   :name "some relation"
                   :nature :kind
                   :definition "some definition"
                   :required-role-1 9876
                   :required-role-2 12345}
                  {:uid 1
                   :name "some individual occurrence"
                   :nature :individual
                   :kind-ref 4567
                   :occurrence-type :activity
                   :happens-during {:uid 12
                                    :name "some period of time"
                                    :nature :individual
                                    :kind-ref 1000
                                    :begin-time 730000
                                    :end-time 730000}
                   :involvements [[1234 1]]}
                  ]]})

  (s/explain :rlc.clarity.base/entity some-entity)

  )
