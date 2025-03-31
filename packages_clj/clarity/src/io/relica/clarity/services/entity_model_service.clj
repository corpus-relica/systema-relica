(ns io.relica.clarity.services.entity-model-service
  (:require [clojure.tools.logging :as log]
            [clojure.pprint :refer [pprint]]
            [clojure.core.async :refer [go <!]]
            [clojure.spec.alpha :as s]
            [io.relica.clarity.io.archivist-api :as archivist-api]))

;; ------------------------------------------------------------------ HELPERS --

;; (defn retrieve-supertypes-and-definitions [uid]
;;   "Retrieve supertypes and definitions for a physical object entity"
;;   (go
;;     (try
;;       (let [definitive-facts (<! (archivist-api/get-definitive-facts uid))
;;             names (map :lh_object_name definitive-facts)
;;             supertypes (map :rh_object_uid definitive-facts)
;;             definitions (map :full_definition definitive-facts)]
;;         {:names names
;;          :supertypes supertypes
;;          :definitions definitions})
;;       (catch Exception e
;;         (log/error e "Failed to retrieve supertypes and definitions")
;;         {:valid false :error (str "Error: " (.getMessage e)) :uid uid}))))

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

(defn retrieve-stuff [uid]
  "Retrieve stuff for an individual or kind of entity"
  (go
    (try
      (let [stuff (<! (archivist-api/get-all-related-facts uid))
            classifications (filter #(= (:rel_type_uid %) 1225) stuff)
            specializations (filter #(= (:rel_type_uid %) 1146) stuff)
            qualifications (filter #(= (:rel_type_uid %) 1726) stuff)
            synonyms (vec
                      (reduce (fn [m f]
                                (conj m (:lh_object_name f)))
                                  #{}
                                  (filter #(= (:rel_type_uid %) 1981) stuff)
                                  ))]
        (log/info "Stuff: " stuff)
        {:classifications classifications
         :specializations specializations
         :qualifications qualifications
         :synonyms synonyms})
      (catch Exception e
        (log/error e "Failed to retrieve stuff")
        {:valid false :error (str "Error: " (.getMessage e)) :uid uid}))))

;; --------------------------------------------------------------------- KIND --

(defn retrieve-kind-of-entity-model
  "Retrieve and transform an entity object to its semantic model representation"
  [uid]
  (go
    (try
      (let [definitive-facts (<! (archivist-api/get-definitive-facts uid))
            names (map :lh_object_name definitive-facts)
            supertypes (map :rh_object_uid definitive-facts)
            definitions (map :full_definition definitive-facts)
            stuff (<! (archivist-api/get-all-related-facts uid))
            synonym-facts (filter #(= (:rel_type_uid %) 1981) stuff)
            synonym-names (map :lh_object_name synonym-facts)
            facts (vec (concat
                   definitive-facts
                   synonym-facts))]
        (log/info "Supertypes:" (count supertypes))
        (log/info "Definitions:" (count definitions))
        (log/info "Names:" (count names) "First name:" (first names))
        (log/info "Synonyms:" synonym-names)
        ;; {:uid uid
        ;;  :name (first names)
        ;;  :nature :kind
        ;;  :definitions definitions
        ;;  :supertypes supertypes
        ;;  :classifications (:classifications stuff)
        ;;  :specializations (:specializations stuff)
        ;;  :qualifications (:qualifications stuff)
        ;;  :synonyms (:synonyms stuff)}

        {:uid uid
         :name (first names)
         :nature :kind
         :definitions definitions
         :supertypes supertypes
         :synonyms synonym-names
         :facts facts})
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
         :classifiers (map #(:rh_object_uid %) classifiers)
         :facts classifiers})
      (catch Exception e
        (log/error e "Failed to retrieve entity individual model")
        {:valid false :error (str "Error: " (.getMessage e)) :uid uid}))))
