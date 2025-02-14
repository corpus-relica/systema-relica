(ns io.relica.archivist.io.ws-server
  (:require [mount.core :refer [defstate]]
            [clojure.tools.logging :as log]
            [clojure.core.async :as async :refer [<! go chan]]
            [io.relica.common.websocket.server :as ws]

            [io.relica.archivist.gellish-base-service :as gellish-base-service]))

(defprotocol WebSocketOperations
  (broadcast! [this message])
  (send-to-session! [this session-id message])
  (get-active-sessions [this])
  (disconnect-all! [this])
  (get-xxx [this])
  )

(defmulti handle-ws-message (fn [component msg] (:type msg)))

(defmethod handle-ws-message :default
  [_ {:keys [type client-id]}]
  {:type "error"
   :client-id client-id
   :error (str "Unknown message type: " type)})

(defrecord WebSocketComponent [xxx server options]
  WebSocketOperations
  (broadcast! [_ message]
    (ws/broadcast! server message))

  (send-to-session! [_ client-id message]
    (ws/send! server client-id message))

  (get-active-sessions [_]
    (count @(:clients options)))

  (disconnect-all! [this]
    (ws/stop! server))

  (get-xxx [_]
    xxx))

(defn create-handlers [xxx component]
  {"example:ping" (fn [payload]
                    (go {:pong true}))
   "entities:resolve" (fn [payload]
                        (tap> "Resolving entity, nukkah")
                        (tap> payload)
                        (tap> xxx)
                        (tap> "-----------------------------")
                        (let [res (gellish-base-service/get-entities xxx (:uids payload))]
                          (tap> "Resolved entity, biotch1")
                          (tap> res)
                          (go {:resolved true
                               :data res}))

                        ;; (go
                        ;;   (let [foo (<! (gellish-base-service/get-entities
                        ;;                 @xxx
                        ;;                 (:uids payload)))]
                        ;;     (tap> "foo")
                        ;;     (tap> foo)
                        ;;   )
                        ;; (go{:resolved true}))
                        )
   ;; Add more handlers as needed
   })

(defonce ws-comp (atom nil))

(defn start
  ([xxx] (start xxx 3000))
  ([xxx port]
   (println "Starting WebSocket server on port" port)
   (let [handlers (create-handlers xxx nil)  ; We'll pass component later if needed
         server (ws/create-server port {:handlers handlers})
         comp (->WebSocketComponent xxx server {:clients (atom {})})]
     (reset! ws-comp comp)
     (ws/start! server)
     comp)))

(defn stop [component]
  (println "Stopping WebSocket server...")
  (when-let [server (:server component)]
    (ws/stop! server)))

(comment

  (io.relica.archivist.io.ws-server/get-xxx @ws-comp)

  (gellish-base-service/get-entities
         (io.relica.archivist.io.ws-server/get-xxx @ws-comp)
         [1225 1146])

  )
