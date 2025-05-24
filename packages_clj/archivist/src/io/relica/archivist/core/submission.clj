(ns io.relica.archivist.core.submission
  (:require [clojure.tools.logging :as log]
            [clojure.core.async :refer [<! go]]
            [io.relica.archivist.core.gellish-base :as gellish-base]
            [io.relica.archivist.services.graph-service :as graph]
            [io.relica.common.services.cache-service :as cache]
            [io.relica.archivist.services.uid-service :as uid]
            [io.relica.archivist.core.fact :as fact]))

;; Update Definition
(defn update-definition
  "Update the definition of a fact"
  [{:keys [fact_uid partial_definition full_definition]}]
  (try
    (let [result (gellish-base/update-fact-definition
                  fact_uid
                  partial_definition
                  full_definition)]
      {:success true
       :result result})
    (catch Exception e
      (log/error "Error in update-definition:" (ex-message e))
      {:success false
       :message (ex-message e)})))

;; Update Collection
(defn update-collection
  "Update the collection of a fact"
  [{:keys [fact_uid collection_uid collection_name]}]
  (try
    (let [result (gellish-base/update-fact-collection
                  fact_uid
                  collection_uid
                  collection_name)]
      {:success true
       :result result})
    (catch Exception e
      (log/error "Error in update-collection:" (ex-message e))
      {:success false
       :message (ex-message e)})))

;; Update Name
(defn update-name
  "Update the name of an entity in a fact"
  [{:keys [fact_uid name]}]
  (try
    (let [result (gellish-base/update-fact-name
                  fact_uid
                  name)]
      {:success true
       :result result})
    (catch Exception e
      (log/error "Error in update-name:" (ex-message e))
      {:success false
       :message (ex-message e)})))

;; Blanket Rename
(defn blanket-rename
  "Update entity name at every instance of entity_uid"
  [{:keys [entity_uid name]}]
  (try
    (let [result (gellish-base/blanket-update-fact-name
                  entity_uid
                  name)]
      {:success true
       :result result})
    (catch Exception e
      (log/error "Error in blanket-rename:" (ex-message e))
      {:success false
       :message (ex-message e)})))

;; Add Synonym
(defn add-synonym
  "Add a synonym to an entity"
  [{:keys [uid synonym]}]
  (try
    ;; Note: In the TypeScript implementation, this was commented out
    ;; and just returned the input parameters
    {:success true
     :uid uid
     :synonym synonym}
    (catch Exception e
      (log/error "Error in add-synonym:" (ex-message e))
      {:success false
       :message (ex-message e)})))

;; Create Date
(defn submit-date
  "Create a date entity and classify it as a date"
  [{:keys [date_uid collection_uid collection_name]}]
  (try
    (let [fact-data {:lh_object_uid date_uid
                     :lh_object_name (str date_uid)
                     :rel_type_uid 1225  ; "is classified as"
                     :rel_type_name "is classified as"
                     :rh_object_uid 550571  ; "date"
                     :rh_object_name "date"
                     :collection_uid collection_uid
                     :collection_name collection_name}
          result (fact/create-fact fact-data)]

      (if (:success result)
        {:success true
         :fact (:fact result)}
        {:success false
         :message (or (:message result) "Failed to create date")}))
    (catch Exception e
      (log/error "Error in submit-date:" (ex-message e))
      {:success false
       :message (ex-message e)})))