(ns rlc.clarity.handlers.event
  (:require [clojure.spec.alpha :as s]
            [cheshire.core :as json]
            [rlc.clarity.handlers.occurrence :as occurrence]
            [rlc.clarity.handlers.state :as state]
            [rlc.clarity.handlers.base :as base]
            [rlc.clarity.archivist-client :as archivist]
            [ring.util.response :as response]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; MODEL

;; Event-specific specs
(s/def ::event
  (s/and :rlc.clarity.occurrence/occurrence
         (s/keys :req-un [:rlc.clarity.state/is-the-case-at])
         #(= (:occurrence-type %) :event)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; DATA RETRIEVAL

(defn get-all [request]
  (tap> "GETTING ALL EVENTS, FOO' !!!!!!!")
  (let [token (clojure.core/get request :auth-token)
        response (archivist/get-classified-facts
                  {:uid "1000000395"
                   :recursive false}
                  token)
        _ (tap> "MUTHERFUCKING RESPONSE!! SUCKAH!")
        _ (tap> response)
        ;; is response a vector?
        bar (if (string? response) (json/parse-string response true) nil)
        status (if bar (:statusCode bar) nil)
        ]
    (tap> "GOT EVENTS ------->")
    (tap> response)
    (tap> bar)
    (cond
      (:error response) (response/status 500 {:error "Failed to fetch events data"})
      (= status 401) (response/status 401 {:error "Unauthorized"})
      :else (let [events (map (fn [event]
                         {:uid (:lh_object_uid event)
                          :title (:lh_object_name event)
                          :event-type :event})
                       response)]
        (response/response events)))
    ))

(defn get [request]
  (tap> "FETCHING EVENT")
  (let [uid (get-in request [:path-params :uid])
        token (clojure.core/get request :auth-token)
        _ (tap> uid)
        _ (tap> token)
        response (archivist/get-classification-fact uid token)]
    (if (:error response)
      (response/status 500 {:error "Failed to fetch event data"})
      (let [body (first response)
            event {:uid (:lh_object_uid body)
                   :title (:lh_object_name body)
                   :event-type :event
                   :time nil
                   :participants nil}]
        (tap> "GOT EVENT ------->")
        (tap> event)
        (response/response event)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;


(defn get-time-value [request]
  (let [uid (get-in request [:path-params :uid])
        token (clojure.core/get request :auth-token)
        result (archivist/execute-query
                (str uid " > 1785 > ?1.what\n?1.what > 5025 > ?2.value")
                (fn [facts]
                  (let [time (:rh_object_name (second facts))]
                    (tap> "TIME ------->")
                    (tap> facts)
                    (tap> time)
                    time))
                token)]
    (tap> "TIME VALUE RESULT ------->")
    (tap> result)
    result))

(defn get-time [request]
  (let [uid (get-in request [:path-params :uid])
        token (clojure.core/get request :auth-token)]
    (archivist/execute-query
     (str uid " > 1785 > ?1.what\n?1.what > 5025 > ?2.value")
     (fn [facts]
       (tap> "TIME FACTS ------->")
       (tap> facts)
       (if (empty? facts)
         nil
         (first facts)))
     token)))

(defn get-participants [request]
  (let [uid (get-in request [:path-params :uid])
        token (clojure.core/get request :auth-token)]
    (archivist/execute-query
     (str uid " > 5644 > ?10.who")
     (fn [facts]
       (map :rh_object_uid facts))
     token)))

;; (defn get-event-note-value [token uid]
;;   (tap> "GETTING EVENT NOTE")
;;   (tap> (str uid " > 1727 > ?10.who\n?10.who > 1225 > 1000000035"))
;;   (query-service
;;    token
;;    (str uid " > 1727 > ?10.who\n?10.who > 1225 > 1000000035")
;;    (fn [facts]
;;      (tap> "NOTE FACTS")
;;      (tap> facts)
;;      (if (empty? facts)
;;        nil
;;        (:full_definition (second facts))))))

;; (defn get-event-note [token uid]
;;   (tap> "GETTING EVENT NOTE")
;;   (tap> (str uid " > 1727 > ?10.who\n?10.who > 1225 > 1000000035"))
;;   (query-service
;;    token
;;    (str uid " > 1727 > ?10.who\n?10.who > 1225 > 1000000035")
;;    (fn [facts]
;;      (tap> "NOTE FACTS, FOR REAL")
;;      (tap> facts)
;;      facts)))

;; (defn get-participation-fact [lh-object-uid rh-object-uid token]
;;   (archivist/execute-query
;;    (str lh-object-uid " > 5644 > " rh-object-uid)
;;    (fn [facts]
;;      (tap> "PARTICIPATION FACT")
;;      (tap> facts)
;;      (first facts))
;;    token))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;; SCRATCH

(comment

  ;; Example usage/testing
  (def test-event
    {:uid 1
     :name "System Status Change"
     :nature :individual
     :kind-ref 1
     :occurrence-type :event
     :is-the-case-at {:uid 123
                      :name "event timestamp"
                      :nature :individual
                      :kind-ref 456
                      :aspect-nature :quantitative
                      :possessor 789
                      :value #inst "2024-01-01T00:00:00Z"
                      :uom :iso8601}})

  (s/explain ::event test-event)

  )
