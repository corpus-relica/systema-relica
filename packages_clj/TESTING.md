# Testing in Relica Clojure Modules

This document describes the standardized testing approach used across all Relica Clojure modules.

## Testing Framework

All Clojure modules in Relica use [Midje](https://github.com/marick/Midje) as the testing framework. Midje provides a more expressive and readable syntax for tests compared to clojure.test, and includes features like:

- Facts and checkers for more readable assertions
- Tabular tests for data-driven testing
- Prerequisites for mocking and stubbing
- Better error messages and test output

## Directory Structure

Each module follows a standard directory structure for tests:

```
packages_clj/
├── module-name/
│   ├── src/
│   │   └── io/relica/module-name/
│   │       └── ... (source files)
│   └── test/
│       └── io/relica/module-name/
│           ├── test_helpers.clj (module-specific test helpers)
│           └── ... (test files)
```

## Common Test Utilities

Common test utilities are provided in the `common` module:

- `io.relica.common.test.midje-helpers`: Core testing utilities shared across all modules
- `io.relica.common.test.test_template`: Template for creating new tests

Each module also has its own `test_helpers.clj` file that re-exports the common helpers and adds module-specific helpers.

## Running Tests

### From the REPL

The easiest way to run tests during development is from the REPL:

1. Start a REPL with the `:midje` alias:

```bash
cd packages_clj/module-name
clojure -M:midje
```

2. Load and run tests:

```clojure
(use 'midje.repl)
(autotest) ; Run all tests and watch for changes
```

Or run specific namespaces:

```clojure
(load-facts 'io.relica.module-name.some-namespace-test)
```

### From the Command Line

To run tests from the command line:

```bash
cd packages_clj/module-name
clojure -M:midje
```

This will start the Midje REPL. You can then run:

```clojure
(midje.repl/load-facts)
```

To run all tests in the project.

## Test Naming Conventions

- Test files should be named with a `_test` suffix (e.g., `ws_handlers_test.clj`)
- Test namespaces should match the source namespace with a `-test` suffix (e.g., `io.relica.aperture.io.ws-handlers-test`)
- Facts should be descriptive and follow the pattern "About [component/function]" or "[component/function] should [behavior]"

## Writing Tests

### Basic Fact

```clojure
(fact "Addition works correctly"
  (+ 1 1) => 2)
```

### Facts with Checkers

```clojure
(fact "Maps contain expected keys"
  {:name "Test" :value 42} => (contains {:name "Test"})
  [1 2 3 4] => (has every? number?)
  "Hello, World!" => #"Hello")
```

### Tabular Tests

```clojure
(tabular "Arithmetic operations"
  (fact "Testing basic arithmetic"
    (?operation ?a ?b) => ?result)

  ?operation  ?a  ?b  ?result
  +           1   2   3
  -           5   2   3
  *           2   3   6
  /           6   2   3)
```

### Prerequisites (Mocking)

```clojure
(fact "Testing with prerequisites"
  (let [test-fn (fn [x] (inc x))]
    (test-fn 1) => 2
    (provided
      (test-fn 1) => 2)))
```

### Async Testing

```clojure
(fact "Testing async operations"
  (let [result-chan (go
                      (<! (timeout 100))
                      42)]
    (helpers/wait-for #(= 42 (deref result-chan 10 nil))) => 42))
```

## WebSocket Testing

For testing WebSocket handlers, use the provided helpers:

```clojure
(fact "Testing a WebSocket handler"
  (let [reply-capture (helpers/capture-reply)
        msg (helpers/mock-ws-message :test/message {:data "test"} reply-capture)]
    (ws-server/handle-ws-message msg)
    (reply-capture) => (contains {:success true})))
```

## Database Testing

For testing database operations, use the provided helpers:

```clojure
(fact "Testing database operations"
  (helpers/with-test-db mock-db
    ;; Test database operations
    (db-operation mock-db) => expected-result))
```

## HTTP Testing

For testing HTTP handlers, use the provided helpers:

```clojure
(fact "Testing HTTP requests"
  (let [mock-req (helpers/mock-request :get "/api/test")
        response (handler-fn mock-req)]
    response => (contains {:status 200})))
```

## Troubleshooting

### Common Issues

#### LazySeq Error When Running Tests

If you encounter an error like this:

```
LOAD FAILURE for clojure.lang.LazySeqGit commit '42238631'
java.io.FileNotFoundException: Could not locate clojure/lang/LazySeq@42238631__init.class, clojure/lang/LazySeq@42238631.clj or clojure/lang/LazySeq@42238631.cljc on classpath.
```

This is usually caused by an issue with how namespaces are loaded. Make sure:

1. Your test namespaces end with `-test`
2. You're explicitly requiring Midje symbols in your namespace declaration:
   ```clojure
   (:require [midje.sweet :refer [fact facts contains anything]])
   ```
3. You're not using nested `facts` blocks (use individual `fact` statements instead)

#### Unresolved Symbol Errors in VS Code

If you see errors like "Unresolved symbol: =>" or "Unresolved symbol: fact" in VS Code, don't worry. These are just warnings from the editor's static analysis and won't affect the actual test execution. The symbols will be resolved when the tests are run with Midje.

### Running Tests from the Command Line

To run all tests in a module:

```bash
cd packages_clj/module-name
clojure -M:test
```

To run tests interactively:

```bash
cd packages_clj/module-name
clojure -M:midje
```

Then in the REPL:

```clojure
(use 'midje.repl)
(autotest) ; Run all tests and watch for changes
```
