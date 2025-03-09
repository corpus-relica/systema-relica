(ns rlc.clarity.services.physical-object-model-service
  (:require [clojure.tools.logging :as log]
            [clojure.pprint :refer [pprint]]
            [clojure.core.async :refer [go <!]]
            [rlc.clarity.services.entity-model-service :as e-ms]))

;; ------------------------------------------------------------------ HELPERS --

;; --------------------------------------------------------------------- KIND --

(defn retrieve-kind-of-physical-object-model
  "Retrieve and transform a physical object entity to its semantic model representation"
  [uid]
  (go
    (try
      (let [base-model (<! (e-ms/retrieve-kind-of-entity-model uid))
            ;; definitive-aspects (<! (po/get-definitive-aspects uid))
            ;; possible-aspects (<! (po/get-possible-aspects uid))
            ;; required-aspects (<! (po/get-required-aspects uid))
            ;; definitive-involvements (<! (po/get-definitive-involvements uid))
            ;; possible-involvements (<! (po/get-possible-involvements uid))
            ;; required-involvements (<! (po/get-required-involvements uid))
            ;; definitive-roles (<! (po/get-definitive-roles uid))
            ;; possible-roles (<! (po/get-possible-roles uid))
            ;; required-roles (<! (po/get-required-roles uid))
            ]
        (merge base-model
               {:category "physical object"}
               ;; {:definitive-kinds-of-aspects definitive-aspects
               ;;  :possible-kinds-of-aspects possible-aspects
               ;;  :required-kinds-of-aspects required-aspects
               ;;  :definitive-kinds-of-involvements definitive-involvements
               ;;  :possible-kinds-of-involvements possible-involvements
               ;;  :required-kinds-of-involvements required-involvements
               ;;  :definitive-kinds-of-roles definitive-roles
               ;;  :possible-kinds-of-roles possible-roles
               ;;  :required-kinds-of-roles required-roles}
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
            ;; aspects (<! (po/get-definitive-aspects uid))
            ;; involvements (<! (po/get-definitive-involvements uid))
            ]
        (merge base-model
               {:category "physical object"}
               ;; {:aspects aspects
               ;;  :involvements involvements
               ))
      (catch Exception e))))
