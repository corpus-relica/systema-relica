(ns io.relica.clarity.services.aspect-model-service
  (:require
   [clojure.tools.logging :as log]
   [clojure.pprint :refer [pprint]]
   [clojure.core.async :refer [go <!]]
   [clojure.spec.alpha :as s]
   [io.relica.clarity.io.archivist-api :as archivist-api]
   [io.relica.clarity.services.entity-model-service :as e-ms]
   [io.relica.common.io.archivist-client :as archivist]
   [io.relica.clarity.io.client-instances :refer [archivist-client]]
   ))

;; ------------------------------------------------------------------ HELPERS --



;; --------------------------------------------------------------------- KIND --

(defn retrieve-kind-of-aspect-model
  "Retrieve and transform an aspect object to its semantic model representation"
  [uid]
  (go
    (try
      (let [base-model (<! (e-ms/retrieve-kind-of-entity-model uid))
            ]
        (merge base-model
               {:category "aspect"
                ;; :aspects (<! (archivist-api/get-aspects uid))
                }))
      (catch Exception e))))


;; --------------------------------------------------------------- IDNIVIDUAL --


(defn retrieve-individual-aspect-model
  "Retrieve and transform a physical object entity to its semantic model representation"
  [uid]
  (go
    (log/info "Retrieving individual aspect model" uid)
    (try
      (let [base-model (<! (e-ms/retrieve-individual-entity-model uid))
            ]
        (merge base-model
               {:category "aspect"}
               ))
      (catch Exception e))))
