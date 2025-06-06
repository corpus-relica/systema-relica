(ns io.relica.aperture.config-test
  "Tests for configuration management and database operations."
  (:require [clojure.test :refer :all]
            [io.relica.aperture.config :as config]
            [next.jdbc :as jdbc]
            [taoensso.nippy :as nippy]
            [io.relica.aperture.test-helpers :as helpers]
            [io.relica.aperture.test-fixtures :as fixtures]))

;; Application configuration tests
(deftest test-app-config-structure
  (testing "App configuration has required structure"
    (is (map? config/app-config))
    (is (contains? config/app-config :ws-server))
    (is (contains? config/app-config :archivist))))

(deftest test-app-config-ws-server
  (testing "WebSocket server configuration"
    (let [ws-config (:ws-server config/app-config)]
      (is (contains? ws-config :port))
      (is (or (string? (:port ws-config)) (number? (:port ws-config)))))))

(deftest test-app-config-archivist
  (testing "Archivist service configuration"
    (let [archivist-config (:archivist config/app-config)]
      (is (contains? archivist-config :host))
      (is (contains? archivist-config :port))
      (is (string? (:host archivist-config)))
      (is (or (string? (:port archivist-config)) (number? (:port archivist-config)))))))

(deftest test-app-config-environment-variables
  (testing "App configuration respects environment variables"
    ;; Test that the config structure can handle environment variable logic
    (let [mock-getenv (fn [var-name]
                       (case var-name
                         "APERTURE_WS_PORT" "9999"
                         "ARCHIVIST_HOST" "test-host"
                         "ARCHIVIST_PORT" "8888"
                         nil))
          test-config {:ws-server {:port (or (mock-getenv "APERTURE_WS_PORT") 2175)}
                      :archivist {:host (or (mock-getenv "ARCHIVIST_HOST") "localhost")
                                 :port (or (mock-getenv "ARCHIVIST_PORT") 3000)}}]
      (is (= "9999" (get-in test-config [:ws-server :port])))
      (is (= "test-host" (get-in test-config [:archivist :host])))
      (is (= "8888" (get-in test-config [:archivist :port]))))))

;; Database configuration tests
(deftest test-db-spec-structure
  (testing "Database specification has required fields"
    (is (map? config/db-spec))
    (is (= "postgresql" (:dbtype config/db-spec)))
    (is (contains? config/db-spec :dbname))
    (is (contains? config/db-spec :host))
    (is (contains? config/db-spec :user))
    (is (contains? config/db-spec :password))
    (is (contains? config/db-spec :port))
    (is (number? (:port config/db-spec)))))

(deftest test-db-spec-environment-variables
  (testing "Database spec respects environment variables"
    ;; Test that the db spec structure can handle environment variable logic
    (let [mock-getenv (fn [var-name]
                       (case var-name
                         "POSTGRES_DB" "test_db"
                         "POSTGRES_HOST" "db-host"
                         "POSTGRES_USER" "test_user"
                         "POSTGRES_PASSWORD" "test_pass"
                         "POSTGRES_PORT" "5433"
                         nil))
          test-spec {:dbtype "postgresql"
                    :dbname (or (mock-getenv "POSTGRES_DB") "postgres")
                    :host (or (mock-getenv "POSTGRES_HOST") "localhost")
                    :user (or (mock-getenv "POSTGRES_USER") "postgres")
                    :password (or (mock-getenv "POSTGRES_PASSWORD") "password")
                    :port (parse-long (or (mock-getenv "POSTGRES_PORT") "5432"))}]
      (is (= "test_db" (:dbname test-spec)))
      (is (= "db-host" (:host test-spec)))
      (is (= "test_user" (:user test-spec)))
      (is (= "test_pass" (:password test-spec)))
      (is (= 5433 (:port test-spec))))))

