(ns io.relica.aperture.test-fixtures
  "Test fixtures for the aperture module - provides mock environments, entities, and client instances."
  (:require [clojure.test :refer :all]
            [clojure.core.async :refer [go <! >! chan timeout] :as async]
            [java-time :as jt]))

;; Mock environment data
(def mock-environment-data
  "Sample environment data for testing"
  {:id "test-env-123"
   :user_id "user-456"
   :name "Test Environment"
   :description "A test environment for unit testing"
   :created_at (jt/local-date-time)
   :updated_at (jt/local-date-time)
   :entities #{}
   :selected_entities #{}
   :loaded_facts #{}})

(def mock-environment-list
  "List of environments for testing"
  [{:id "env-1" :user_id "user-1" :name "Environment 1" :created_at (jt/local-date-time)}
   {:id "env-2" :user_id "user-1" :name "Environment 2" :created_at (jt/local-date-time)}
   {:id "env-3" :user_id "user-2" :name "Environment 3" :created_at (jt/local-date-time)}])

;; Mock entity data
(def mock-entity-data
  "Sample entity data for testing"
  {:uid "entity-123"
   :name "Test Entity"
   :type "kind"
   :category "physical object"
   :description "A test entity for unit testing"
   :properties {}})

(def mock-entities-list
  "List of entities for testing"
  [{:uid "ent-1" :name "Entity 1" :type "kind" :category "physical object"}
   {:uid "ent-2" :name "Entity 2" :type "individual" :category "aspect"}
   {:uid "ent-3" :name "Entity 3" :type "kind" :category "relation"}])

;; Mock fact data
(def mock-fact-data
  "Sample fact data for testing"
  {:uid "fact-123"
   :subject "ent-1"
   :predicate "is-a"
   :object "ent-2"
   :created_at (jt/local-date-time)})

(def mock-facts-list
  "List of facts for testing"
  [{:uid "fact-1" :subject "ent-1" :predicate "is-a" :object "ent-2"}
   {:uid "fact-2" :subject "ent-2" :predicate "has-aspect" :object "ent-3"}
   {:uid "fact-3" :subject "ent-1" :predicate "specializes" :object "ent-3"}])

;; Mock classification data
(def mock-classification-data
  "Sample classification data for testing"
  {:classifier_uid "class-123"
   :classified_uid "ent-456"
   :relation_type "classification"
   :created_at (jt/local-date-time)})

;; Mock composition data
(def mock-composition-data
  "Sample composition data for testing"
  {:whole_uid "whole-123"
   :part_uid "part-456"
   :relation_type "composition"
   :created_at (jt/local-date-time)})

;; Mock connection data
(def mock-connection-data
  "Sample connection data for testing"
  {:connector_uid "conn-123"
   :connected_uid "ent-456"
   :relation_type "connection"
   :created_at (jt/local-date-time)})

;; Mock client instance data
(def mock-client-instance
  "Sample client instance for testing"
  {:id "client-123"
   :websocket-session nil
   :environment_id "test-env-123"
   :user_id "user-456"
   :connected_at (jt/local-date-time)
   :last_activity (jt/local-date-time)
   :state :connected})

(def mock-client-instances-list
  "List of client instances for testing"
  [{:id "client-1" :environment_id "env-1" :user_id "user-1" :state :connected}
   {:id "client-2" :environment_id "env-1" :user_id "user-2" :state :connected}
   {:id "client-3" :environment_id "env-2" :user_id "user-1" :state :disconnected}])

;; Mock WebSocket message data
(def mock-ws-message-environment-get
  "Sample WebSocket message for environment get"
  {:type :aperture.environment/get
   :data {:environment_id "test-env-123"}
   :request_id "req-123"
   :timestamp (System/currentTimeMillis)})

(def mock-ws-message-entity-load
  "Sample WebSocket message for entity load"
  {:type :aperture.entity/load
   :data {:uid "entity-123" :environment_id "test-env-123"}
   :request_id "req-456"
   :timestamp (System/currentTimeMillis)})

(def mock-ws-message-environment-create
  "Sample WebSocket message for environment create"
  {:type :aperture.environment/create
   :data {:name "New Environment" :user_id "user-456"}
   :request_id "req-789"
   :timestamp (System/currentTimeMillis)})

;; Test data generators
(defn generate-test-environment
  "Generates a test environment with optional overrides"
  [& {:keys [id user-id name description]
      :or {id (str "test-env-" (rand-int 10000))
           user-id (str "user-" (rand-int 1000))
           name "Generated Test Environment"
           description "Auto-generated test environment"}}]
  {:id id
   :user_id user-id
   :name name
   :description description
   :created_at (jt/local-date-time)
   :updated_at (jt/local-date-time)
   :entities #{}
   :selected_entities #{}
   :loaded_facts #{}})

(defn generate-test-entity
  "Generates a test entity with optional overrides"
  [& {:keys [uid name type category]
      :or {uid (str "entity-" (rand-int 10000))
           name "Generated Test Entity"
           type "kind"
           category "physical object"}}]
  {:uid uid
   :name name
   :type type
   :category category
   :description (str "Auto-generated " type " of " category)
   :properties {}})

(defn generate-test-fact
  "Generates a test fact with optional overrides"
  [& {:keys [uid subject predicate object]
      :or {uid (str "fact-" (rand-int 10000))
           subject (str "subj-" (rand-int 1000))
           predicate "test-predicate"
           object (str "obj-" (rand-int 1000))}}]
  {:uid uid
   :subject subject
   :predicate predicate
   :object object
   :created_at (jt/local-date-time)})

(defn generate-test-client
  "Generates a test client instance with optional overrides"
  [& {:keys [id environment-id user-id state]
      :or {id (str "client-" (rand-int 10000))
           environment-id (str "env-" (rand-int 1000))
           user-id (str "user-" (rand-int 1000))
           state :connected}}]
  {:id id
   :websocket-session nil
   :environment_id environment-id
   :user_id user-id
   :connected_at (jt/local-date-time)
   :last_activity (jt/local-date-time)
   :state state})

;; Performance test data
(def large-environment-dataset
  "Large dataset for performance testing"
  {:environments (vec (for [i (range 100)]
                        (generate-test-environment 
                          :id (str "perf-env-" i)
                          :user-id (str "perf-user-" (mod i 10)))))
   :entities (vec (for [i (range 1000)]
                    (generate-test-entity 
                      :uid (str "perf-entity-" i)
                      :category (nth ["physical object" "aspect" "relation" "occurrence"] (mod i 4)))))
   :facts (vec (for [i (range 5000)]
                 (generate-test-fact 
                   :uid (str "perf-fact-" i)
                   :subject (str "perf-entity-" (mod i 1000))
                   :object (str "perf-entity-" (mod (+ i 100) 1000)))))})

;; Mock service clients
(defn mock-environment-service
  "Creates a mock environment service for testing"
  [response-map]
  (reify
    Object
    (toString [_] "MockEnvironmentService")
    
    clojure.lang.IFn
    (invoke [this operation data]
      (go
        (case operation
          :get (get response-map :get mock-environment-data)
          :list (get response-map :list mock-environment-list)
          :create (get response-map :create (assoc mock-environment-data :id (str "new-" (rand-int 1000))))
          :update (get response-map :update mock-environment-data)
          :delete (get response-map :delete {:success true})
          :clear (get response-map :clear {:success true})
          {:error "Unknown operation"})))))

(defn mock-entity-service
  "Creates a mock entity service for testing"
  [response-map]
  (reify
    Object
    (toString [_] "MockEntityService")
    
    clojure.lang.IFn
    (invoke [this operation data]
      (go
        (case operation
          :load (get response-map :load mock-entity-data)
          :load-multiple (get response-map :load-multiple mock-entities-list)
          :unload (get response-map :unload {:success true})
          :unload-multiple (get response-map :unload-multiple {:success true})
          :select (get response-map :select {:success true})
          :deselect (get response-map :deselect {:success true})
          {:error "Unknown operation"})))))

(defn mock-fact-service
  "Creates a mock fact service for testing"
  [response-map]
  (reify
    Object
    (toString [_] "MockFactService")
    
    clojure.lang.IFn
    (invoke [this operation data]
      (go
        (case operation
          :load-related (get response-map :load-related mock-facts-list)
          {:error "Unknown operation"})))))

;; Error simulation utilities
(defn failing-service
  "Mock service that simulates failures"
  [error-type]
  (reify
    clojure.lang.IFn
    (invoke [this operation data]
      (go
        (case error-type
          :timeout (async/<! (async/timeout 5000))
          :connection-error (throw (ex-info "Connection failed" {:type :connection-error}))
          :invalid-response {:error "Invalid response format"}
          :empty-response nil
          :service-unavailable {:error "Service unavailable" :status 503}
          (throw (ex-info "Unknown error" {:type :unknown-error})))))))

;; Test fixture setup/teardown utilities
(defn with-mock-environment-service
  "Test fixture that provides a mock environment service"
  [test-fn & [response-data]]
  ;; Since we don't have global service atoms, just run the test function
  ;; In real tests, we use with-redefs to mock individual functions
  (test-fn))

(defn with-mock-entity-service
  "Test fixture that provides a mock entity service"
  [test-fn & [response-data]]
  ;; Since we don't have global service atoms, just run the test function
  ;; In real tests, we use with-redefs to mock individual functions
  (test-fn))

(defn with-performance-data
  "Test fixture that provides large datasets for performance testing"
  [test-fn]
  (with-mock-environment-service test-fn 
    {:list (:environments large-environment-dataset)
     :get (first (:environments large-environment-dataset))}))

(defn with-failing-service
  "Test fixture that simulates service failures"
  [error-type test-fn]
  ;; Since we don't have global service atoms, just run the test function
  ;; In real tests, we use with-redefs to mock individual functions
  (test-fn))

;; WebSocket test utilities
(defn mock-aperture-ws-message
  "Creates a mock WebSocket message for Aperture operations"
  [operation data reply-fn]
  {:id (str "test-msg-" (System/currentTimeMillis))
   :operation operation
   :data data
   :reply reply-fn
   :timestamp (System/currentTimeMillis)})

(defn mock-websocket-session
  "Creates a mock WebSocket session for testing"
  [& {:keys [id connected?] :or {id "test-session" connected? true}}]
  {:id id
   :connected? connected?
   :send-message (fn [msg] (println "Mock sending:" msg))
   :close (fn [] (println "Mock closing session"))})

;; Environment state testing utilities
(defn create-test-environment-state
  "Creates a test environment state with entities and facts"
  [& {:keys [environment entities facts selected]
      :or {environment mock-environment-data
           entities #{}
           facts #{}
           selected #{}}}]
  {:environment environment
   :entities entities
   :selected_entities selected
   :loaded_facts facts
   :last_updated (System/currentTimeMillis)})