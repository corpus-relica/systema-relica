(ns io.relica.common.io.aperture-client
  (:require [io.relica.common.websocket.client :as ws]
            [clojure.core.async :as async :refer [go-loop <! timeout]]
            [clojure.tools.logging :as log]))

;; Custom client with application-specific behavior
(defprotocol ApertureOperations
  (get-environment [this user-id env-id])
  (list-environments [this user-id])
  (create-environment [this user-id env-name])
  (load-specialization-hierarchy [this user-id uid])
  (update-environment! [this user-id env-id updates])
  (select-entity [this user-id env-id entity-uid])
  (select-entity-none [this user-id env-id])
  (send-heartbeat! [this]))

(defrecord ApertureClient [ws-client options]
  ApertureOperations
  (get-environment
    [this user-id env-id]
    (tap> {:event :app/getting-environment})
    (tap> (ws/connected? ws-client))
    (when-not (ws/connected? ws-client)
      (ws/connect! ws-client))
    (tap> {:event :app/sending-get-environment})
    (ws/send-message! ws-client :environment/get
                      {:user-id user-id
                       :environment-id env-id}
                      (:timeout options)))

  (list-environments [this user-id]
    (when-not (ws/connected? ws-client) (ws/connect! this))
    (ws/send-message! ws-client :environment/list
                      {:user-id user-id}
                      (:timeout options)))

  (create-environment [this user-id env-name]
    (when-not (ws/connected? ws-client) (ws/connect! this))
    (ws/send-message! ws-client :environment/create
                      {:user-id user-id
                       :name env-name}
                      (:timeout options)))

  (load-specialization-hierarchy [this user-id uid]
    (when-not (ws/connected? ws-client) (ws/connect! this))
    (ws/send-message! ws-client :environment/load-specialization
                      {:uid uid
                       :user-id user-id}
                      (:timeout options)))

  (update-environment! [this user-id env-id updates]
    (when-not (ws/connected? ws-client) (ws/connect! this))
    (ws/send-message! ws-client :environment/update
                      {:user-id user-id
                       :environment-id env-id
                       :updates updates}
                      (:timeout options)))

  (select-entity [this user-id env-id entity-uid]
    (when-not (ws/connected? ws-client) (ws/connect! this))
    (ws/send-message! ws-client :entity/select
                      {:user-id user-id
                       :environment-id env-id
                       :entity-uid entity-uid}
                      (:timeout options)))

  (select-entity-none [this user-id env-id]
    (when-not (ws/connected? ws-client) (ws/connect! this))
    (ws/send-message! ws-client :entity/select-none
                      {:user-id user-id
                       :environment-id env-id}
                      (:timeout options)))

  (send-heartbeat! [this]
    (tap> {:event :app/sending-heartbeat})
    (ws/send-message! ws-client :app/heartbeat
                            {:timestamp (System/currentTimeMillis)}
                            30000)))

;; Heartbeat scheduler
(defn start-heartbeat-scheduler! [aperture-client interval-ms]
  (let [running (atom true)
        scheduler (go-loop []
                    (<! (timeout interval-ms))
                    (when @running
                      (send-heartbeat! aperture-client)
                      (recur)))]
    ;; Return a function that stops the scheduler
    #(do (reset! running false)
         (async/close! scheduler))))

;; Factory function
(defn create-client [server-uri opts]
  (let [app-handlers (:handlers opts)
        base-client (ws/create-client server-uri
                                      {:handlers
                                       {:on-connect #(tap> {:event :app/connected})
                                        :on-disconnect #(tap> {:event :app/disconnected})
                                        :on-message (fn [event-type payload]
                                                      (tap> {:event :app/message-received
                                                             :type event-type}))}})
        aperture-client (->ApertureClient base-client {:timeout 5000})]

    ;; Register application-specific event handlers
    (ws/register-handler! base-client :entity/selected (:handle-entity-selected app-handlers))
    (ws/register-handler! base-client :entity/selected-none (:handle-entity-selected-none app-handlers))

    ;; Connect to the server
    (ws/connect! base-client)

    ;; (tap> {:event :app/client-created
    ;;        :client-id (ws/client-id base-client)})

    (start-heartbeat-scheduler! aperture-client 30000)

    aperture-client))


;; ==========================================================================
;; REPL Testing
;; ==========================================================================
(comment
  ;; Create an application-specific client
  (def app-client (create-app-client "localhost:3030"))

  ;; Start heartbeat scheduler (every 30 seconds)
  (def stop-heartbeat (start-heartbeat-scheduler! app-client 30000))

  ;; Send some test files
  (sync-files! app-client [{:id "file1" :name "document.txt" :size 1024}
                           {:id "file2" :name "image.jpg" :size 5242880}])

  ;; Request current status
  (def status-result (request-status! app-client))

  (async/<!! status-result) ;; Wait for response

  ;; Stop heartbeat and disconnect
  (stop-heartbeat)
  (ws-client/disconnect! (.-ws-client app-client))
  )
