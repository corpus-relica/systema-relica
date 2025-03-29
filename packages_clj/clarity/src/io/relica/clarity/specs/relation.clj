(ns io.relica.clarity.specs.relation
  (:require [clojure.spec.alpha :as s]
            [expound.alpha :as expound]
            [io.relica.clarity.specs.base :as base]))

;; (s/def ::required-role
;;   (s/or :uid :io.relica.clarity.specs.base/uid
;;         :entity #(do (require '[io.relica.clarity.specs.role])
;;                      (s/valid? :io.relica.clarity.specs.role/role-kind %))))

;; (s/def ::required-role-1 ::required-role)
;; (s/def ::required-role-2 ::required-role)

;; (s/def ::role-player
;;   (s/or :uid :io.relica.clarity.specs.base/uid
;;         :entity #(do (require '[io.relica.clarity.specs.role])
;;                      (s/valid? :io.relica.clarity.specs.role/role-player %))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; SPEC ;;

;;;;;;;;;;;;;;;;;;;;;;;;; KIND ;;

(s/def ::required-kind-of-role
  (s/or :uid :io.relica.clarity.specs.base/uid
        :entity #(do (require '[io.relica.clarity.specs.role])
                     (s/valid? :io.relica.clarity.specs.role/kind-of-role %))))

(s/def ::required-kind-of-role-1 ::required-kind-of-role)
(s/def ::required-kind-of-role-2 ::required-kind-of-role)

(s/def ::kind-of-relation
  (s/merge :io.relica.clarity.specs.base/kind-of-entity
           (s/keys :req-un [::required-kind-of-role-1
                            ::required-kind-of-role-2])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; INDIVIDUAL ;;

(s/def ::object
  (s/or :uid :io.relica.clarity.specs.base/uid
        :entity :io.relica.clarity.specs.base/individual-entity))

(s/def ::lh-object ::object)
(s/def ::rh-object ::object)

(s/def ::individual-relation
  (s/and :io.relica.clarity.specs.base/individual-entity
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
