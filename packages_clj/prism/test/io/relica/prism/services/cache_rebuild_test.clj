(ns io.relica.prism.services.cache-rebuild-test
  (:require [midje.sweet :refer [fact facts contains anything => provided]]
            [clojure.core.async :refer [go <! >! <!! chan timeout]]
            [io.relica.common.test.midje-helpers :as helpers]
            [io.relica.prism.services.cache-rebuild :as cache-rebuild]
            [io.relica.prism.services.cache :as cache]
            [io.relica.prism.io.ws-server :as ws-server]))

(facts "About get-rebuild-status"
       (fact "returns current status"
             (let [initial-status (cache-rebuild/get-rebuild-status)]
               (:status initial-status) => :idle
               (:progress initial-status) => 0
               (:message initial-status) => nil
               (:error initial-status) => nil)))

(facts "About reset-rebuild-status"
       (fact "resets to idle state"
             (cache-rebuild/reset-rebuild-status!) => anything
             (provided
              (ws-server/broadcast! anything) => nil)

             (let [status (cache-rebuild/get-rebuild-status)]
               (:status status) => :idle
               (:progress status) => 0
               (:message status) => nil
               (:error status) => nil)))

(facts "About rebuild-all-caches"
       (fact "returns error when already rebuilding"
             (let [result-chan (cache-rebuild/rebuild-all-caches!)]
               (provided
                (cache-rebuild/get-rebuild-status) => {:status :rebuilding}
                (ws-server/broadcast! anything) => nil)

               (<!! result-chan) => false))

       (fact "completes successfully when all caches build"
             (let [result-chan (cache-rebuild/rebuild-all-caches!)]
               (provided
                (ws-server/broadcast! anything) => nil
                (cache/build-entity-facts-cache!) => (go true)
                (cache/build-entity-lineage-cache!) => (go true)
                (cache/build-subtypes-cache!) => (go true))

               (<!! result-chan) => true

               (let [final-status (cache-rebuild/get-rebuild-status)]
                 (:status final-status) => :complete
                 (:progress final-status) => 100
                 (:message final-status) => "Cache rebuild completed successfully")))

       (fact "handles entity facts cache failure"
             (let [result-chan (cache-rebuild/rebuild-all-caches!)]
               (provided
                (ws-server/broadcast! anything) => nil
                (cache/build-entity-facts-cache!) => (go false))

               (<!! result-chan) => false

               (let [final-status (cache-rebuild/get-rebuild-status)]
                 (:status final-status) => :error
                 (:error final-status) => "Failed to build entity facts cache"
                 (:message final-status) => "Cache rebuild failed")))

       (fact "handles entity lineage cache failure"
             (let [result-chan (cache-rebuild/rebuild-all-caches!)]
               (provided
                (ws-server/broadcast! anything) => nil
                (cache/build-entity-facts-cache!) => (go true)
                (cache/build-entity-lineage-cache!) => (go false))

               (<!! result-chan) => false

               (let [final-status (cache-rebuild/get-rebuild-status)]
                 (:status final-status) => :error
                 (:error final-status) => "Failed to build entity lineage cache"
                 (:message final-status) => "Cache rebuild failed")))

       (fact "handles subtypes cache failure"
             (let [result-chan (cache-rebuild/rebuild-all-caches!)]
               (provided
                (ws-server/broadcast! anything) => nil
                (cache/build-entity-facts-cache!) => (go true)
                (cache/build-entity-lineage-cache!) => (go true)
                (cache/build-subtypes-cache!) => (go false))

               (<!! result-chan) => false

               (let [final-status (cache-rebuild/get-rebuild-status)]
                 (:status final-status) => :error
                 (:error final-status) => "Failed to build subtypes cache"
                 (:message final-status) => "Cache rebuild failed")))

       (fact "updates progress correctly"
             (let [progress-updates (atom [])]
               (provided
                (ws-server/broadcast! anything) => (swap! progress-updates conj (get-in anything [:data :progress]))
                (cache/build-entity-facts-cache!) => (go true)
                (cache/build-entity-lineage-cache!) => (go true)
                (cache/build-subtypes-cache!) => (go true))

               (<!! (cache-rebuild/rebuild-all-caches!)) => true

               (let [updates @progress-updates]
                 (some #{0} updates) => true    ; Initial progress
                 (some #{33} updates) => true   ; After facts cache
                 (some #{66} updates) => true   ; After lineage cache
                 (some #{100} updates) => true)))) ; After subtypes cache