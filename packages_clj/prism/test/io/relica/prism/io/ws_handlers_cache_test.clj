(ns io.relica.prism.io.ws-handlers-cache-test
  (:require [midje.sweet :refer [fact facts contains anything => provided throws]]
            [clojure.core.async :refer [go <! >! <!! chan timeout]]
            [io.relica.common.test.midje-helpers :as helpers]
            [io.relica.prism.io.ws-handlers]
            [io.relica.common.websocket.server :as common-ws]
            [io.relica.prism.services.cache-rebuild :as cache-rebuild]))

(facts "About cache rebuild WebSocket handler"
       (fact "initiates rebuild successfully"
             (let [reply-capture (helpers/capture-reply)
                   msg (helpers/mock-ws-message :prism.cache/rebuild {} reply-capture)]
               (provided
                (cache-rebuild/rebuild-all-caches!) => (go true))

               ;; Call the handler
               (common-ws/handle-ws-message msg)

               ;; Wait for and verify response
               (let [response (helpers/wait-for reply-capture)]
                 response => (contains {:success true
                                        :message "Cache rebuild completed successfully"}))))

       (fact "handles rebuild failure"
             (let [reply-capture (helpers/capture-reply)
                   msg (helpers/mock-ws-message :prism.cache/rebuild {} reply-capture)]
               (provided
                (cache-rebuild/rebuild-all-caches!) => (go false))

               ;; Call the handler
               (common-ws/handle-ws-message msg)

               ;; Wait for and verify response
               (let [response (helpers/wait-for reply-capture)]
                 response => (contains {:success false
                                        :message "Cache rebuild failed"}))))

       (fact "handles exceptions during rebuild"
             (let [reply-capture (helpers/capture-reply)
                   msg (helpers/mock-ws-message :prism.cache/rebuild {} reply-capture)]
               (provided
                (cache-rebuild/rebuild-all-caches!) => (throws Exception "Test error"))

               ;; Call the handler
               (common-ws/handle-ws-message msg)

               ;; Wait for and verify response
               (let [response (helpers/wait-for reply-capture)]
                 response => (contains {:success false
                                        :error "Test error"
                                        :message "Failed to start cache rebuild"})))))

(facts "About cache status WebSocket handler"
       (fact "returns current rebuild status"
             (let [reply-capture (helpers/capture-reply)
                   test-status {:status :rebuilding
                                :progress 50
                                :message "Building entity lineage cache"
                                :error nil}
                   msg (helpers/mock-ws-message :prism.cache/status {} reply-capture)]
               (provided
                (cache-rebuild/get-rebuild-status) => test-status)

               ;; Call the handler
               (common-ws/handle-ws-message msg)

               ;; Verify response
               (reply-capture) => (contains {:success true
                                             :data test-status}))))