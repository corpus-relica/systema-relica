(ns rlc.clarity.services.entity-model-service
  (:require [clojure.tools.logging :as log]
            [clojure.pprint :refer [pprint]]
            [clojure.core.async :refer [go <!]]
            [clojure.spec.alpha :as s]
            [rlc.clarity.io.archivist-api :as archivist-api]))

;; ------------------------------------------------------------------ HELPERS --

(defn retrieve-supertypes-and-definitions [uid]
  "Retrieve supertypes and definitions for a physical object entity"
  (go
    (try
      (let [definitive-facts (<! (archivist-api/get-definitive-facts uid))
            names (map :lh_object_name definitive-facts)
            supertypes (map :rh_object_uid definitive-facts)
            definitions (map :full_definition definitive-facts)]
        {:names names
         :supertypes supertypes
         :definitions definitions})
      (catch Exception e
        (log/error e "Failed to retrieve supertypes and definitions")
        {:valid false :error (str "Error: " (.getMessage e)) :uid uid}))))

(defn retrieve-classifiers [uid]
  "Retrieve classifiers for an individual entity"
  (go
    (try
      (let [classifiers (<! (archivist-api/get-definitive-facts uid))]
        (log/info "Classifiers: " classifiers)
        classifiers)
      (catch Exception e
        (log/error e "Failed to retrieve classifiers")
        {:valid false :error (str "Error: " (.getMessage e)) :uid uid}))))

;; --------------------------------------------------------------------- KIND --

(defn retrieve-kind-of-entity-model
  "Retrieve and transform an entity object to its semantic model representation"
  [uid]
  (go
    (try
      (let [{:keys [names supertypes definitions]} (<! (retrieve-supertypes-and-definitions uid))]
        (log/info "Supertypes:" (count supertypes))
        (log/info "Definitions:" (count definitions))
        (log/info "Names:" (count names) "First name:" (first names))
        {:uid uid
         :name (first names)
         :nature :kind
         :definitions definitions
         :supertypes supertypes})
      (catch Exception e
        (log/error e "Failed to retrieve entity object model")
        {:valid false :error (str "Error: " (.getMessage e)) :uid uid}))))

;; --------------------------------------------------------------- IDNIVIDUAL --

(defn retrieve-individual-entity-model
  "Retrieve and transform an entity object to its semantic model representation"
  [uid]
  (go
    (try
      (let [classifiers (<! (retrieve-classifiers uid))]
        (log/info "Classifiers:" (count classifiers))
        {:uid uid
         :name (:lh_object_name (first classifiers))
         :nature :individual
         :classifiers (map #(:rh_object_uid %) classifiers)})
      (catch Exception e
        (log/error e "Failed to retrieve entity individual model")
        {:valid false :error (str "Error: " (.getMessage e)) :uid uid}))))
