(ns io.relica.common.websocket.format
  (:require [clojure.edn :as edn]
            [cheshire.core :as json]
            [taoensso.nippy :as nippy]
            [clojure.tools.logging :as log]))

;; Protocol for message format conversion
(defprotocol MessageFormat
  (serialize [this data])
  (deserialize [this string]))

;; EDN Format implementation (for Clojure clients)
(defrecord EDNFormat []
  MessageFormat
  (serialize [_ data]
    (try
      (pr-str data)
      (catch Exception e
        (log/error "Error serializing EDN:" (.getMessage e))
        (throw e))))

  (deserialize [_ string]
    (try
      (edn/read-string string)
      (catch Exception e
        (log/error "Error deserializing EDN:" (.getMessage e) "Raw:" string)
        (throw e)))))

;; JSON Format implementation (for non-Clojure clients)
(defrecord JSONFormat []
  MessageFormat
  (serialize [_ data]
    (try
      (json/generate-string data)
      (catch Exception e
        (log/error "Error serializing JSON:" (.getMessage e))
        (throw e))))

  (deserialize [_ string]
    (try
      (json/parse-string string true)
      (catch Exception e
        (log/error "Error deserializing JSON:" (.getMessage e) "Raw:" string)
        (throw e)))))

;; Nippy Format implementation (for Clojure-to-Clojure communication)
(defrecord NippyFormat []
  MessageFormat
  (serialize [_ data]
    (try
      (nippy/freeze-to-string data)
      (catch Exception e
        (log/error "Error serializing Nippy:" (.getMessage e))
        (throw e))))

  (deserialize [_ string]
    (try
      (nippy/thaw-from-string string)
      (catch Exception e
        (log/error "Error deserializing Nippy:" (.getMessage e) "Raw:" string)
        (throw e)))))

;; Singleton instances
(def edn-format (->EDNFormat))
(def json-format (->JSONFormat))
(def nippy-format (->NippyFormat))

;; Helper to determine format from client info
(defn format-for-client
  "Determine which format to use based on client information.
   Accepts a map with :format and :language keys.
   Returns an instance of MessageFormat."
  [client-info]
  (case (:format client-info)
    "json" json-format
    "edn" edn-format
    "nippy" nippy-format
    ;; Default to Nippy for Clojure clients, JSON for others
    (if (= (:language client-info) "clojure")
      nippy-format
      json-format)))

;; Helper functions
(defn serialize-message
  "Serialize a message using the appropriate format."
  [client-info message]
  (let [t (System/currentTimeMillis)
        format (format-for-client client-info)
        serialized (serialize format message)]
    ;; (println "SERIALIZE TIME(" (:format client-info) ")" (- (System/currentTimeMillis) t) "ms")
    serialized))

(defn deserialize-message
  "Deserialize a message using the appropriate format."
  [client-info message-str]
  (let [t (System/currentTimeMillis)
        format (format-for-client client-info)
        deserialized (deserialize format message-str)]
    ;; (println "DESERIALIZE TIME(" (:format client-info) ")" (- (System/currentTimeMillis) t) "ms")
    deserialized))
