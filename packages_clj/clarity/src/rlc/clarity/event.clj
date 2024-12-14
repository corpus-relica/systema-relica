(ns rlc.clarity.event
  (:require [clojure.spec.alpha :as s]
            [rlc.clarity.occurrence :as occurrence]
            [rlc.clarity.state :as state]
            [rlc.clarity.base :as base]))

;; Event-specific specs
(s/def ::event
  (s/and :rlc.clarity.occurrence/occurrence
         (s/keys :req-un [:rlc.clarity.state/is-the-case-at])
         #(= (:occurrence-type %) :event)))

(comment

  ;; Example usage/testing
  (def test-event
    {:uid 1
     :name "System Status Change"
     :nature :individual
     :kind-ref 1
     :occurrence-type :event
     :is-the-case-at {:uid 123
                      :name "event timestamp"
                      :nature :individual
                      :kind-ref 456
                      :aspect-nature :quantitative
                      :possessor 789
                      :value #inst "2024-01-01T00:00:00Z"
                      :uom :iso8601}})

  (s/explain ::event test-event)

  )
