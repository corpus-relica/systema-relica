(ns rlc.clarity.handlers.relation
  (:require [clojure.spec.alpha :as s]
            [expound.alpha :as expound]
            [rlc.clarity.handlers.base :as base]))

;; (s/def ::required-role
;;   (s/or :uid :rlc.clarity.handlers.base/uid
;;         :entity #(do (require '[rlc.clarity.handlers.role])
;;                      (s/valid? :rlc.clarity.handlers.role/role-kind %))))

;; (s/def ::required-role-1 ::required-role)
;; (s/def ::required-role-2 ::required-role)

;; (s/def ::role-player
;;   (s/or :uid :rlc.clarity.handlers.base/uid
;;         :entity #(do (require '[rlc.clarity.handlers.role])
;;                      (s/valid? :rlc.clarity.handlers.role/role-player %))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; SPEC ;;

;;;;;;;;;;;;;;;;;;;;;;;;; KIND ;;

(s/def ::required-kind-of-role
  (s/or :uid :rlc.clarity.handlers.base/uid
        :entity #(do (require '[rlc.clarity.handlers.role])
                     (s/valid? :rlc.clarity.handlers.role/kind-of-role %))))

(s/def ::required-kind-of-role-1 ::required-kind-of-role)
(s/def ::required-kind-of-role-2 ::required-kind-of-role)

(s/def ::kind-of-relation
  (s/merge :rlc.clarity.handlers.base/kind-of-entity
           (s/keys :req-un [::required-kind-of-role-1
                            ::required-kind-of-role-2])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; INDIVIDUAL ;;

(s/def ::object
  (s/or :uid :rlc.clarity.handlers.base/uid
        :entity :rlc.clarity.handlers.base/individual-entity))

(s/def ::lh-object ::object)
(s/def ::rh-object ::object)

(s/def ::individual-relation
  (s/and :rlc.clarity.handlers.base/individual-entity
         (s/keys :req-un [::lh-object
                          ::rh-object])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; TEST ;;

(comment

  (def some-kind-of-relation
    {:uid 1
     :name "some kind of relation"
     :nature :kind
     :definitions ["some definition"]
     :supertypes [1]
     :required-kind-of-role-1 {:uid 1
                       :name "some kind of role"
                       :nature :kind
                       :definitions ["some definition"]
                       :supertypes [1]
                       :requiring-kinds-of-relations [{:uid 1
                                                       :name "some other kind of relation"
                                                       :nature :kind
                                                       :definitions ["some definition"]
                                                       :supertypes [1]
                                                       :required-kind-of-role-1 9876
                                                       :required-kind-of-role-2 12345}
                                                      12345]
                        :possible-kinds-of-role-players [67890]}
     :required-kind-of-role-2 12345})

  (expound/expound ::kind-of-relation some-kind-of-relation)

  (def some-individual-relation
    {:uid 2
     :name "some individual relation"
     :nature :individual
     :classifiers [1 2 3]
     :lh-object {:uid 1
                 :name "some individual object"
                 :nature :individual
                 :classifiers [1 2 3]}
     :rh-object {:uid 2
                 :name "some other indivudual object"
                 :nature :individual
                 :classifiers [1 2 3]}})

  (expound/expound ::individual-relation some-individual-relation)

  )
