(ns rlc.clarity.io.archivist-api
  (:require
   [clojure.tools.logging :as log]
   [clojure.core.async :as async :refer [go <!]]
   [io.relica.common.io.archivist-client :as archivist]
   [rlc.clarity.io.client-instances :refer [archivist-client]]))


;; Direct access to Archivist API
(defn get-entity-type
  "Get entity type (kind/individual) for a UID"
  [uid]
  (go
    (try
      (let [response (<! (archivist/get-entity-type archivist-client uid))]
        (if (:success response)
          (:type response)
          (or (:error response) "Unknown error")))
      (catch Exception e
        (log/error e "Failed to get entity type")
        "Unknown"))))

(defn get-entity-category
  "Get entity category for a UID"
  [uid]
  (go
    (try
      (let [response (<! (archivist/get-entity-category archivist-client uid))]
        (if (:success response)
          (:category response)
          (or (:error response) "Unknown error")))
      (catch Exception e
        (log/error e "Failed to get entity category")
        "Unknown"))))

(defn get-definitive-facts
  "Get definitive facts for a UID"
  [uid]
  (go
    (try
      (let [response (<! (archivist/get-definitive-facts archivist-client uid))]
        (if (:success response)
          (:facts response)
          []))
      (catch Exception e
        (log/error e "Failed to get definitive facts")
        []))))

;; (defn get-all-related-facts
;;   "Get all related facts for a UID"
;;   [uid]
;;   (go
;;     (try
;;       (let [response (<! (archivist/get-all-related archivist-client uid))]
;;         (if (:success response)
;;           (:facts response)
;;           []))
;;       (catch Exception e
;;         (log/error e "Failed to get all related facts")
;;         []))))

(defn get-related-facts-by-relation
  "Get related facts by relation type"
  [uid rel-type-uid]
  (go
    (try
      (let [response (<! (archivist/get-related-on-uid-subtype-cone
                          archivist-client uid rel-type-uid))]
        (if (:success response)
          (:facts response)
          []))
      (catch Exception e
        (log/error e "Failed to get related facts by relation")
        []))))

(defn get-related-to
  "Get related facts by relation type"
  [uid rel-type-uid]
  (go
    (try
      (let [response (<! (archivist/get-related-to archivist-client uid rel-type-uid))]
        (if (:success response)
          (:facts response)
          []))
      (catch Exception e
        (log/error e "Failed to get related facts by relation")
        []))))

(defn get-core-sample
  "Get core sample for a UID"
  [uid rel-type-uid]
  (go
    (try
      (let [response (<! (archivist/get-core-sample
                          archivist-client uid rel-type-uid))]
        (log/info "get  core campe Response: " response)
        (if (:success response)
          (:results response)
          []))
      (catch Exception e
        (log/error e "Failed to get related facts by relation")
        []))))

(defn get-core-sample-rh
  "Get core sample for a UID"
  [uid rel-type-uid]
  (go
    (try
      (let [response (<! (archivist/get-core-sample-rh
                          archivist-client uid rel-type-uid))]
        (log/info "get  core campe Response RIEHGT HAND: " response)
        (if (:success response)
          (:facts response)
          []))
      (catch Exception e
        (log/error e "Failed to get related facts by relation")
        []))))
