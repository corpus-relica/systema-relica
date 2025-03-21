(ns rlc.clarity.handlers.physical-object
  (:require [clojure.spec.alpha :as s]
            [expound.alpha :as expound]
            ;; [rlc.clarity.io.archivist-api :as api]
            [rlc.clarity.handlers.base :as base]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; SPEC ;;

;;;;;;;;;;;;;;;;;;;;;;;;; KIND ;;


(s/def ::kinds-of-aspects
  (s/coll-of (s/or :uid :rlc.clarity.handlers.base/uid
                   :entity #(do (require '[rlc.clarity.handlers.aspect])
                               (s/valid? :rlc.clarity.handlers.aspect/kind-of-aspect %)))))

(s/def ::definitive-kinds-of-aspects
  ::kinds-of-aspects)

(s/def ::possible-kinds-of-aspects
  ::kinds-of-aspects)

(s/def ::required-kinds-of-aspects
  ::kinds-of-aspects)

(def physical-object-delayed
  (delay
    (s/spec ::physical-object)))

;; (s/def ::parts
;;   (s/coll-of (s/or :uid :rlc.clarity.handlers.base/uid
;;                    :entity (fn [x] (s/valid? @physical-object-delayed x)))))

;; (s/def ::totalities
;;   (s/coll-of (s/or :uid :rlc.clarity.handlers.base/uid
;;                    :entity (fn [x] (s/valid? @physical-object-delayed x)))))

;; (s/def ::adopted-state
;;   (s/or :uid :rlc.clarity.handlers.base/uid
;;         :entity #(do (require '[rlc.clarity.handlers.state])
;;                      (s/valid? :rlc.clarity.handlers.state/state %))))

;; (s/def ::physical-object-kind
;;   (s/merge
;;    :rlc.clarity.handlers.base/entity-kind))

(s/def ::kind-of-physical-object
  (s/and :rlc.clarity.handlers.base/kind-of-entity
         (s/keys :opt-un [
                          ::definitive-kinds-of-aspects
                          ::possible-kinds-of-aspects
                          ::required-kinds-of-aspects

                          ::definitive-kinds-of-involvements
                          ::possible-kinds-of-involvements
                          ::required-kinds-of-involvements

                          ::definitive-kinds-of-roles
                          ::possible-kinds-of-roles
                          ::required-kinds-of-roles

                          ;; ::definitive-parts
                          ;; ::possible-parts
                          ;; ::required-totalities

                          ;; ::definitive-totalities
                          ;; ::possible-totalities
                          ;; ::required-totalities

                          ;; ::definitive-adopted-states
                          ;; ::possible-adopted-states
                          ;; ::required-adopted-states

                          ])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; INDIVIDUAL ;;

(s/def ::aspects
  (s/coll-of (s/or :uid :rlc.clarity.handlers.base/uid
                   :entity #(do (require '[rlc.clarity.handlers.aspect])
                               (s/valid? :rlc.clarity.handlers.aspect/individual-aspect %)))))

;; TODO should maybe be a tuple of kind-of-relation and involved individual-occurrence
(s/def ::involvements
  (s/coll-of (s/or :uid :rlc.clarity.handlers.base/uid
                   :entity #(do (require '[rlc.clarity.handlers.involvement])
                               (s/valid? :rlc.clarity.handlers.involvement/individual-involvement %)))))

;; -(s/def :rlc.clarity.handlers.base/involver-occurrence
;; -  (s/or :uid :rlc.clarity.handlers.base/uid
;; -        :entity #(do (require '[rlc.clarity.occurrence])
;; -                     (s/valid? :rlc.clarity.handlers.occurrence/occurrence %))))
;; -
;; -(s/def :rlc.clarity.handlers.base/involving-relation
;; -  (s/or :uid :rlc.clarity.handlers.base/uid
;; -        :entity #(do (require '[rlc.clarity.relation])
;; -                     (s/valid? :rlc.clarity.handlers.relation/relation-kind %))))
;; -
;; -(s/def :rlc.clarity.handlers.base/involvement-tuple
;; -  (s/tuple :rlc.clarity.handlers.base/involving-relation
;; -           :rlc.clarity.handlers.base/involver-occurrence))
;; -
;; -(s/def :rlc.clarity.handlers.base/involvers
;; -  (s/coll-of :rlc.clarity.handlers.base/involvement-tuple :kind vector? :min-count 1))

;; TODO should maybe be a tuple of kind-of-role and kind-of-relation
(s/def ::roles
  (s/coll-of (s/or :uid :rlc.clarity.handlers.base/uid
                   :entity #(do (require '[rlc.clarity.handlers.role])
                               (s/valid? :rlc.clarity.handlers.role/kind-of-role %)))))

(s/def ::individual-physical-object
  (s/and :rlc.clarity.handlers.base/individual-entity
         (s/keys :opt-un [
                          ::aspects      ;; possessed-individual-aspects
                          ::involvements ;; involvements-in-individual-occurrences
                          ::roles        ;; kinds-of-roles-being-played

                          ;; ::individual-parts
                          ;; ::individual-totalities
                          ;; ::individual-adopted-state
                          ])))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; API ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; TEST ;;

(comment

  (def some-kind-of-phys-obj
    {:uid 1
     :name "some kind of physical object"
     :nature :kind
     :definitions ["some definition" "some other definition" "yet another definition"]
     :supertypes [1 2 3]
     :definitive-kinds-of-aspects [1 2 3]
     :possible-kinds-of-aspects [1 2 3]
     :required-kinds-of-aspects [1 2 3]
     :definitive-kinds-of-involvements [1 2 3]
     :possible-kinds-of-involvements [1 2 3]
     :required-kinds-of-involvements [1 2 3]
     :definitive-kinds-of-roles [1 2 3]
     :possible-kinds-of-roles [1 2 3]
     :required-kinds-of-roles [1 2 3]
     })

  (expound/expound ::kind-of-physical-object some-kind-of-phys-obj)

  (def some-individual-phys-obj
    {:uid 1
     :name "some individual physical object"
     :nature :individual
     :classifiers [1 2 3]
     :aspects [1 2 3]
     :involvements [1 2 3]
     :roles [1 2 3]
     })

  (expound/expound ::individual-physical-object some-individual-phys-obj)

)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; API ;;

;; (defn delete-object [request]
;;   (let [path-params (:path-params request)
;;         uid (Integer/parseInt (:uid path-params))
;;         token (clojure.core/get request :auth-token)
;;         classification-fact (first (api/get-classification-fact uid token))
;;         res (api/delete-fact! (:fact_uid classification-fact) token)]
;;     (tap> "DELETE OBJECT !!!!!!!!!!!!")
;;     (tap> token)
;;     (tap> classification-fact)
;;     (tap> res)
;;     (cond
;;       (nil? res) {:status 404
;;                   :body {:status :error
;;                          :message "Object not found"}}
;;       :else {:status 200
;;              :body {:status :success
;;                     :message "Object deleted"}})))
