(ns io.relica.archivist.io.ws-server
  (:require [clojure.tools.logging :as log]
            [io.relica.common.websocket.server :as ws]
            ;; require all ws-handlers
            [io.relica.archivist.io.ws-handlers]))


(defprotocol WebSocketOperations
  (broadcast! [this message])
  (send-to-session! [this session-id message])
  (get-active-sessions [this])
  (start! [this])
  (stop! [this])
  )


(defrecord WebSocketComponent [args]
  WebSocketOperations
  (broadcast! [_ message]
    (broadcast! (:server args) message))

  (send-to-session! [_ client-id message]
    (ws/send! (:server args) client-id message))

  (get-active-sessions [_]
    (when-let [connected-uids (:connected-uids @(:state (:server args)))]
      (count (:any @connected-uids))))

  (start! [_]
    (ws/start! (:server args)))

  (stop! [_]
    (ws/stop! (:server args)))

    )

(defn start [{:keys [port] :as args}]
  (tap> (str "!!! Starting WebSocket server on port " port))
  (let [server (ws/create-server {:port port
                                  })
        component (->WebSocketComponent (assoc args :server server))]
    (start! component)
    component))

(defn stop [component]
  (log/info "Stopping WebSocket server...")
  (when component
    (stop! component)))

(comment

  (def foo (start {:port 3000}))

  (:server foo)
  (stop! foo)


  )