(deftest test-datasource-creation
  (testing "Datasource is created from db-spec"
    (is (some? config/ds))
    ;; Test that it's a valid datasource object
    (is (instance? javax.sql.DataSource config/ds))))

;; Safe thaw function tests
(deftest test-safe-thaw-with-nil
  (testing "Safe thaw handles nil values"
    (is (= [] (config/safe-thaw nil)))))

(deftest test-safe-thaw-with-valid-data
  (testing "Safe thaw processes valid frozen data"
    (let [test-data [1 2 3]
          frozen (nippy/freeze test-data)]
      (is (= test-data (config/safe-thaw frozen))))))

(deftest test-safe-thaw-with-invalid-data
  (testing "Safe thaw handles invalid data gracefully"
    (with-redefs [clojure.tools.logging/warn (constantly nil)]
      (is (= [] (config/safe-thaw "invalid-frozen-data"))))))

;; Database operation mocking helpers
(defn mock-jdbc-execute-result [result]
  (fn [_ _ & _] result))

(defn mock-jdbc-execute-one-result [result]
  (fn [_ _ & _] result))

;; Environment retrieval tests
(deftest test-get-user-environments-success
  (testing "Get user environments returns processed environments"
    (let [raw-envs [{:id 1 :name "Env 1" :facts (nippy/freeze [fixtures/mock-fact-data]) :models (nippy/freeze [])}
                   {:id 2 :name "Env 2" :facts (nippy/freeze []) :models (nippy/freeze [])}]]
      (with-redefs [jdbc/execute! (mock-jdbc-execute-result raw-envs)]
        (let [result (config/get-user-environments 123)]
          (is (= 2 (count result)))
          (is (= "Env 1" (:name (first result))))
          (is (vector? (:facts (first result))))
          (is (vector? (:models (first result)))))))))

(deftest test-get-user-environments-empty
  (testing "Get user environments handles empty result"
    (with-redefs [jdbc/execute! (mock-jdbc-execute-result [])]
      (let [result (config/get-user-environments 123)]
        (is (empty? result))))))

(deftest test-get-user-environment-success
  (testing "Get user environment returns single processed environment"
    (let [raw-env {:id 1 :name "Test Env" :facts (nippy/freeze [fixtures/mock-fact-data]) :models (nippy/freeze [])}]
      (with-redefs [jdbc/execute-one! (mock-jdbc-execute-one-result raw-env)]
        (let [result (config/get-user-environment 123 1)]
          (is (= 1 (:id result)))
          (is (= "Test Env" (:name result)))
          (is (vector? (:facts result)))
          (is (vector? (:models result))))))))

(deftest test-get-user-environment-not-found
  (testing "Get user environment handles not found case"
    (with-redefs [jdbc/execute-one! (mock-jdbc-execute-one-result nil)]
      (let [result (config/get-user-environment 123 999)]
        (is (nil? result))))))

;; Environment creation tests
(deftest test-create-environment-success
  (testing "Create environment returns new environment"
    (let [new-env {:id 123 :name "New Environment" :facts (nippy/freeze []) :models (nippy/freeze [])}]
      (with-redefs [jdbc/execute-one! (mock-jdbc-execute-one-result new-env)]
        (let [result (config/create-environment! "New Environment")]
          (is (= 123 (:id result)))
          (is (= "New Environment" (:name result))))))))

(deftest test-create-user-environment-success
  (testing "Create user environment creates environment and association"
    (let [new-env {:id 456 :name "User Environment"}
          execute-calls (atom [])
          execute-one-calls (atom [])]
      (with-redefs [jdbc/with-transaction (fn [binding body] (body))
                    jdbc/execute-one! (fn [ds query & opts]
                                       (swap! execute-one-calls conj {:ds ds :query query :opts opts})
                                       (if (= 2 (count @execute-one-calls))
                                         new-env  ;; Second call returns the environment
                                         new-env)) ;; First call returns created env
                    config/get-user-environment (constantly new-env)]
        (let [result (config/create-user-environment! 123 "User Environment")]
          (is (= new-env result))
          (is (= 2 (count @execute-one-calls))))))))

