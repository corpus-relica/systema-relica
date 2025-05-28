(ns io.relica.prism.integration.cache-rebuild-flow-test
  (:require [midje.sweet :refer [fact facts contains anything => provided before after throws]]
            [clojure.core.async :refer [go <! >! <!! chan timeout]]
            [io.relica.common.test.midje-helpers :as helpers]
            [io.relica.common.websocket.server :as common-ws]
            [io.relica.prism.services.cache-rebuild :as cache-rebuild]
            [io.relica.prism.services.cache :as cache]
            [io.relica.prism.io.ws-server :as ws-server]
            [io.relica.common.services.cache-service :as common-cache]
            [io.relica.common.io.archivist-client :as archivist]))

;; Test data
(def test-facts
  [{:lh_object_uid "uid1" :rh_object_uid "uid2" :fact_uid "fact1"}
   {:lh_object_uid "uid2" :rh_object_uid "uid3" :fact_uid "fact2"}
   {:lh_object_uid "uid3" :rh_object_uid "uid4" :fact_uid "fact3"}])

(def test-lineage
  {"uid1" ["uid2" "uid3"]
   "uid2" ["uid3" "uid4"]
   "uid3" ["uid4"]})

;; Setup and teardown
(before :facts
        (do
          (common-cache/start "test-cache")
          (cache-rebuild/reset-rebuild-status!)))

(after :facts
       (do
         (common-cache/clear-entity-facts-cache-complete @common-cache/cache-service-comp)
         (common-cache/clear-entity-lineage-cache-complete @common-cache/cache-service-comp)
         (common-cache/clear-descendants @common-cache/cache-service-comp)))

(facts "About WebSocket-based cache rebuild flow"
       (fact "completes full rebuild cycle successfully"
             ;; Capture WebSocket messages
             (let [broadcast-messages (atom [])
                   reply-capture (helpers/capture-reply)
                   rebuild-msg (helpers/mock-ws-message :prism.cache/rebuild {} reply-capture)]

               ;; Mock dependencies
               (provided
                ;; Mock WebSocket broadcasts
                (ws-server/broadcast! anything) => (swap! broadcast-messages conj anything)

                ;; Mock Archivist responses
                (archivist/get-batch-facts anything anything) => (go {:facts test-facts})
                (archivist/get-facts-count anything) => (go (count test-facts))

                ;; Mock lineage requests
                (cache/request-lineage anything) => (go {:success true
                                                         :data (get test-lineage anything [])}))

               ;; Send rebuild request via WebSocket
               (common-ws/handle-ws-message rebuild-msg)

               ;; Wait for and verify initial response
               (let [initial-response (helpers/wait-for reply-capture)]
                 initial-response => (contains {:success true}))

               ;; Verify broadcast messages for progress updates
               (let [messages @broadcast-messages]
                 ;; Check start message
                 (some #(= :rebuilding (get-in % [:data :status])) messages) => true

                 ;; Check progress messages
                 (some #(= 33 (get-in % [:data :progress])) messages) => true
                 (some #(= 66 (get-in % [:data :progress])) messages) => true

                 ;; Check completion message
                 (some #(and (= :complete (get-in % [:data :status]))
                             (= 100 (get-in % [:data :progress]))) messages) => true)

               ;; Verify cache contents
               (doseq [{:keys [lh_object_uid fact_uid]} test-facts]
                 (let [cached-facts (common-cache/get-entity-facts @common-cache/cache-service-comp lh_object_uid)]
                   (some #{fact_uid} cached-facts) => true))

               (doseq [[uid lineage] test-lineage]
                 (let [cached-lineage (common-cache/get-entity-lineage @common-cache/cache-service-comp uid)]
                   (set cached-lineage) => (set lineage)))))

       (fact "handles rebuild errors gracefully"
             (let [broadcast-messages (atom [])
                   reply-capture (helpers/capture-reply)
                   rebuild-msg (helpers/mock-ws-message :prism.cache/rebuild {} reply-capture)]

               (provided
                (ws-server/broadcast! anything) => (swap! broadcast-messages conj anything)
                (archivist/get-batch-facts anything anything) => (throws (Exception. "Failed to fetch facts")))

               ;; Send rebuild request via WebSocket
               (common-ws/handle-ws-message rebuild-msg)

               ;; Verify error response
               (let [error-response (helpers/wait-for reply-capture)]
                 error-response => (contains {:success false
                                              :message "Cache rebuild failed"}))

               ;; Verify error broadcast
               (let [messages @broadcast-messages]
                 (some #(= :error (get-in % [:data :status])) messages) => true)))

       (fact "prevents concurrent rebuilds"
             (let [reply-capture1 (helpers/capture-reply)
                   reply-capture2 (helpers/capture-reply)
                   rebuild-msg1 (helpers/mock-ws-message :prism.cache/rebuild {} reply-capture1)
                   rebuild-msg2 (helpers/mock-ws-message :prism.cache/rebuild {} reply-capture2)]

               ;; Send first rebuild request
               (common-ws/handle-ws-message rebuild-msg1)

               ;; Immediately send second rebuild request
               (common-ws/handle-ws-message rebuild-msg2)

               ;; Second request should fail
               (let [second-response (helpers/wait-for reply-capture2)]
                 second-response => (contains {:success false
                                               :message #"Cache rebuild already in progress"})))))