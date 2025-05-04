(require 'midje.repl)

;; Load the required utilities for the response test
(require 'io.relica.archivist.test-helpers)

(println "Running basic test...")
(require 'io.relica.archivist.basic-test)
(midje.repl/check-facts 'io.relica.archivist.basic-test)

(println "Running response tests...")
(require 'io.relica.archivist.utils.response-test)
(midje.repl/check-facts 'io.relica.archivist.utils.response-test)

(println "Done!")