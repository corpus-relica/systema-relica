(ns rlc.clarity.handlers.relation
  (:require [clojure.spec.alpha :as s]
            [rlc.clarity.handlers.base :as base]))

(s/def ::required-role
  (s/or :uid :rlc.clarity.handlers.base/uid
        :entity #(do (require '[rlc.clarity.handlers.role])
                     (s/valid? :rlc.clarity.handlers.role/role-kind %))))

(s/def ::required-role-1 ::required-role)
(s/def ::required-role-2 ::required-role)

(s/def :rlc.clarity.handlers.relation/relation-kind
  (s/merge :rlc.clarity.handlers.base/entity-kind
           (s/keys :req-un [::required-role-1
                            ::required-role-2])))

(comment

  (def some-relation-kind
    {:uid 1
     :name "some kind of relation"
     :nature :kind
     :definition "some definition"
     :required-role-1 {:uid 1
                       :name "some role"
                       :nature :kind
                       :definition "some definition"
                       :requiring-relations [{:uid 1
                                              :name "some relation"
                                              :nature :kind
                                              :definition "some definition"
                                              :required-role-1 9876
                                              :required-role-2 12345}
                                             12345]
                       :role-players [67890]}
     :required-role-2 12345})

  (s/explain :rlc.clarity.handlers.relation/relation-kind some-relation-kind)

  )
