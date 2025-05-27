(ns io.relica.shutter.tokens-test
  (:require [midje.sweet :refer :all]
            [io.relica.shutter.tokens :as tokens]
            [clojure.string :as str]))

(facts "about token generation"
       (fact "generates secure tokens with correct format"
             (let [token (tokens/generate-secure-token)]
               token => string?
               (tokens/valid-token-format? token) => true
               (count token) => #(> % (count tokens/TOKEN_PREFIX)))))

(facts "about token hashing"
       (fact "hashes and verifies tokens correctly"
             (let [token "srt_test123"
                   hash (tokens/hash-token token)]
               hash => string?
               hash =not=> token
               (:valid (tokens/verify-token token hash)) => true
               (:valid (tokens/verify-token "wrong-token" hash)) => false)))

(facts "about token format validation"
       (fact "validates token format correctly"
             (tokens/valid-token-format? "srt_abc123") => true
             (tokens/valid-token-format? "abc123") => false
             (tokens/valid-token-format? "srt_") => false
             (tokens/valid-token-format? nil) => false
             (tokens/valid-token-format? "") => false))

(facts "about token extraction from header"
       (fact "extracts token from Authorization header"
             (tokens/extract-token-from-header "Bearer srt_abc123") => "srt_abc123"
             (tokens/extract-token-from-header "Bearer srt_abc123.456") => "srt_abc123.456"
             (tokens/extract-token-from-header "srt_abc123") => nil
             (tokens/extract-token-from-header "Basic abc123") => nil
             (tokens/extract-token-from-header nil) => nil))

(facts "about scope validation"
       (fact "validates scopes correctly"
             (tokens/validate-scopes ["read" "write"]) => true
             (tokens/validate-scopes ["read" "invalid"]) => false)

       (fact "checks individual scopes"
             (tokens/has-scope? ["read" "write"] "read") => true
             (tokens/has-scope? ["read"] "write") => false)

       (fact "checks multiple scopes"
             (tokens/has-any-scope? ["read" "write"] ["write" "admin"]) => true
             (tokens/has-all-scopes? ["read"] ["read" "write"]) => false))

(facts "about token expiration"
       (fact "checks token expiration correctly"
             (let [past-date "2020-01-01T00:00:00Z"
                   future-date "2030-01-01T00:00:00Z"]
               (tokens/token-expired? past-date) => true
               (tokens/token-expired? future-date) => false
               (tokens/token-expired? nil) => nil)))

(facts "about token data preparation"
       (fact "prepares token data with defaults"
             (let [data (tokens/prepare-token-data
                         {:name "Test Token"
                          :description "Test description"
                          :scopes ["read" "write"]
                          :expires-in-days 30})]
               (:name data) => "Test Token"
               (:description data) => "Test description"
               (:scopes data) => ["read" "write"]
               (:expires-at data) => some?)))

(facts "about rate limiting"
       (fact "enforces rate limits"
             (tokens/can-create-token? 0) => true
             (tokens/can-create-token? 5) => true
             (tokens/can-create-token? 9) => true
             (tokens/can-create-token? 10) => false
             (tokens/can-create-token? 11) => false))

(facts "about ID-based token format"
       (fact "validates ID-based token format correctly"
             (let [token-with-id "srt_abc123.456"]
               (tokens/valid-token-format? token-with-id) => true
               (let [[token-part id-part] (str/split token-with-id #"\." 2)]
                 token-part => "srt_abc123"
                 id-part => "456"))))
