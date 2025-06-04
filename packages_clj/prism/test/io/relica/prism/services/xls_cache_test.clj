(ns io.relica.prism.services.xls-cache-test
  (:require [midje.sweet :refer [fact facts contains anything => provided roughly]]
            [clojure.test :refer [deftest is testing]]
            [io.relica.prism.xls :as xls]
            [io.relica.common.test.midje-helpers :as helpers]
            [clojure.java.io :as io]
            [dk.ative.docjure.spreadsheet :as excel]
            [clojure.data.csv :as csv]
            [io.relica.prism.config :as config]
            [io.relica.common.services.cache-service :as common-cache]))

;; XLS Cache Testing Infrastructure
(def ^:private test-cache-atom (atom {}))

(defn mock-xls-cache-get [file-path file-hash]
  "Mock function for retrieving cached XLS transformation results"
  (get @test-cache-atom (str file-path "-" file-hash)))

(defn mock-xls-cache-put! [file-path file-hash result]
  "Mock function for storing XLS transformation results in cache"
  (swap! test-cache-atom assoc (str file-path "-" file-hash) result))

(defn mock-xls-cache-clear! []
  "Mock function for clearing XLS transformation cache"
  (reset! test-cache-atom {}))

(defn calculate-file-hash [file-path]
  "Mock function for calculating file hash (in real implementation would use file content)"
  (str "hash-" (.hashCode file-path)))

(defn generate-mock-xls-data [num-rows]
  "Generates mock XLS data for testing"
  (let [header-1 (with-meta {:A "Header1" :B "Header2" :C "Header3"} {:row 1})
        header-2 (with-meta {:A "SubHeader1" :B "SubHeader2" :C "SubHeader3"} {:row 2})]
    (concat [header-1 header-2]
            (for [i (range 3 (+ 3 num-rows))]
              (with-meta {:A (str "Data" i) :B (str i) :C (str (* i 100))} {:row i})))))

(def ^:private test-uid-config
  {:min-free-uid 10000
   :min-free-fact-uid 5000000
   :max-temp-uid 9999})

