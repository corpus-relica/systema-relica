(ns rlc.clarity.handlers.base
  (:require [clojure.spec.alpha :as s]))

;; Core specs
(s/def :rlc.clarity.handlers.base/uid int?)
(s/def :rlc.clarity.handlers.base/name string?)
(s/def :rlc.clarity.handlers.base/definition string?)
(s/def :rlc.clarity.handlers.base/nature #{:kind :individual})
(s/def :rlc.clarity.handlers.base/kind-ref :rlc.clarity.handlers.base/uid)

(s/def :rlc.clarity.handlers.base/entity-base
  (s/keys :req-un [:rlc.clarity.handlers.base/uid
                   :rlc.clarity.handlers.base/name
                   :rlc.clarity.handlers.base/nature]))

(s/def :rlc.clarity.handlers.base/entity-kind
  (s/and :rlc.clarity.handlers.base/entity-base
         (s/keys :req-un [:rlc.clarity.handlers.base/definition])
         #(= (:nature %) :kind)))

(s/def :rlc.clarity.handlers.base/involver-occurrence
  (s/or :uid :rlc.clarity.handlers.base/uid
        :entity #(do (require '[rlc.clarity.occurrence])
                     (s/valid? :rlc.clarity.handlers.occurrence/occurrence %))))

(s/def :rlc.clarity.handlers.base/involving-relation
  (s/or :uid :rlc.clarity.handlers.base/uid
        :entity #(do (require '[rlc.clarity.relation])
                     (s/valid? :rlc.clarity.handlers.relation/relation-kind %))))

(s/def :rlc.clarity.handlers.base/involvement-tuple
  (s/tuple :rlc.clarity.handlers.base/involving-relation
           :rlc.clarity.handlers.base/involver-occurrence))

(s/def :rlc.clarity.handlers.base/involvers
  (s/coll-of :rlc.clarity.handlers.base/involvement-tuple :kind vector? :min-count 1))

(s/def :rlc.clarity.handlers.base/entity
  (s/and :rlc.clarity.handlers.base/entity-base
         (s/keys :req-un [:rlc.clarity.handlers.base/kind-ref]
                 :opt-un [:rlc.clarity.handlers.base/involvers])
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

  (s/explain :rlc.clarity.handlers.base/entity some-entity)

  )