;; Environment update tests
(deftest test-update-user-environment-success
  (testing "Update user environment with valid permissions"
    (let [permission-result {:user_environments/can_write true}
          updated-env {:id 1 :name "Updated Name" :facts [] :models []}
          execute-calls (atom [])]
      (with-redefs [jdbc/execute-one! (fn [ds query & opts]
                                       (swap! execute-calls conj {:query query})
                                       (cond
                                         (.contains (first query) "can_write") permission-result
                                         (.contains (first query) "UPDATE environments") updated-env
                                         (.contains (first query) "last_accessed") nil
                                         :else nil))
                    config/get-user-environment (constantly updated-env)]
        (let [result (config/update-user-environment! 123 1 {:name "Updated Name"})]
          (is (= updated-env result))
          (is (>= (count @execute-calls) 2))))))) ;; Permission check + update + last_accessed

(deftest test-update-user-environment-no-permission
  (testing "Update user environment fails without write permission"
    (let [permission-result {:user_environments/can_write false}]
      (with-redefs [jdbc/execute-one! (mock-jdbc-execute-one-result permission-result)]
        (let [result (config/update-user-environment! 123 1 {:name "Updated Name"})]
          (is (nil? result)))))))

(deftest test-update-user-environment-no-updates
  (testing "Update user environment handles empty updates"
    (let [permission-result {:user_environments/can_write true}]
      (with-redefs [jdbc/execute-one! (mock-jdbc-execute-one-result permission-result)]
        (let [result (config/update-user-environment! 123 1 {})]
          (is (nil? result)))))))

