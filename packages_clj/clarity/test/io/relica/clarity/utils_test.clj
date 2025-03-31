(ns io.relica.clarity.utils-test
  (:require [clojure.test :refer [deftest testing is]]
            [io.relica.clarity.utils :as utils]))

(deftest remove-empty-arrays-test
  (testing "Removing empty arrays from maps"
    (let [input {:a [] :b [1 2 3] :c {:d [] :e [4 5 6]}}
          expected {:b [1 2 3] :c {:e [4 5 6]}}
          result (utils/remove-empty-arrays input)]
      (is (= expected result))))
  
  (testing "Removing empty arrays from nested structures"
    (let [input {:a [] 
                 :b [1 2 3] 
                 :c {:d [] :e [4 5 6] :f {:g []}}
                 :h {:i [] :j []}}
          expected {:b [1 2 3] 
                    :c {:e [4 5 6]}}
          result (utils/remove-empty-arrays input)]
      (is (= expected result))))
  
  (testing "Handling non-map/non-vector values"
    (let [input {:a [] :b "string" :c 42 :d true}
          expected {:b "string" :c 42 :d true}
          result (utils/remove-empty-arrays input)]
      (is (= expected result))))
  
  (testing "Handling nil values"
    (let [input {:a [] :b nil :c {:d []}}
          expected {:b nil}
          result (utils/remove-empty-arrays input)]
      (is (= expected result))))
  
  (testing "Handling vectors with empty arrays"
    (let [input [[] [1 2 3] [] {:a []}]
          expected [[1 2 3]]
          result (utils/remove-empty-arrays input)]
      (is (= expected result))))
  
  (testing "Preserving top-level model fields"
    (let [input {:uid "123"
                 :name "Test Model"
                 :category "physical object"
                 :definitive-kinds-of-qualitative-aspects []
                 :definitive-kinds-of-quantitative-aspects []
                 :definitive-kinds-of-intrinsic-aspects []
                 :possible-kinds-of-roles [[]]
                 :facts [{:fact_uid "456" :lh_object_uid "123" :rh_object_uid "789"}]}
          expected {:uid "123"
                    :name "Test Model"
                    :category "physical object"
                    :definitive-kinds-of-qualitative-aspects []
                    :definitive-kinds-of-quantitative-aspects []
                    :definitive-kinds-of-intrinsic-aspects []
                    :possible-kinds-of-roles []
                    :facts [{:fact_uid "456" :lh_object_uid "123" :rh_object_uid "789"}]}
          result (utils/clean-model input)]
      (is (= expected result))))
  
  (testing "Removing empty arrays from nested structures while preserving top-level fields"
    (let [input {:uid "123"
                 :definitive-kinds-of-qualitative-aspects [[] [1 2 3] []]
                 :possible-kinds-of-roles [[] [{:role "test"} {}] []]}
          expected {:uid "123"
                    :definitive-kinds-of-qualitative-aspects [[1 2 3]]
                    :possible-kinds-of-roles [[{:role "test"} {}]]}
          result (utils/remove-empty-arrays input)]
      (is (= expected result)))))

(deftest clean-model-test
  (testing "Clean model handles exceptions gracefully"
    (let [model {:a [] :b [1 2 3]}]
      ;; Should return the cleaned model
      (is (= {:b [1 2 3]} (utils/clean-model model)))
      
      ;; Should return the original model if an exception occurs
      (with-redefs [utils/remove-empty-arrays (fn [_ _] (throw (Exception. "Test exception")))]
        (is (= model (utils/clean-model model)))))))