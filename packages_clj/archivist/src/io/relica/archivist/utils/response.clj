(ns io.relica.archivist.utils.response
  "Utilities for creating standardized response formats across the archivist package.
   
   This namespace provides functions to create consistent success and error responses
   for WebSocket handlers and other components, ensuring interoperability with 
   client code in different languages (Python, TypeScript).")

;; Error code mapping for consistent error handling
(def error-codes
  {:database-error         1001
   :internal-error         1002
   :validation-error       1101
   :missing-required-field 1102
   :resource-not-found     1201
   :unauthorized           1301
   :forbidden              1302})

(defn get-error-code
  "Get the error code for a given error type."
  [error-type]
  (get error-codes error-type 1002)) ; Default to internal-error

(defn success-response
  "Create a standardized success response.
   
   Args:
     data - The data to include in the response
     request-id - Optional request ID for tracing (default: nil)
   
   Returns:
     A map with :success true, :request_id, :data, and :timestamp"
  ([data] (success-response data nil))
  ([data request-id]
   {:success true
    :request_id request-id
    :data data
    :timestamp (System/currentTimeMillis)}))

(defn error-response
  "Create a standardized error response.
   
   Args:
     error-type - Keyword indicating the type of error
     message - Human-readable error message
     details - Optional additional error details (default: nil)
     request-id - Optional request ID for tracing (default: nil)
   
   Returns:
     A map with :success false, :request_id, :error, and :timestamp"
  ([error-type message] (error-response error-type message nil nil))
  ([error-type message details] (error-response error-type message details nil))
  ([error-type message details request-id]
   {:success false
    :request_id request-id
    :error {:code (get-error-code error-type)
            :type (name error-type)
            :message message
            :details details}
    :timestamp (System/currentTimeMillis)}))

(defn with-standard-response
  "Wrap a handler function to provide standard response format helpers.
   
   The wrapped handler will receive additional keys in its context:
   - :respond-success - Function to send success response
   - :respond-error - Function to send error response
   
   Args:
     handler-fn - Function that accepts a context map
   
   Returns:
     Wrapped handler function"
  [handler-fn]
  (fn [context]
    (let [request-id (get-in context [:?data :request_id])
          reply-fn (:?reply-fn context)
          respond-success (fn [data] 
                           (let [response (success-response data request-id)]
                             (reply-fn response)))
          respond-error (fn [error-type message & [details]]
                         (let [response (error-response error-type message details request-id)]
                           (reply-fn response)))
          enhanced-context (assoc context 
                                 :respond-success respond-success
                                 :respond-error respond-error)]
      (try
        (handler-fn enhanced-context)
        (catch Exception e
          (let [response (error-response :internal-error 
                                       (.getMessage e) 
                                       nil 
                                       request-id)]
            (reply-fn response)))))))

(defn valid-success-response?
  "Validate that a response has the correct success format."
  [response]
  (and (map? response)
       (true? (:success response))
       (contains? response :data)))

(defn valid-error-response?
  "Validate that a response has the correct error format."
  [response]
  (and (map? response)
       (false? (:success response))
       (map? (:error response))
       (contains? (:error response) :code)
       (contains? (:error response) :type)
       (contains? (:error response) :message)))

(defn valid-response?
  "Validate that a response has the correct general format."
  [response]
  (or (valid-success-response? response)
      (valid-error-response? response)))