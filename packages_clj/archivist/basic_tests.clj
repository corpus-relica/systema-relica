(require 'midje.repl)

(println "Running basic test...")
(require 'io.relica.archivist.basic-test)
(midje.repl/check-facts 'io.relica.archivist.basic-test)

(System/exit 0)