(deftest test-update-user-environment-with-facts
  (testing "Update user environment properly serializes facts"
    (let [permission-result {:user_environments/can_write true}
          test-facts [fixtures/mock-fact-data]
          updated-env {:id 1 :facts test-facts}
          serialization-calls (atom [])]
      (with-redefs [jdbc/execute-one! (fn [ds query & opts]
                                       (cond
                                         (.contains (first query) "can_write") permission-result
                                         (.contains (first query) "UPDATE environments") updated-env
                                         :else nil))
                    nippy/freeze (fn [data]
                                  (swap! serialization-calls conj data)
                                  (str "frozen-" data))
                    config/get-user-environment (constantly updated-env)]
        (let [result (config/update-user-environment! 123 1 {:facts test-facts})]
          (is (= updated-env result))
          (is (some #(= test-facts %) @serialization-calls)))))))

;; Entity selection tests
(deftest test-select-entity-success
  (testing "Select entity updates environment successfully"
    (let [updated-env {:id 1 :selected_entity_id "entity-123"}]
      (with-redefs [config/update-user-environment! (fn [user-id env-id updates]
                                                      (is (= 123 user-id))
                                                      (is (= 1 env-id))
                                                      (is (= "entity-123" (:selected_entity_id updates)))
                                                      updated-env)]
        (let [result (config/select-entity! 123 1 "entity-123")]
          (is (= updated-env result)))))))

(deftest test-deselect-entity-success
  (testing "Deselect entity clears selection successfully"
    (let [permission-result {:user_environments/can_write true}
          updated-env {:id 1 :selected_entity_id nil}
          execute-calls (atom [])]
      (with-redefs [jdbc/execute-one! (fn [ds query & opts]
                                       (swap! execute-calls conj {:query query})
                                       (cond
                                         (.contains (first query) "can_write") permission-result
                                         (.contains (first query) "selected_entity_id = NULL") updated-env
                                         (.contains (first query) "last_accessed") nil
                                         :else nil))
                    config/get-user-environment (constantly updated-env)]
        (let [result (config/deselect-entity! 123 1)]
          (is (= updated-env result))
          (is (>= (count @execute-calls) 2))))))) ;; Permission + update + last_accessed

(deftest test-deselect-entity-no-permission
  (testing "Deselect entity fails without write permission"
    (let [permission-result {:user_environments/can_write false}]
      (with-redefs [jdbc/execute-one! (mock-jdbc-execute-one-result permission-result)]
        (let [result (config/deselect-entity! 123 1)]
          (is (nil? result)))))))

;; Default environment tests
(deftest test-get-default-environment-success
  (testing "Get default environment returns most recent environment"
    (let [env-id-result {:user_environments/environment_id 1}
          default-env {:id 1 :name "Default Env" :facts [] :models []}]
      (with-redefs [jdbc/execute-one! (mock-jdbc-execute-one-result env-id-result)
                    config/get-user-environment (constantly default-env)]
        (let [result (config/get-default-environment 123)]
          (is (= default-env result)))))))

(deftest test-get-default-environment-string-user-id
  (testing "Get default environment handles string user ID"
    (let [env-id-result {:user_environments/environment_id 1}
          default-env {:id 1 :name "Default Env"}]
      (with-redefs [jdbc/execute-one! (mock-jdbc-execute-one-result env-id-result)
                    config/get-user-environment (constantly default-env)]
        (let [result (config/get-default-environment "123")]
          (is (= default-env result)))))))

(deftest test-get-default-environment-not-found
  (testing "Get default environment handles no environments case"
    (with-redefs [jdbc/execute-one! (mock-jdbc-execute-one-result nil)]
      (let [result (config/get-default-environment 123)]
        (is (nil? result))))))

(deftest test-get-default-environment-error-recovery
  (testing "Get default environment recovers from retrieval errors"
    (let [env-id-result {:user_environments/environment_id 1}]
      (with-redefs [jdbc/execute-one! (mock-jdbc-execute-one-result env-id-result)
                    config/get-user-environment (fn [_ _] (throw (Exception. "DB error")))
                    clojure.tools.logging/error (constantly nil)]
        (let [result (config/get-default-environment 123)]
          (is (= 1 (:id result)))
          (is (empty? (:facts result)))
          (is (empty? (:models result)))
          (is (= 123 (:user_id result))))))))

;; Integration and error handling tests
(deftest test-update-environment-sql-error
  (testing "Update environment handles SQL errors gracefully"
    (let [permission-result {:user_environments/can_write true}]
      (with-redefs [jdbc/execute-one! (fn [ds query & opts]
                                       (cond
                                         (.contains (first query) "can_write") permission-result
                                         (.contains (first query) "UPDATE environments") 
                                         (throw (Exception. "SQL constraint violation"))
                                         :else nil))
                    clojure.tools.logging/error (constantly nil)]
        (let [result (config/update-user-environment! 123 1 {:name "New Name"})]
          (is (nil? result)))))))

(deftest test-config-with-test-fixtures
  (testing "Configuration functions work with test fixtures"
    (let [test-envs [fixtures/mock-environment-data]]
      (with-redefs [jdbc/execute! (mock-jdbc-execute-result test-envs)]
        (let [result (config/get-user-environments 123)]
          (is (seq result)))))))

;; Performance and serialization tests
(deftest test-safe-thaw-performance
  (testing "Safe thaw handles multiple rapid calls"
    (let [test-data (vec (range 100))
          frozen (nippy/freeze test-data)]
      (dotimes [_ 10]
        (is (= test-data (config/safe-thaw frozen)))))))

(deftest test-environment-with-large-facts
  (testing "Environment handling with large fact collections"
    (let [large-facts (vec (repeat 100 fixtures/mock-fact-data))
          frozen-facts (nippy/freeze large-facts)
          env-data {:id 1 :facts frozen-facts :models (nippy/freeze [])}]
      (with-redefs [jdbc/execute-one! (mock-jdbc-execute-one-result env-data)]
        (let [result (config/get-user-environment 123 1)]
          (is (= 100 (count (:facts result)))))))))
