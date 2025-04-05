(ns io.relica.prism.xls-test
  (:require [clojure.test :refer [deftest is testing]]
            [io.relica.prism.xls :as xls]
            [clojure.java.io :as io]
            [dk.ative.docjure.spreadsheet :as excel]
            [clojure.data.csv :as csv]
            [io.relica.prism.config :as config]))

;; Define a helper function or configuration for tests if needed
(def ^:private test-uid-config
  {:min-free-uid 10000
   :min-free-fact-uid 5000000
   :max-temp-uid 9999
   ; :uid-columns used internally in resolve-temp-uids now: [1 2 15 60]
   })

(deftest resolve-temp-uids-test
  (testing "Resolution of temporary UIDs to permanent ones in a row vector"
    (let [uid-map {:mappings {} :next-free-uid 10000 :next-free-fact-uid 5000000}
          ;       0    1   2    3      4    ... 15   ... 60
          row-vec ["X" "1" "2" "Value" "Y"   (repeat 10 nil) "3" (repeat 44 nil) "4" ] ; Indices 1, 2, 15, 60 have temp UIDs
          expected-row-vec ["X" 5000000 10000 "Value" "Y" (repeat 10 nil) 10001 (repeat 44 nil) 10002 ]
          expected-map {:mappings {1 5000000, 2 10000, 3 10001, 4 10002}
                        :next-free-uid 10003
                        :next-free-fact-uid 5000001}
          [resolved-map resolved-row] (xls/resolve-temp-uids uid-map row-vec test-uid-config)]
        (is (= expected-row-vec resolved-row) "Row vector should have temp UIDs replaced")
        (is (= expected-map resolved-map) "UID map should be updated correctly"))))
  
  (testing "Handling existing permanent UIDs and non-UID values"
    (let [uid-map {:mappings {} :next-free-uid 10000 :next-free-fact-uid 5000000}
          ;       0    1      2   3         4           ... 15  ... 60
          row-vec ["X" 5000001 "5" "Another" "Some Text" (repeat 10 nil) 10005 (repeat 44 nil) "6"]
          expected-row-vec ["X" 5000001 10000 "Another" "Some Text" (repeat 10 nil) 10005 (repeat 44 nil) 10001 ]
          expected-map {:mappings {5 10000, 6 10001}
                        :next-free-uid 10002
                        :next-free-fact-uid 5000001 ; Incremented because index 1 (5000001) wasn't temp
                       }
          [resolved-map resolved-row] (xls/resolve-temp-uids uid-map row-vec test-uid-config)]
        (is (= expected-row-vec resolved-row) "Row should handle permanent and non-UIDs")
        (is (= expected-map resolved-map) "UID map should be updated for new temp UIDs")))
 
 (deftest normalize-value-test
   (testing "Normalization of different cell value types"
    (is (= "123" (xls/normalize-value 0 123)) "Numbers should be stringified") ; Added index 0
    (is (= "HelloWorld" (xls/normalize-value 0 " Hello,World ")) "Strings should have commas removed") ; Added index 0, updated expectation
    (is (= nil (xls/normalize-value 0 nil)) "Nil should remain nil") ; Added index 0, updated expectation
    (is (= true (xls/normalize-value 0 true)) "Booleans should remain booleans") ; Added index 0, updated expectation
    (let [d (java.util.Date.)]
      (is (identical? d (xls/normalize-value 0 d))) "Dates should remain Dates") ; Added index 0, updated expectation
    (is (= "MultipleSpaces" (xls/normalize-value 0 "Multiple,   Spaces")) "Strings should have commas removed") ; Added index 0, updated expectation
    (is (= "" (xls/normalize-value 0 " ,, ")) "Comma-only string becomes empty string"))) ; Added index 0, updated expectation
 
(deftest process-row-test
  (testing "Processing a valid data row"
    (let [uid-map-atom (atom {:mappings {} :next-free-uid 10000 :next-free-fact-uid 5000000})
          ; Mock row-data as returned by docjure row-seq (map with :row meta)
          row-data (with-meta {:A "Col0" :B "1" :C "2" :D "Value" :P "3" :BA "4"} {:row 3})
          header-rows-to-skip 2
          ; Expected output is a vector after normalization & UID resolution
          expected-processed-row ["Col0" 5000000 10000 "Value" (repeat 11 nil) 10001 (repeat 36 nil) 10002]
          expected-map-state {:mappings {1 5000000, 2 10000, 3 10001, 4 10002}
                           :next-free-uid 10003
                           :next-free-fact-uid 5000001}]
      (let [processed-row (xls/process-row uid-map-atom row-data test-uid-config header-rows-to-skip)]
        ; Pad expected row to match implicit size from uid-config indices (max index 60)
        (let [padded-expected (vec (take 61 (concat expected-processed-row (repeat nil))))]
          (is (= padded-expected processed-row) "Row should be normalized, resolved into a vector"))
        (is (= expected-map-state @uid-map-atom) "UID atom state should be updated"))))
  
  (testing "Skipping header rows"
    (let [uid-map-atom (atom {:mappings {} :next-free-uid 10000 :next-free-fact-uid 5000000})
          row-data (with-meta {:A "Header1" :B "Header2"} {:row 1})
          header-rows-to-skip 2]
      (is (nil? (xls/process-row uid-map-atom row-data test-uid-config header-rows-to-skip)) "Header row 1 should be skipped"))
    (let [uid-map-atom (atom {:mappings {} :next-free-uid 10000 :next-free-fact-uid 5000000})
          row-data (with-meta {:A "Header1" :B "Header2"} {:row 2})
          header-rows-to-skip 2]
      (is (nil? (xls/process-row uid-map-atom row-data test-uid-config header-rows-to-skip)) "Header row 2 should be skipped")))
  
  (testing "Skipping blank rows"
    (let [uid-map-atom (atom {:mappings {} :next-free-uid 10000 :next-free-fact-uid 5000000})
          row-data (with-meta {:A nil :B " " :C "\t"} {:row 3})
          header-rows-to-skip 2]
      (is (nil? (xls/process-row uid-map-atom row-data test-uid-config header-rows-to-skip)) "Blank row should be skipped"))))
 
