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

(defn get-all-events [request]
  (tap> "GETTING ALL EVENTS, NIGGA' !!!!!!!")
  (let [token (get request :auth-token)
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

(defn get-event [request]
  (tap> "FETCHING EVENT")
  (let [uid (get-in request [:path-params :uid])
        token (get request :auth-token)
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