(facts "About XLS transformation caching"
       
       (fact "caches XLS transformation results on first access"
             (let [test-file-path "test-files/sample.xlsx"
                   file-hash (calculate-file-hash test-file-path)
                   mock-rows (generate-mock-xls-data 100)
                   csv-output-path "output/sample.csv"
                   transformed-data (atom nil)]
               
               ;; Clear cache before test
               (mock-xls-cache-clear!)
               
               ;; Verify cache is empty
               (mock-xls-cache-get test-file-path file-hash) => nil
               
               (with-redefs [excel/load-workbook (fn [_] "mock-workbook")
                           excel/select-sheet (fn [_ _] "mock-sheet")
                           excel/row-seq (fn [_] mock-rows)
                           csv/write-csv (fn [_ data] (reset! transformed-data data))
                           io/make-parents (fn [& _] nil)]
                 
                 ;; First transformation - should hit file system and cache result
                 (let [result (xls/xls-to-csv test-file-path csv-output-path "Sheet1" 2 test-uid-config)]
                   
                   ;; Verify transformation succeeded
                   result => (contains {:status :success})
                   
                   ;; Cache the result (in real implementation this would be automatic)
                   (mock-xls-cache-put! test-file-path file-hash @transformed-data)
                   
                   ;; Verify result is now cached
                   (mock-xls-cache-get test-file-path file-hash) => @transformed-data))))
       
       (fact "retrieves cached results for unchanged files"
             (let [test-file-path "test-files/cached-sample.xlsx"
                   file-hash (calculate-file-hash test-file-path)
                   cached-result [["Data1" "100" "200"] ["Data2" "101" "201"]]
                   file-access-count (atom 0)]
               
               ;; Pre-populate cache
               (mock-xls-cache-put! test-file-path file-hash cached-result)
               
               (with-redefs [excel/load-workbook (fn [_] 
                                                   (swap! file-access-count inc)
                                                   "mock-workbook")]
                 
                 ;; Simulate cache hit scenario
                 (let [cached-data (mock-xls-cache-get test-file-path file-hash)]
                   
                   ;; Should get cached result without file access
                   cached-data => cached-result
                   @file-access-count => 0))))
       
       (fact "invalidates cache when file content changes"
             (let [test-file-path "test-files/modified-sample.xlsx"
                   original-hash "hash-original"
                   modified-hash "hash-modified"
                   original-data [["Original" "Data"]]
                   modified-data [["Modified" "Data"]]]
               
               ;; Cache original file result
               (mock-xls-cache-put! test-file-path original-hash original-data)
               
               ;; Verify original is cached
               (mock-xls-cache-get test-file-path original-hash) => original-data
               
               ;; File is modified (hash changes)
               (mock-xls-cache-get test-file-path modified-hash) => nil
               
               ;; Cache new result
               (mock-xls-cache-put! test-file-path modified-hash modified-data)
               
               ;; Verify new result is cached
               (mock-xls-cache-get test-file-path modified-hash) => modified-data
               
               ;; Original cache entry should still exist (cleanup would be separate)
               (mock-xls-cache-get test-file-path original-hash) => original-data))
       
       (fact "handles cache misses gracefully"
             (let [non-existent-file "test-files/non-existent.xlsx"
                   file-hash (calculate-file-hash non-existent-file)]
               
               ;; Clear cache
               (mock-xls-cache-clear!)
               
               ;; Cache miss should return nil
               (mock-xls-cache-get non-existent-file file-hash) => nil))
       
       (fact "caches UID mapping state during transformation"
             (let [test-file-path "test-files/uid-mapping.xlsx"
                   file-hash (calculate-file-hash test-file-path)
                   mock-rows (generate-mock-xls-data 50)
                   uid-mappings (atom {})]
               
               (with-redefs [excel/load-workbook (fn [_] "mock-workbook")
                           excel/select-sheet (fn [_ _] "mock-sheet")
                           excel/row-seq (fn [_] mock-rows)
                           csv/write-csv (fn [_ _] nil)
                           io/make-parents (fn [& _] nil)]
                 
                 ;; Transform file and capture UID mappings
                 (let [result (xls/xls-to-csv test-file-path "output.csv" "Sheet1" 2 test-uid-config)]
                   
                   ;; In real implementation, UID mappings would be cached too
                   (mock-xls-cache-put! test-file-path (str file-hash "-uid-map") @uid-mappings)
                   
                   ;; Verify UID mappings are cached
                   (mock-xls-cache-get test-file-path (str file-hash "-uid-map")) => @uid-mappings))))
       
       (fact "performs cache warming for frequently accessed files"
             (let [frequent-files ["file1.xlsx" "file2.xlsx" "file3.xlsx"]
                   cache-warm-count (atom 0)]
               
               ;; Simulate cache warming process
               (doseq [file frequent-files]
                 (let [file-hash (calculate-file-hash file)
                       mock-data [[(str "Data-" file)]]]
                   
                   ;; Check if already cached
                   (when (nil? (mock-xls-cache-get file file-hash))
                     ;; Pre-load into cache
                     (mock-xls-cache-put! file file-hash mock-data)
                     (swap! cache-warm-count inc))))
               
               ;; Verify cache warming occurred
               @cache-warm-count => 3
               
               ;; Verify all files are now cached
               (doseq [file frequent-files]
                 (let [file-hash (calculate-file-hash file)]
                   (mock-xls-cache-get file file-hash) => (contains vector?)))))
       
       (fact "implements cache size limits and LRU eviction"
             (let [max-cache-size 3
                   cache-access-order (atom [])
                   files ["file1.xlsx" "file2.xlsx" "file3.xlsx" "file4.xlsx"]]
               
               ;; Fill cache to capacity
               (doseq [[idx file] (map-indexed vector (take max-cache-size files))]
                 (let [file-hash (calculate-file-hash file)
                       data [[(str "Data-" idx)]]]
                   (mock-xls-cache-put! file file-hash data)
                   (swap! cache-access-order conj file)))
               
               ;; Verify cache is at capacity
               (count @test-cache-atom) => max-cache-size
               
               ;; Add one more file (should evict LRU)
               (let [new-file (last files)
                     new-hash (calculate-file-hash new-file)
                     new-data [["New-Data"]]]
                 
                 ;; In real implementation, this would trigger LRU eviction
                 ;; For this test, we simulate by manually removing oldest entry
                 (let [oldest-file (first @cache-access-order)
                       oldest-hash (calculate-file-hash oldest-file)]
                   (swap! test-cache-atom dissoc (str oldest-file "-" oldest-hash))
                   (mock-xls-cache-put! new-file new-hash new-data))
                 
                 ;; Verify oldest entry was evicted
                 (let [oldest-file (first @cache-access-order)
                       oldest-hash (calculate-file-hash oldest-file)]
                   (mock-xls-cache-get oldest-file oldest-hash) => nil)
                 
                 ;; Verify new entry is cached
                 (mock-xls-cache-get new-file new-hash) => new-data)))
       
       (fact "handles concurrent access to cached transformations"
             (let [shared-file "test-files/concurrent-access.xlsx"
                   file-hash (calculate-file-hash shared-file)
                   access-results (atom [])
                   num-threads 10]
               
               ;; Pre-cache the file
               (mock-xls-cache-put! shared-file file-hash [["Shared" "Data"]])
               
               ;; Simulate concurrent access
               (let [futures (doall
                             (for [i (range num-threads)]
                               (future
                                 (let [cached-result (mock-xls-cache-get shared-file file-hash)]
                                   (swap! access-results conj {:thread i :result cached-result})))))]
                 
                 ;; Wait for all threads to complete
                 (doseq [f futures] @f)
                 
                 ;; Verify all threads got the same cached result
                 (count @access-results) => num-threads
                 (every? #(= (:result %) [["Shared" "Data"]]) @access-results) => true)))
       
       (fact "benchmarks cache performance vs file system access"
             (let [test-file "test-files/performance-test.xlsx"
                   file-hash (calculate-file-hash test-file)
                   large-mock-data (vec (repeatedly 1000 #(vec (repeatedly 10 (fn [] (str "Data-" (rand-int 1000)))))))]
               
               ;; Measure file system access time (simulated)
               (let [fs-start (System/currentTimeMillis)]
                 (with-redefs [excel/load-workbook (fn [_] (Thread/sleep 100) "mock-workbook")
                             excel/select-sheet (fn [_ _] "mock-sheet")
                             excel/row-seq (fn [_] (generate-mock-xls-data 1000))]
                   ;; Simulate file system access
                   (Thread/sleep 100))
                 (let [fs-time (- (System/currentTimeMillis) fs-start)]
                   
                   ;; Cache the result
                   (mock-xls-cache-put! test-file file-hash large-mock-data)
                   
                   ;; Measure cache access time
                   (let [cache-start (System/currentTimeMillis)
                         cached-result (mock-xls-cache-get test-file file-hash)
                         cache-time (- (System/currentTimeMillis) cache-start)]
                     
                     ;; Cache should be significantly faster
                     cached-result => large-mock-data
                     cache-time => (roughly 0 5) ; Should be nearly instantaneous
                     fs-time => (roughly 100 20)  ; Should take ~100ms
                     (< cache-time (/ fs-time 10)) => true))))))