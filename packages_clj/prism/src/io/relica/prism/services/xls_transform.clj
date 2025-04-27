(ns io.relica.prism.services.xls-transform
  (:require [dk.ative.docjure.spreadsheet :as excel]
            [clojure.data.csv :as csv]
            [clojure.java.io :as io]
            [io.relica.prism.config :as config]
            [taoensso.timbre :as log]
            [clojure.string :as str])
  (:import [java.util Date]
           [java.time LocalDate ZoneId]
           [java.time.format DateTimeFormatter]
           [org.apache.poi.ss.usermodel DateUtil CellType WorkbookFactory]
           [java.io FileInputStream]))

;; --- Configuration ---

(def ^:private date-formatter (DateTimeFormatter/ofPattern "yyyy-MM-dd"))

;; Default configuration, matching TypeScript implementation
(def default-config
  {:skip-rows 3 ; Gellish: Title, Col IDs, Col Names
   :remove-empty-rows? true
   :date-col-ids ["9" "10"] ; Date columns from TypeScript code
   :uid-cols {"2" :lh-obj
              "60" :rel-type
              "15" :rh-obj
              "1" :fact}
   :uid-ranges {:min-free-uid 1000000000
                :min-free-fact-uid 2000000000
                :max-temp-uid 1000}
   :header-row-index 1 ; 0-based index of the row containing column IDs
  })

;; --- Helper Functions ---

(defn- format-java-date
  "Formats a java.util.Date object to yyyy-MM-dd string"
  [^Date date]
  (if date
    (-> date
        .toInstant
        (.atZone (ZoneId/systemDefault))
        .toLocalDate
        (.format date-formatter))
    ""))

