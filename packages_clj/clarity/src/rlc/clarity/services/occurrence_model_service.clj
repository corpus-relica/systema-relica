(ns rlc.clarity.services.occurrence-model-service
  (:require
   [clojure.tools.logging :as log]
   [clojure.pprint :refer [pprint]]
   [clojure.core.async :refer [go <!]]
   [clojure.spec.alpha :as s]
   [rlc.clarity.io.archivist-api :as archivist-api]
   [rlc.clarity.services.entity-model-service :as e-ms]
   [io.relica.common.io.archivist-client :as archivist]
   [rlc.clarity.io.client-instances :refer [archivist-client]]
   ))

;; ------------------------------------------------------------------ HELPERS --



;; --------------------------------------------------------------------- KIND --

(defn retrieve-kind-of-occurrence-model
  "Retrieve and transform an occurrence object to its semantic model representation"
  [uid]
  (go
    (try
      (let [base-model (<! (e-ms/retrieve-kind-of-entity-model uid))
            ]
        (merge base-model
               {:category "occurrence"
                ;; :definitive-kinds-of-aspects [1 2 3]
                ;; :possible-kinds-of-aspects [1 2 3]
                ;; :required-kinds-of-aspects [1 2 3]
                ;; :definitive-kinds-of-involvement [[1 2]]
                ;; :possible-kinds-of-involvement [[1 2]]
                ;; :required-kinds-of-involvement [[1 2]]
                }))
      (catch Exception e))))


;; --------------------------------------------------------------- IDNIVIDUAL --
