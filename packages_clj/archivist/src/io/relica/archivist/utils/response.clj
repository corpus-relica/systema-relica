(ns io.relica.archivist.utils.response
   (:require [clojure.tools.logging :as log]
             [clojure.core.async :as async :refer [<! go chan]]))

 ;; ==========================================================================
 ;; Error code definitions
 ;; ==========================================================================

 ;; Error code ranges by module (as specified in the migration plan)
 ;; 1xxx: Archivist errors
 ;;   1001-1099: Archivist system errors
 ;;   1101-1199: Archivist validation errors
 ;;   1201-1299: Archivist data access errors

(def error-codes
  {;; System errors (1001-1099)
   :service-unavailable            1001 ;; Service not initialized or unavailable
   :internal-error                 1002 ;; Unexpected system error
   :timeout                        1003 ;; Operation timed out
   :service-overloaded             1004 ;; Service is too busy to handle request

   ;; Validation errors (1101-1199)
   :validation-error               1101 ;; Generic validation error
   :missing-required-field         1102 ;; Required field is missing
   :invalid-field-format           1103 ;; Field format is invalid
   :invalid-reference              1104 ;; Reference to non-existent entity
   :constraint-violation           1105 ;; Business rule or constraint violated

   ;; Data access errors (1201-1299)
   :resource-not-found             1201 ;; Requested resource not found
   :resource-already-exists        1202 ;; Resource already exists, can't create
   :query-execution-failed         1203 ;; Query execution failed
   :transaction-failed             1204 ;; Transaction operation failed
   :unauthorized-access            1205 ;; Not authorized to access resource
   :database-error                 1206}) ;; General database error
    

 ;; ==========================================================================
 ;; Response utility functions
 ;; ==========================================================================

(defn success-response
  "Generate a standardized success response"
  ([data]
   (success-response data nil))
  ([data request-id]
   (merge {:success true
           :request_id request-id}
          data)))
    

(defn error-response
  "Generate a standardized error response"
  ([error-type message]
   (error-response error-type message nil nil))
  ([error-type message details]
   (error-response error-type message details nil))
  ([error-type message details request-id]
   (let [error-code (get error-codes error-type)
         error-type-str (name error-type)]
     {:success false
      :request_id request-id
      :error {:code (or error-code 1002) ; Default to internal error if code not found
              :type error-type-str
              :message message
              :details details}})))

 ;; ==========================================================================
 ;; WebSocket Handler Macro
 ;; ==========================================================================

(defmacro def-ws-handler
  "Defines a WebSocket message handler using defmethod, wrapping the body
   in a go-block with try-catch, providing helper functions respond-success
   and respond-error. Allows an optional custom catch block.
   The incoming message map is bound internally and not exposed directly."
  [message-type & body]
  (let [msg-binding (gensym "msg-")
        data-sym (gensym "?data-")
        reply-fn-sym (gensym "?reply-fn-")
        request-id-sym (gensym "request-id-")
        exception-sym (gensym "e-")
        main-body (filter #(not (and (seq? %) (= 'catch (first %)))) body)
        catch-clause (first (filter #(and (seq? %) (= 'catch (first %))) body))]
    `(defmethod io.relica.common.websocket.server/handle-ws-message ~message-type
       [~msg-binding]
       (let [;; Extract data/reply outside the go block for stable capture
             ~data-sym (:?data ~msg-binding)
             ~reply-fn-sym (:?reply-fn ~msg-binding)
             ~request-id-sym (:request_id ~data-sym)]
         (go ; Start go block
           (let [;; Define helpers INSIDE go using let + fn
                 respond-success# (fn
                                    ([data#] (~reply-fn-sym (success-response data# ~request-id-sym)))
                                    ([data# req-id#] (~reply-fn-sym (success-response data# req-id#))))
                 respond-error#   (fn
                                    ([error-type# message#]
                                     (~reply-fn-sym (error-response error-type# message# nil ~request-id-sym)))
                                    ([error-type# message# details#]
                                     (~reply-fn-sym (error-response error-type# message# details# ~request-id-sym)))
                                    ([error-type# message# details# req-id#]
                                     (~reply-fn-sym (error-response error-type# message# details# req-id#))))
                 ;; Make original data/reply available if needed inside go block
                 ~'?data ~data-sym
                 ~'?reply-fn ~reply-fn-sym
                 ;; Bind user-facing names to the helpers
                 ~'respond-success respond-success#
                 ~'respond-error respond-error#]
             (try
               ;; Execute main body forms - helpers are in scope
               ~@main-body

               ;; Use the provided catch clause or the default one
               ~(if catch-clause
                  ;; User provided a catch clause - helpers are already in scope
                  (let [[_ type binding & catch-body] catch-clause]
                    `(catch ~type ~binding
                       ~@catch-body))
                  ;; Default catch clause
                  `(catch Exception ~exception-sym
                     (log/error ~exception-sym (str "Error handling WebSocket message: " ~message-type))
                     ;; Use the helper function directly
                     (respond-error# :internal-error
                                     (str "Internal server error processing message: " ~message-type)
                                     {:exception (str ~exception-sym)}))))))))))
