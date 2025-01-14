(ns rlc.clarity.handlers.role
  (:require [clojure.spec.alpha :as s]
            [rlc.clarity.handlers.base :as base]))

(s/def ::requiring-relation
  (s/or :uid :rlc.clarity.handlers.base/uid
        :entity #(do (require '[rlc.clarity.handlers.relation])
                     (s/valid? :rlc.clarity.handlers.relation/relation-kind %))))

(s/def :rlc.clarity.handlers.role/requiring-relations
  (s/coll-of ::requiring-relation :kind vector? :min-count 1))

(s/def ::role-player
  (s/or :uid :rlc.clarity.handlers.base/uid
        :entity :rlc.clarity.handlers.base/entity-kind))

(s/def :rlc.clarity.handlers.role/role-players
  (s/coll-of ::role-player :kind vector? :min-count 1))

(s/def :rlc.clarity.handlers.role/role-kind
  (s/merge :rlc.clarity.handlers.base/entity-kind
           (s/keys :req-un [::requiring-relations
                            ::role-players])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(comment

  (def some-role-kind
    {:uid 1
     :name "some kind of role"
     :nature :kind
     :definition "some definition"
     :requiring-relations [{:uid 1
                            :name "some relation"
                            :nature :kind
                            :definition "some definition"
                            :required-role-1 9876
                            :required-role-2 12345}
                           12345]
     :role-players [67890]})

  (s/explain :rlc.clarity.handlers.role/role-kind some-role-kind))
