(ns io.relica.archivist.basic-test
  (:require [midje.sweet :refer :all]))

;; A very simple test to verify the test setup works
(facts "about basic testing"
  (fact "addition works"
    (+ 1 1) => 2)
  
  (fact "multiplication works"
    (* 2 3) => 6))