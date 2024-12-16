(ns rlc.clarity.handlers.aspect
  (:require [clojure.spec.alpha :as s]
            [rlc.clarity.handlers.base :as base]))

(s/def :rlc.clarity.handlers.aspect/aspect-nature #{:qualitative :quantitative})
(s/def :rlc.clarity.handlers.aspect/possessor
  (s/or :uid :rlc.clarity.base/uid
        :physical-object-obj #(do (require '[rlc.clarity.physical-object])
                             (s/valid? :rlc.clarity.handlers.physical-object/physical-object %))
        :occurrence-obj #(do (require '[rlc.clarity.occurrence :as o])
                             (s/valid? :rlc.clarity.handlesr.occurrence/occurrence %))))

;; (s/def :rlc.clarity.handlers.aspect/intrinsic boolean?)

(s/def :rlc.clarity.handlers.aspect/aspect-kind
  (s/merge
    :rlc.clarity.base/entity-kind
    ))

(s/def :rlc.clarity.handlers.aspect/aspect
  (s/and :rlc.clarity.base/entity
         (s/keys :req-un [::aspect-nature
                         ::possessor])
         #(case (:aspect-nature %)
            :qualitative (s/valid? (s/keys :req-un [::value]) %)
            :quantitative (s/valid? (s/keys :req-un [::value ::uom]) %)
            false)))

(s/def :rlc.clarity.handlers.aspect/point-in-time
  (s/or
   :uid :rlc.clarity.base/uid
   :entity (s/and :rlc.clarity.handlers.aspect/aspect
              #(= (:aspect-nature %) :quantitative)
              #(inst? (:value %))
              #(contains? #{:iso8601 :unix-epoch :julian-date} (:uom %)))))

(defn update-point-in-time
  "Updates both the name and value of a temporal point aspect"
  [time-point new-time]
  (-> time-point
      (assoc :name (str "Time at " new-time))
      (assoc :value new-time)))

(s/def :rlc.clarity.handlers.aspect/begin-time ::point-in-time)

(s/def :rlc.clarity.handlers.aspect/end-time ::point-in-time)

(s/def :rlc.clarity.handlers.aspect/period-in-time
  (s/merge :rlc.clarity.base/entity
           (s/keys :req-un [::begin-time
                            ::end-time])))

(defn update-period-in-time
  "Updates both begin and end times of a time period"
  [period start end]
  (-> period
      (update-in [:begin-time] update-point-in-time start)
      (update-in [:end-time] update-point-in-time end)))

(comment
  ;; Example usage:
  (def aspect-kind
    {:uid 1
     :name "some kind of aspect"
     :nature :kind
     :definition "some definition"})

  (def some-qual-aspect
    {:uid 2
     :name "some qualitative aspect"
     :nature :individual
     :kind-ref 1
     :aspect-nature :qualitative
     :possessor 12345
     :value "some value"})

  (def some-quant-aspect
    {:uid 2
     :name "some quantitative aspect"
     :nature :individual
     :kind-ref 1
     :aspect-nature :quantitative
     :possessor 12345
     :value "some value"
     :uom "some unit of measure"})

  (s/explain ::aspect-kind aspect-kind)      ;=> true

  (s/explain ::aspect some-qual-aspect)       ;=> true

  (s/explain ::aspect some-quant-aspect)       ;=> true

  (def some-point-in-time
    {:uid 1
     :name "some point in time"
     :nature :individual
     :kind-ref 1
     :aspect-nature :quantitative
     :possessor 12345
     :value (java.util.Date.)
     :uom :iso8601})

  (s/explain ::point-in-time some-point-in-time)       ;=> true

  (def some-period-in-time
    {:uid 1
     :name "some period in time"
     :nature :individual
     :kind-ref 1
     :begin-time {:uid 1
                  :name "some point in time"
                  :nature :individual
                  :kind-ref 1
                  :aspect-nature :quantitative
                  :possessor 12345
                  :value (java.util.Date.)
                  :uom :iso8601}
     :end-time {:uid 1
                :name "some point in time"
                :nature :individual
                :kind-ref 1
                :aspect-nature :quantitative
                :possessor 12345
                :value (java.util.Date.)
                :uom :iso8601}})

  (s/explain ::period-in-time some-period-in-time)       ;=> true

)
