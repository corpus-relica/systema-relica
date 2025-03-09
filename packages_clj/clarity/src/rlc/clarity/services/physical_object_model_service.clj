(ns rlc.clarity.services.physical-object-model-service
  (:require [clojure.tools.logging :as log]
            [clojure.pprint :refer [pprint]]
            [clojure.core.async :refer [go <!]]
            [rlc.clarity.io.archivist-api :as archivist-api]
            [rlc.clarity.services.entity-model-service :as e-ms]))

(def aspect-uid 1727) ; "has as aspect"
(def involvement-uid 4648) ; "involvement in an occurrence"
(def is-part-of-uid 1190) ; "is part of"
(def connection-uid 1487) ; 'connection relation'

;;

;; ------------------------------------------------------------------ HELPERS --

;; (defn get-aspects
;;   "Retrieve aspects for a physical object entity"
;;   [uid]
;;   (go
;;     (try
;;       (let [aspects (<! (archivist-api/get-related-facts-by-relation uid aspect-uid))]
;;         aspects)
;;         (catch Exception e))))

;; --------------------------------------------------------------------- KIND --

(def qual-asp-rel-type-uid 2070) ; "by definition being a possessor of a qualitative aspect"
(def quant-asp-rel-type-uid 5848) ; "by definition being possessor of a qualitative intrinsic aspect"
(def intrn-asp-rel-type-uid 5738) ; "by definition being possessor of an intrinsic aspect"

(def can-have-role-rel-type-uid 4714) ; "by definition being able to have a role"

(defn retrieve-kind-of-physical-object-model
  "Retrieve and transform a physical object entity to its semantic model representation"
  [uid]
  (go
    (try
      (let [base-model (<! (e-ms/retrieve-kind-of-entity-model uid))
            definitive-qual-aspects (<! (archivist-api/get-core-sample
                                         uid qual-asp-rel-type-uid))
            definitive-quant-aspects (<! (archivist-api/get-core-sample
                                          uid quant-asp-rel-type-uid))
            definitive-intrn-aspects (<! (archivist-api/get-core-sample
                                          uid intrn-asp-rel-type-uid))
            ;; possible-aspects (<! (po/get-possible-aspects uid))
            ;; required-aspects (<! (po/get-required-aspects uid))
            ;; definitive-involvements (<! (po/get-definitive-involvements uid))
            ;; possible-involvements (<! (po/get-possible-involvements uid))
            ;; required-involvements (<! (po/get-required-involvements uid))
            ;; definitive-roles (<! (po/get-definitive-roles uid))
            possible-roles-result (<! (archivist-api/get-core-sample
                                       uid can-have-role-rel-type-uid))
            _ (log/info "Possible roles result:" possible-roles-result)
            possible-roles (map (fn [x]
                                  (map (fn [y]
                                         [(:rh_object_uid y)
                                          (:rh_object_name y)
                                          (:lh_object_uid y)
                                          (:lh_object_name y)]) x))
                                possible-roles-result)
            _ (log/info "Possible roles:" possible-roles)
            ;; required-roles (<! (po/get-required-roles uid))
            ]
        (merge base-model
               {:category "physical object"
               :definitive-kinds-of-qualitative-aspects definitive-qual-aspects
               :definitive-kinds-of-quantitative-aspects definitive-quant-aspects
               :definitive-kinds-of-intrinsic-aspects definitive-intrn-aspects
               ;;  :possible-kinds-of-aspects possible-aspects
               ;;  :required-kinds-of-aspects required-aspects
               ;;  :definitive-kinds-of-involvements definitive-involvements
               ;;  :possible-kinds-of-involvements possible-involvements
               ;;  :required-kinds-of-involvements required-involvements
               ;;  :definitive-kinds-of-roles definitive-roles
                :possible-kinds-of-roles possible-roles
               ;;  :required-kinds-of-roles required-roles}
               }
               ))
      (catch Exception e))))

;; --------------------------------------------------------------- IDNIVIDUAL --

(defn retrieve-individual-physical-object-model
  "Retrieve and transform a physical object entity to its semantic model representation"
  [uid]
  (go
    (log/info "Retrieving individual physical object model" uid)
    (try
      (let [base-model (<! (e-ms/retrieve-individual-entity-model uid))

            ;; aspects-result (<! (archivist-api/get-related-facts-by-relation uid aspect-uid))
            ;; aspects (map :rh_object_uid aspects-result)

            ;; involvements-result (<! (archivist-api/get-related-facts-by-relation uid involvement-uid))
            ;; involvements (map :rh_object_uid involvements-result)

            totalities-result (<! (archivist-api/get-related-facts-by-relation uid is-part-of-uid))
            totalities (map :rh_object_uid totalities-result)

            parts-result (<! (archivist-api/get-related-to-subtype-cone uid is-part-of-uid)) ;; TODO we actually want to do this on the subtype cone
            parts (map :lh_object_uid parts-result)

            connected-to-result (<! (archivist-api/get-related-to uid connection-uid)) ;; TODO we actually want to do this on the subtype cone
            connected-to (map :lh_object_uid connected-to-result)

            connections-in-result (<! (archivist-api/get-related-facts-by-relation uid connection-uid))
            connections-in (map :rh_object_uid connections-in-result)
            ]
        (log/info "Base model:" parts)
        (merge base-model
               {:category "physical object"
                ;; :aspects aspects
                ;; :involvements involvements
                :totalities totalities
                :parts parts
                :connected-to connected-to
                :connections-in connections-in
               ;;  :adopted-state
               }
               ))
      (catch Exception e))))
