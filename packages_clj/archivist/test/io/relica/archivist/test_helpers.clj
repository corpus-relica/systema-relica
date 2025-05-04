(ns io.relica.archivist.test-helpers
  (:require [midje.sweet :refer :all]
            [io.relica.archivist.utils.response :as response]))

;; Mock a request with given data
(defn mock-request 
  "Create a mock request map with the specified parameters"
  ([data] (mock-request data nil nil))
  ([data request-id] (mock-request data request-id nil))
  ([data request-id user-id]
   {:data data
    :request_id request-id
    :user-id user-id}))

;; Helper to validate response format
(defn valid-success-response? 
  "Check if a response follows the standard success format"
  [response request-id]
  (and (map? response)
       (true? (:success response))
       (= request-id (:request_id response))
       (contains? response :data)))

(defn valid-error-response? 
  "Check if a response follows the standard error format"
  [response request-id]
  (and (map? response)
       (false? (:success response))
       (= request-id (:request_id response))
       (map? (:error response))
       (contains? (:error response) :code)
       (contains? (:error response) :type)
       (contains? (:error response) :message)))

;; Common checkers for testing
(defchecker valid-success [expected-request-id]
  (checker [actual]
    (valid-success-response? actual expected-request-id)))

(defchecker valid-error [expected-request-id]
  (checker [actual]
    (valid-error-response? actual expected-request-id)))

(defchecker has-data-key [key expected-value]
  (checker [actual]
    (= expected-value (get-in actual [:data key]))))

(defchecker has-error-code [expected-code]
  (checker [actual]
    (= expected-code (get-in actual [:error :code]))))

(defchecker has-error-type [expected-type]
  (checker [actual]
    (= (name expected-type) (get-in actual [:error :type]))))

;; Mock DB/service layer functions that handlers might call
(defn mock-db-error [& args]
  (throw (ex-info "Database error" {:type :db-error})))

(defn mock-db-success [& args]
  {:success true
   :data {:test-data "Success"}})

(defn mock-async-db-error [& args]
  (let [ch (clojure.core.async/chan)]
    (clojure.core.async/put! ch {:success false 
                                :error {:message "Database error"
                                        :type :db-error
                                        :code 1201}})
    ch))

(defn mock-async-db-success [& args]
  (let [ch (clojure.core.async/chan)]
    (clojure.core.async/put! ch {:success true
                                :data {:test-data "Success"}})
    ch))