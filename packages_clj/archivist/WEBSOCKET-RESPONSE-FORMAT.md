# WebSocket Response Format Specification

This document outlines the standardized response format used in WebSocket communications for the Relica system.

## Background

As part of issue #51 (REL-45), we have standardized the WebSocket message identifier naming convention and response format to improve consistency, error handling, and developer experience across the system.

## Response Format

### Success Response

Success responses follow this format:

```clojure
{
  :success true
  :request_id "unique-request-id"  ; Optional, included when available
  :data { ... }  ; Payload containing the actual response data
}
```

Example:
```clojure
{
  :success true
  :request_id "client-123-456"
  :data {
    :facts [
      { :uid 123, :type "classification", ... },
      { :uid 456, :type "composition", ... }
    ]
  }
}
```

### Error Response

Error responses follow this format:

```clojure
{
  :success false
  :request_id "unique-request-id"  ; Optional, included when available
  :error {
    :code 1234  ; Numeric error code
    :type "error-type"  ; String identifier for the error type
    :message "Human-readable error message"
    :details { ... }  ; Optional field with additional error context
  }
}
```

Example:
```clojure
{
  :success false
  :request_id "client-123-456"
  :error {
    :code 1203
    :type "query-execution-failed"
    :message "Failed to execute graph query"
    :details {
      :exception "java.lang.NullPointerException"
    }
  }
}
```

## Error Codes

Error codes are grouped by category:

### System Errors (1001-1099)
- 1001 - Service unavailable - Service not initialized or unavailable
- 1002 - Internal error - Unexpected system error
- 1003 - Timeout - Operation timed out
- 1004 - Service overloaded - Service is too busy to handle request

### Validation Errors (1101-1199)
- 1101 - Validation error - Generic validation error
- 1102 - Missing required field - Required field is missing
- 1103 - Invalid field format - Field format is invalid
- 1104 - Invalid reference - Reference to non-existent entity
- 1105 - Constraint violation - Business rule or constraint violated

### Data Access Errors (1201-1299)
- 1201 - Resource not found - Requested resource not found
- 1202 - Resource already exists - Resource already exists, can't create
- 1203 - Query execution failed - Query execution failed
- 1204 - Transaction failed - Transaction operation failed
- 1205 - Unauthorized access - Not authorized to access resource
- 1206 - Database error - General database error

## Client Implementation

Clients should handle both the new standardized format and the legacy format for backwards compatibility. The standard approach for clients is:

1. Check if the response has a `success` field
2. If present, handle according to the new format:
   - For success responses, extract and use the `data` field
   - For error responses, extract error information from the `error` field
3. If not present, fall back to legacy format handling

## Implementation Examples

### Python Client

```python
def handle_response(response):
    if 'success' in response:
        if response['success']:
            # Success response - return the data field
            return response.get('data', {})
        else:
            # Error response - extract error details
            error = response.get('error', {})
            if isinstance(error, dict):
                error_message = error.get('message', 'Unknown error')
                error_code = error.get('code', 0)
                error_type = error.get('type', 'error')
                error_details = error.get('details', {})
                return {"error": error_message, "code": error_code, 
                        "type": error_type, "details": error_details}
            else:
                return {"error": str(error)}
    
    # Fall back to old response format handling
    return response
```

### TypeScript Client

```typescript
function handleResponse(message) {
  if ('success' in message) {
    if (message.success) {
      // Success response
      return message.data;
    } else {
      // Error response
      const error = message.error;
      console.error("WebSocket error:", 
        typeof error === 'object' ? `${error.type} (${error.code}): ${error.message}` : error);
      throw new Error(typeof error === 'object' ? error.message : String(error));
    }
  }
  
  // Fall back to old response format
  return message.payload || message;
}
```

## Server Implementation

The server uses utility functions to generate standardized responses:

```clojure
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
```

A convenience wrapper is also available for handler functions:

```clojure
(defn with-standard-response
  "Wraps handler function to use standardized response format."
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
```