(require 'io.relica.archivist.ws-interface-test)

;; Parse command line args
(let [args *command-line-args*
      host (or (first args) "localhost")
      port (if (second args) 
             (Integer/parseInt (second args)) 
             3000)]
  
  (println "Running WebSocket interface tests against" host ":" port)
  
  ;; Run the tests
  ((resolve 'io.relica.archivist.ws-interface-test/run-interface-tests) host port)
  
  (println "Tests completed."))