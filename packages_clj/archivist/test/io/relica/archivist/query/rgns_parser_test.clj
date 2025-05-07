(ns io.relica.archivist.query.rgns-parser-test
  (:require [clojure.test :refer [deftest testing is]]
            [io.relica.archivist.query.rgns-parser :as parser]))

(deftest parse-basic-fact-test
  (testing "Parsing basic fact structure"
    (let [input "101.Pump A > 1190.has as part > 201.Impeller"
          result (parser/parse input)]
      (is (= 1 (count result)))
      (let [statement (first result)]
        (is (= :statement (:type statement)))
        (is (= {:type :regular :uid 101 :name "Pump A"} (:left statement)))
        (is (= {:type :regular :uid 1190 :name "has as part"} (:relation statement)))
        (is (= {:type :regular :uid 201 :name "Impeller"} (:right statement)))))))

(deftest parse-fact-with-roles-test
  (testing "Parsing fact with roles"
    (let [input "101.Pump A : 4732.whole > 1190.has as part : 4731.part > 201.Impeller"
          result (parser/parse input)]
      (is (= 1 (count result)))
      (let [statement (first result)]
        (is (= :statement (:type statement)))
        (is (= {:type :regular :uid 101 :name "Pump A" :role {:type :regular :uid 4732 :name "whole"}} 
               (:left statement)))
        (is (= {:type :regular :uid 1190 :name "has as part" :role {:type :regular :uid 4731 :name "part"}} 
               (:relation statement)))
        (is (= {:type :regular :uid 201 :name "Impeller"} (:right statement)))))))

(deftest parse-fact-with-metadata-test
  (testing "Parsing fact with metadata"
    (let [input "@INTENTION=statement\n@VALIDITY=design_phase\n101.Pump A > 1726.rotation speed > 4325.3000 rpm"
          result (parser/parse input)]
      (is (= 3 (count result)))
      (is (= {:type :metadata :key "INTENTION" :value "statement"} (first result)))
      (is (= {:type :metadata :key "VALIDITY" :value "design_phase"} (second result)))
      (let [statement (nth result 2)]
        (is (= :statement (:type statement)))
        (is (= {:type :regular :uid 101 :name "Pump A"} (:left statement)))
        (is (= {:type :regular :uid 1726 :name "rotation speed"} (:relation statement)))
        (is (= {:type :regular :uid 4325 :name "3000 rpm"} (:right statement)))))))

(deftest parse-specific-query-test
  (testing "Parsing specific query"
    (let [input "?101.Pump A > 1190.has as part > ?"
          result (parser/parse input)]
      (is (= 1 (count result)))
      (let [statement (first result)]
        (is (= :statement (:type statement)))
        (is (= {:type :placeholder :uid 101 :name "Pump A"} (:left statement)))
        (is (= {:type :regular :uid 1190 :name "has as part"} (:relation statement)))
        (is (= {:type :placeholder} (:right statement)))))))

(deftest parse-what-query-test
  (testing "Parsing 'what' query"
    (let [input "* > 4658.is related to > 101.Pump A"
          result (parser/parse input)]
      (is (= 1 (count result)))
      (let [statement (first result)]
        (is (= :statement (:type statement)))
        (is (= {:type :what-placeholder} (:left statement)))
        (is (= {:type :regular :uid 4658 :name "is related to"} (:relation statement)))
        (is (= {:type :regular :uid 101 :name "Pump A"} (:right statement)))))))

(deftest parse-nested-structures-test
  (testing "Parsing nested structures"
    (let [input "101.Pump A > 1190.has as part > (201.Impeller, 202.Shaft, 203.Casing)"
          result (parser/parse input)]
      (is (= 1 (count result)))
      (let [statement (first result)]
        (is (= :statement (:type statement)))
        (is (= {:type :regular :uid 101 :name "Pump A"} (:left statement)))
        (is (= {:type :regular :uid 1190 :name "has as part"} (:relation statement)))
        (is (= :nested (:type (:right statement))))
        (is (= 3 (count (:entities (:right statement)))))
        (is (= {:type :regular :uid 201 :name "Impeller"} 
               (first (:entities (:right statement)))))
        (is (= {:type :regular :uid 202 :name "Shaft"} 
               (second (:entities (:right statement)))))
        (is (= {:type :regular :uid 203 :name "Casing"} 
               (nth (:entities (:right statement)) 2)))))))

(deftest parse-quoted-names-test
  (testing "Parsing quoted names with special characters"
    (let [input "101.\"Pump A (2023 model)\" > 1190.has as part > 201.Impeller"
          result (parser/parse input)]
      (is (= 1 (count result)))
      (let [statement (first result)]
        (is (= :statement (:type statement)))
        (is (= {:type :regular :uid 101 :name "Pump A (2023 model)"} (:left statement)))
        (is (= {:type :regular :uid 1190 :name "has as part"} (:relation statement)))
        (is (= {:type :regular :uid 201 :name "Impeller"} (:right statement)))))))

(deftest parse-multiple-facts-test
  (testing "Parsing multiple facts"
    (let [input "101.Pump A > 5935.is classified as > 40043.pump\n101.Pump A > 1190.has as part > 201.Impeller"
          result (parser/parse input)]
      (is (= 2 (count result)))
      (let [statement1 (first result)
            statement2 (second result)]
        (is (= :statement (:type statement1)))
        (is (= {:type :regular :uid 101 :name "Pump A"} (:left statement1)))
        (is (= {:type :regular :uid 5935 :name "is classified as"} (:relation statement1)))
        (is (= {:type :regular :uid 40043 :name "pump"} (:right statement1)))
        
        (is (= :statement (:type statement2)))
        (is (= {:type :regular :uid 101 :name "Pump A"} (:left statement2)))
        (is (= {:type :regular :uid 1190 :name "has as part"} (:relation statement2)))
        (is (= {:type :regular :uid 201 :name "Impeller"} (:right statement2)))))))