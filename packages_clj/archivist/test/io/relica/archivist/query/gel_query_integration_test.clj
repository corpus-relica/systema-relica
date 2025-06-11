(ns io.relica.archivist.query.gel-query-integration-test
  (:require [clojure.test :refer [deftest testing is use-fixtures]]
            [io.relica.archivist.query.gel-parser :as parser]
            [io.relica.archivist.query.gellish-to-cypher-converter :as g2c]
            [io.relica.archivist.query.query-service :as qexec]
            ;; [io.relica.archivist.query.result-aggregation :as ragg]
            [neo4j-clj.core :as neo4j]))

;; Mock Neo4j connection and results

(def test-connection nil)

(defn- mock-neo4j-result [query]
  ;; Return mock results based on the query
  (cond
    ;; Query for pump classification
    (re-find #"rel_type_uid = 5935.*uid = 40043" query)
    [{:var_1 {:uid 101 :name "Pump A"}}
     {:var_1 {:uid 102 :name "Pump B"}}]

    ;; Query for pump parts
    (re-find #"rel_type_uid = 1190" query)
    [{:var_1 {:uid 101 :name "Pump A"} :var_2 {:uid 201 :name "Impeller"}}
     {:var_1 {:uid 101 :name "Pump A"} :var_2 {:uid 202 :name "Shaft"}}
     {:var_1 {:uid 101 :name "Pump A"} :var_2 {:uid 203 :name "Casing"}}]

    ;; Query for bearings
    (re-find #"rel_type_uid = 5935.*uid = 40043.*bearing" query)
    [{:var_1 {:uid 210 :name "Bearing A"}}
     {:var_1 {:uid 211 :name "Bearing B"}}]

    ;; Query for parts that are also bearings
    (and (re-find #"rel_type_uid = 1190" query)
         (re-find #"rel_type_uid = 5935.*bearing" query))
    [{:var_1 {:uid 101 :name "Pump A"} :var_2 {:uid 210 :name "Bearing A"}}]

    ;; Default empty result
    :else
    []))

(defn with-mock-execution
  "Mock the execution function to avoid actual Neo4j calls"
  [f]
  (with-redefs [qexec/interpret-query-string (fn [_ gel-query]
                                               (let [cypher-query (g2c/process-gellish-query gel-query 1 50)]
                                                 (mock-neo4j-result cypher-query)))]
    (f)))

(use-fixtures :each with-mock-execution)

;; Integration tests for the complete pipeline

(deftest parse-and-generate-test
  (testing "Basic fact to Cypher conversion"
    (let [gel "101.Pump A > 1190.has as part > 201.Impeller"
          cypher (g2c/process-gellish-query gel 1 50)]
      (is (re-find #"MATCH \(e101:Entity\).*\(f0:Fact\).*\(e201:Entity\)" cypher))
      (is (re-find #"WHERE.*f0.rel_type_uid = 1190.*e201.uid = 201.*e101.uid = 101" cypher)))))

(deftest simple-query-test
  (testing "Simple query with one pattern"
    (let [gel "?1 > 5935.is classified as > 40043.pump"
          results (qexec/interpret-query-string gel)]
      (is (= 2 (count results)))
      (is (= 101 (get-in results [0 1 :uid])))
      (is (= "Pump A" (get-in results [0 1 :name])))
      (is (= 102 (get-in results [1 1 :uid]))))))

;; (deftest complex-query-test
;;   (testing "Complex query with multiple patterns"
;;     (let [gel "?1 > 1190.has as part > 2.?
;;                ?2.? > 5935.is classified as > 40043.bearing"
;;           results (ragg/process-multi-pattern-query test-connection gel)]
;;       (is (= 1 (count results)))
;;       (is (= "101 (Pump A)" (get results 0 1)))
;;       (is (= "210 (Bearing A)" (get results 0 2))))))

(deftest nested-structure-test
  (testing "Query with nested structure"
    (let [gel "?1 > 1190.has as part > (201.Impeller, 202.Shaft)"
          cypher (g2c/process-gellish-query gel 1 50)]
      ;; Should be expanded to multiple patterns
      (is (or (re-find #"(?s)MATCH.*MATCH" cypher)
              (re-find #"WHERE.*IN" cypher))))))

(deftest metadata-test
  (testing "Query with metadata"
    (let [gel "@INTENTION=question
               ?1 > 1190.has as part > 2.?"
          parsed (parser/parse gel)]
      (is (= :metadata (:type (first parsed))))
      (is (= "INTENTION" (:key (first parsed))))
      (is (= "question" (:value (first parsed)))))))

(deftest taxonomic-test
  (testing "Taxonomic query (lineage)"
    (let [gel "^40043.pump"
          parsed (parser/parse gel)]
      (println "Parsed lineage query:" parsed)
      (is (= :lineage (:type (first parsed))))
      (is (= 40043 (get-in (first parsed) [:entity :uid]))))))

;; (deftest result-formatting-test
;;   (testing "Result formatting and table creation"
;;     (let [bindings [{1 {:uid 101 :name "Pump A"} 2 {:uid 201 :name "Impeller"}}
;;                     {1 {:uid 102 :name "Pump B"} 2 {:uid 202 :name "Shaft"}}]
;;           formatted (ragg/format-results bindings)
;;           table (ragg/create-result-table formatted)]
;;       (is (= #{"?1" "?2"} (set (:columns table))))
;;       (is (= 2 (count (:rows table)))))))
