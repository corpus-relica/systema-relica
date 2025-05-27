(ns io.relica.shutter.tokens-test
  (:require [clojure.test :refer :all]
            [io.relica.shutter.tokens :as tokens]))

(deftest test-token-generation
  (testing "Token generation"
    (let [token (tokens/generate-secure-token)]
      (is (string? token))
      (is (tokens/valid-token-format? token))
      (is (> (count token) (count tokens/TOKEN_PREFIX))))))

(deftest test-token-hashing
  (testing "Token hashing and verification"
    (let [token "srt_test123"
          hash (tokens/hash-token token)]
      (is (string? hash))
      (is (not= token hash))
      (is (tokens/verify-token token hash))
      (is (not (tokens/verify-token "wrong-token" hash))))))

(deftest test-token-format-validation
  (testing "Token format validation"
    (is (tokens/valid-token-format? "srt_abc123"))
    (is (not (tokens/valid-token-format? "abc123")))
    (is (not (tokens/valid-token-format? "srt_")))
    (is (not (tokens/valid-token-format? nil)))
    (is (not (tokens/valid-token-format? "")))))

(deftest test-extract-token-from-header
  (testing "Token extraction from Authorization header"
    (is (= "srt_abc123"
           (tokens/extract-token-from-header "Bearer srt_abc123")))
    (is (nil? (tokens/extract-token-from-header "srt_abc123")))
    (is (nil? (tokens/extract-token-from-header "Basic abc123")))
    (is (nil? (tokens/extract-token-from-header nil)))))

(deftest test-scope-validation
  (testing "Scope validation"
    (is (tokens/validate-scopes ["read" "write"]))
    (is (not (tokens/validate-scopes ["read" "invalid"])))
    (is (tokens/has-scope? ["read" "write"] "read"))
    (is (not (tokens/has-scope? ["read"] "write")))
    (is (tokens/has-any-scope? ["read" "write"] ["write" "admin"]))
    (is (not (tokens/has-all-scopes? ["read"] ["read" "write"])))))

(deftest test-token-expiration
  (testing "Token expiration check"
    (let [past-date "2020-01-01T00:00:00Z"
          future-date "2030-01-01T00:00:00Z"]
      (is (tokens/token-expired? past-date))
      (is (not (tokens/token-expired? future-date)))
      (is (not (tokens/token-expired? nil))))))

(deftest test-prepare-token-data
  (testing "Token data preparation"
    (let [data (tokens/prepare-token-data
                {:name "Test Token"
                 :description "Test description"
                 :scopes ["read" "write"]
                 :expires-in-days 30})]
      (is (= "Test Token" (:name data)))
      (is (= "Test description" (:description data)))
      (is (= ["read" "write"] (:scopes data)))
      (is (some? (:expires-at data))))))

(deftest test-rate-limiting
  (testing "Rate limiting check"
    (is (tokens/can-create-token? 0))
    (is (tokens/can-create-token? 5))
    (is (tokens/can-create-token? 9))
    (is (not (tokens/can-create-token? 10)))
    (is (not (tokens/can-create-token? 11)))))