(defn- cell-value->str
  "Extract cell value as string, properly handling different types"
  [cell]
  (if (nil? cell)
    ""
    (let [value (excel/read-cell cell)]
      (cond
        ;; Handle date cells
        (instance? Date value)
        (format-java-date value)
        
        ;; Handle numeric cells - format integers without .0
        (and (number? value) (== value (long value)))
        (str (long value))

        ;; (= (.getCellType cell) org.apache.poi.ss.usermodel.CellType/FORMULA)
        (= :VALUE value)
        (try
          (let [cached-type (.getCachedFormulaResultType cell)]
      ;; (pp/pprint "~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
      ;; (pp/pprint value)
      ;; (pp/pprint (excel/read-cell-value cell))
      ;; (pp/pprint cell)
      ;; (pp/pprint cached-type)
            (cond
              (= cached-type org.apache.poi.ss.usermodel.CellType/NUMERIC)
              (do
                ;; (pp/pprint "Numeric formula result:")
                ;; (pp/pprint (.getNumericCellValue cell))
                (let [num-val (.getNumericCellValue cell)]
                  (if (== num-val (long num-val))
                    (str (long num-val))  ;; Convert to long first to remove decimal for whole numbers
                    (str num-val))))

              (= cached-type org.apache.poi.ss.usermodel.CellType/STRING)
              (do
                ;; (pp/pprint "String formula result:")
                ;; (pp/pprint (.getNumericCellValue cell))
                (.getStringCellValue cell))

              (= cached-type org.apache.poi.ss.usermodel.CellType/BOOLEAN)
              (.getBooleanCellValue cell)

              ;; Default case
              :else
              ""))
          (catch Exception e
            (println "Error evaluating formula cell:" (.getMessage e))
            (.setCellValue cell "")))

        ;; Everything else, just convert to string
        :else (str value)))))

(defn- is-row-empty?
  "Check if a row is empty (all cells blank)"
  [row]
  (every? str/blank? row))

;; --- Core XLS Processing ---

(defn- extract-worksheet-data
  "Extract data from worksheet into Clojure vectors"
  [sheet {:keys [header-row-index skip-rows remove-empty-rows?]}]
  (log/info "Extracting worksheet data")
  
  ;; Extract header row directly from sheet
  (let [header-row (.getRow sheet header-row-index)
        headers (when header-row
                 (let [last-cell-num (.getLastCellNum header-row)]
                   (mapv (fn [j]
                           (let [cell (.getCell header-row j)]
                             (cell-value->str cell)))
                         (range last-cell-num))))
        
        ;; Extract data rows directly from sheet
        last-row-num (.getLastRowNum sheet)
        all-rows (for [i (range (+ skip-rows 1) (inc last-row-num))
                       :let [row (.getRow sheet i)]
                       :when row]
                   (let [last-cell-num (if row (.getLastCellNum row) 0)]
                     (mapv (fn [j]
                             (let [cell (when (and row (< j last-cell-num))
                                          (.getCell row j))]
                               (cell-value->str cell)))
                           (range (max (if headers (count headers) 0)
                                       (if row last-cell-num 0))))))
        
        ;; Apply filtering if needed
        rows (if remove-empty-rows?
               (into [] (remove is-row-empty?) all-rows)
               (vec all-rows))]
    
    {:headers headers
     :rows rows}))

(defn- resolve-temp-uids
  "Resolve temporary UIDs in data rows"
  [rows headers {:keys [uid-cols uid-ranges]}]
  (log/info "Resolving temporary UIDs")
  
  (let [{:keys [min-free-uid min-free-fact-uid max-temp-uid]} uid-ranges
        
        ;; Find indices for UID columns
        header-indices (into {} (map-indexed (fn [idx val] [val idx]) headers))
        lh-obj-idx (get header-indices "2")
        rel-type-idx (get header-indices "60")
        rh-obj-idx (get header-indices "15")
        fact-idx (get header-indices "1")]

    (println "HEADER INDICES" header-indices)
    (println "UID CONFIG" uid-cols)
    (println "UID RANGES" uid-ranges)

    ;; Process each row to resolve UIDs
    (mapv (fn [row]
            (let [process-uid (fn [r idx min-val]
                               (if-let [cell-val (get r idx)]
                                 (if (and (re-matches #"\d+" cell-val)
                                          (< (Long/parseLong cell-val) max-temp-uid))
                                   (assoc r idx (str (+ (Long/parseLong cell-val) min-val)))
                                   r)
                                 r))]
              (-> row
                   (process-uid lh-obj-idx min-free-uid)
                   (process-uid rel-type-idx min-free-uid)
                   (process-uid rh-obj-idx min-free-uid)
                   (process-uid fact-idx min-free-fact-uid))
              ))
          rows)))

;; --- Entry Points ---

(defn xls-to-csv
  "Convert XLS to CSV, handling special cell types and UIDs"
  [xls-file-path csv-output-path config]
  (try
    (log/infof "Processing XLS: %s -> %s" xls-file-path csv-output-path)
    
    (with-open [in (FileInputStream. (io/file xls-file-path))]
      (let [workbook (WorkbookFactory/create in)
            sheet (.getSheetAt workbook 0) ; Process only the first sheet
            
            ;; Extract worksheet data to Clojure vectors
            {:keys [headers rows]} (extract-worksheet-data sheet config)
            
            ;; Process data in memory (resolve UIDs)
            processed-rows (resolve-temp-uids rows headers config)]
        
        (if (and headers (seq processed-rows))
          (do
            ;; Ensure directory exists
            (when-not (.exists (.getParentFile (io/file csv-output-path)))
              (.mkdirs (.getParentFile (io/file csv-output-path))))
            
            ;; Write CSV
            (with-open [writer (io/writer csv-output-path)]
              (csv/write-csv writer (cons headers processed-rows)))
            
            (log/infof "Successfully generated CSV: %s (%d data rows)"
                      csv-output-path (count processed-rows))
            {:status :success :csv-path csv-output-path :rows (count processed-rows)})
          
          (do
            (log/warnf "No data rows processed or header not found for %s. CSV not generated."
                      xls-file-path)
            {:status :no-data :file xls-file-path}))))
    
    (catch Exception e
      (log/errorf e "Failed to process XLS file: %s" xls-file-path)
      {:status :error :message (.getMessage e) :file xls-file-path})))

(defn transform-seed-xls!
  "Process all XLS/XLSX files in seed directory and convert to CSV"
  []
  (let [seed-dir (config/seed-xls-dir)
        csv-dir (config/csv-output-dir)
        uid-config (config/uid-ranges)]
    
    (log/infof "Searching for XLS(X) files in: %s" seed-dir)
    (log/infof "CSV output directory: %s" csv-dir)
    
    ;; Ensure directories exist
    (let [seed-dir-file (io/file seed-dir)
          csv-dir-file (io/file csv-dir)]
      
      ;; Check/create CSV directory
      (when-not (.exists csv-dir-file)
        (log/infof "Creating CSV output directory: %s" csv-dir)
        (.mkdirs csv-dir-file))
      
      ;; Find XLS files
      (if-not (.exists seed-dir-file)
        (do
          (log/errorf "Seed directory not found: %s" seed-dir)
          [])
        
        ;; Directory exists, find XLS files
        (let [xls-files (filter #(and (.isFile %)
                                     (re-find #"(?i)\.xlsx?$" (.getName %)))
                               (file-seq seed-dir-file))]
          
          (if (empty? xls-files)
            (do
              (log/warnf "No XLS(X) files found in seed directory: %s" seed-dir)
              [])
            
            ;; Process the XLS files
            (do
              (log/infof "Found %d XLS(X) files. Processing..." (count xls-files))
              
              (let [merged-config (merge default-config
                                        {:uid-ranges uid-config})
                    
                    ;; Process each file
                    results (doall
                             (map-indexed
                              (fn [idx xls-file]
                                (let [csv-file-name (str idx ".csv")
                                      csv-path (str csv-dir "/" csv-file-name)]
                                  (xls-to-csv (.getAbsolutePath xls-file)
                                             csv-path
                                             merged-config)))
                              xls-files))]
                
                ;; Return valid results
                (let [successful-results (filter #(= (:status %) :success) results)]
                  (log/infof "Successfully processed %d of %d XLS files"
                            (count successful-results) (count xls-files))
                  successful-results)))))))))

(comment
  
  (transform-seed-xls!)
  
  (xls-to-csv "../../seed_xls/099_systema relica - Individuals.xls" "../../seed_csv/xxx.csv" default-config)
  
  (xls-to-csv "../../seed_xls/000_TOPini.xls" "../../seed_csv/yyy.csv" default-config)
  
  )
