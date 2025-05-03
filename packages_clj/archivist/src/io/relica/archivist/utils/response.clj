(ns io.relica.archivist.utils.response
  (:require [clojure.tools.logging :as log]))

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
   :database-error                 1206 ;; General database error
   })

;; ==========================================================================
;; Response utility functions
;; ==========================================================================

(defn success-response
  "Generate a standardized success response"
  ([data]
   (success-response data nil))
  ([data request-id]
   {:success true
    :request_id request-id
    :data data}))

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
;; Handler utility functions
;; ==========================================================================

(defn with-standard-response
  "Wraps handler function to use standardized response format.
   The handler should use :respond-success or :respond-error functions."
  [handler]
  (fn [{:keys [?data ?reply-fn] :as msg}]
    (handler (assoc msg
                    :respond-success (fn 
                                       ([data] (?reply-fn (success-response data (:request_id ?data))))
                                       ([data request-id] (?reply-fn (success-response data request-id))))
                    :respond-error (fn 
                                     ([error-type message] 
                                      (?reply-fn (error-response error-type message nil (:request_id ?data))))
                                     ([error-type message details] 
                                      (?reply-fn (error-response error-type message details (:request_id ?data))))
                                     ([error-type message details request-id] 
                                      (?reply-fn (error-response error-type message details request-id))))))))