(deftest xls-to-csv-test
  (testing "Conversion from XLS to CSV with UID resolution (mocked IO)"
    (let [test-xls-path "dummy/path/sample.xlsx"
          test-csv-path "dummy/output/sample.csv"
          mock-row-1 (with-meta {:A "H1" :B "H2"} {:row 1})
          mock-row-2 (with-meta {:A "H1" :B "H2"} {:row 2})
          mock-row-3 (with-meta {:A "Data1" :B "1" :C "2" :P "3"} {:row 3}) ; Temp UIDs at indices 1,2,15
          mock-row-4 (with-meta {:A "Data2" :B 5000005 :C "5" :P "6"} {:row 4}) ; Permanent fact, Temp UIDs
          mock-rows [mock-row-1 mock-row-2 mock-row-3 mock-row-4]
          expected-csv-output [["Data1" 5000000 10000 (repeat 12 nil) 10001]
                               ["Data2" 5000005 10002 (repeat 12 nil) 10003]]
          written-csv-data (atom [])]
      (with-redefs [
                    excel/load-workbook (fn [_path] "mock-workbook")
                    excel/select-sheet (fn [_name _workbook] "mock-sheet")
                    excel/row-seq (fn [_sheet] mock-rows)
                    csv/write-csv (fn [_writer data] (reset! written-csv-data data)) ; Removed unused writer binding
                    io/make-parents (fn [& _args] nil) ; Removed unused args binding
                    ] 
        (let [result (xls/xls-to-csv test-xls-path test-csv-path "Sheet1" 2 test-uid-config)] ; Header skip = 2
          (is (= :success (:status result)) "Conversion should succeed")
          (is (= test-csv-path (:csv-path result)) "Result should contain correct CSV path")
          ;; Pad expected rows to match implicit size from uid-config indices
          (let [pad #(vec (take 61 (concat % (repeat nil))))
                padded-expected (mapv pad expected-csv-output)]
            (is (= padded-expected @written-csv-data) "CSV output should be correctly processed and resolved"))))))) ; Fixed let usage
 
(deftest process-seed-directory-test
  (testing "Finding and processing XLS files in a directory (mocked IO)"
    (let [seed-dir "dummy/seed/dir"
          csv-dir "dummy/csv/output"
          uid-ranges test-uid-config ; Store config for mock
          mock-xls-file1 (proxy [java.io.File] ["dummy/seed/dir/file1.xlsx"]
                           (getName [] "file1.xlsx")
                           (getAbsolutePath [] "dummy/seed/dir/file1.xlsx")
                           (isFile [] true)
                           (isDirectory [] false))
          mock-xls-file2 (proxy [java.io.File] ["dummy/seed/dir/file2.xls"]
                           (getName [] "file2.xls")
                           (getAbsolutePath [] "dummy/seed/dir/file2.xls")
                           (isFile [] true)
                           (isDirectory [] false))
          mock-dir (proxy [java.io.File] ["dummy/seed/dir"]
                     (listFiles [] (into-array java.io.File [mock-xls-file1 mock-xls-file2]))
                     (isDirectory [] true)
                     (isFile [] false))
          processed-files (atom [])]
      (with-redefs [
                    config/seed-xls-dir (fn [] seed-dir)
                    config/csv-output-dir (fn [] csv-dir)
                    config/uid-ranges (fn [] uid-ranges)
                    io/file (fn [path]
                              (if (= path seed-dir) mock-dir
                                  (throw (Exception. (str "Unexpected path in io/file mock: " path)))))
                    xls/xls-to-csv (fn [xls-path csv-path sheet-name skip cfg]
                                     (swap! processed-files conj xls-path)
                                     (is (= "0" sheet-name))
                                     (is (= 2 skip))
                                     (is (= uid-ranges cfg))
                                     {:status :success :csv-path csv-path})
                    ]
        (let [result-paths (xls/process-seed-directory)] ; Takes no args now
          (is (= 2 (count result-paths)) "Should find and process 2 XLS files")
          (is (vector? result-paths) "Result should be a vector")
          (is (.contains result-paths "dummy/csv/output/file1.csv"))
          (is (.contains result-paths "dummy/csv/output/file2.csv"))
          (is (= ["dummy/seed/dir/file1.xlsx" "dummy/seed/dir/file2.xls"] (sort @processed-files)) "xls-to-csv should be called for the correct files"))))))
 
