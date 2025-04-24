(ns io.relica.prism.xls-transform
  (:require [dk.ative.docjure.spreadsheet :as excel]
            [clojure.data.csv :as csv]
            [clojure.java.io :as io]
            [io.relica.prism.config :as config]
            [taoensso.timbre :as log]
            [clojure.java.shell :as shell]
            [clojure.string :as str])
  (:import [java.util Date]
           [java.time LocalDate ZoneId]
           [java.time.format DateTimeFormatter]
           [org.apache.poi.ss.usermodel DateUtil Row Cell CellType WorkbookFactory Sheet]
           [java.io File FileInputStream FileOutputStream]))

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
  "Formats a java.util.Date object to yyyy-MM-dd string,
   matching TypeScript ISO style date formatting."
  [^Date date]
  (if date
    (-> date
        .toInstant
        (.atZone (ZoneId/systemDefault))
        .toLocalDate
        (.format date-formatter))
    ""))

(defn- excel-value->str
  "Reads cell value robustly, handling types and formatting dates/integers.
   Matches TypeScript's approach to cell value extraction."
  [cell]
  ;; (println "Processing cell:" cell)
  ;; Handle different input types
  (cond
    ;; Already a string
    (string? cell) cell

    ;; Nil value
    (nil? cell) ""

    ;; A proper cell object
    :else
    (when cell
      (let [cell-type (.getCellType cell)]
        (cond
          ;; Handle Formula cells similar to TypeScript approach
          (= cell-type CellType/FORMULA)
          (try
            ;; Use the cached value directly like the TS code does
            (let [cached-value (excel/read-cell cell)]
              (cond
                (instance? Date cached-value) (format-java-date cached-value)
                (number? cached-value) (if (== cached-value (long cached-value))
                                        (str (long cached-value))
                                        (str cached-value))
                :else (str cached-value)))
            (catch Exception e
              (log/warnf "Error accessing formula cell: %s. Using empty string." (.getMessage e))
              ""))

          ;; Handle date cells
          (or (instance? Date (excel/read-cell cell))
              (and (= cell-type CellType/NUMERIC) (DateUtil/isCellDateFormatted cell)))
          (try
            (format-java-date (excel/read-cell cell))
            (catch Exception e
              (log/warnf "Failed to format date: %s. Using raw value." (.getMessage e))
              (str (excel/read-cell cell))))

          ;; Handle numeric cells - format integers without .0
          (= cell-type CellType/NUMERIC)
          (let [num-val (excel/read-cell cell)]
            (if (and num-val (== num-val (long num-val)))
              (str (long num-val))
              (str num-val)))

          ;; Handle strings, trimming whitespace (matches TS behavior)
          (= cell-type CellType/STRING)
          (str/trim (str (excel/read-cell cell)))

          ;; Default handling for other types
          :else (str (excel/read-cell cell)))))))

;; --- Column Handling (TypeScript equivalent) ---

(defn- find-column-indices
  "Find indices of important columns by header values,
   similar to the TypeScript findSheetBounds+header combination."
  [sheet header-row-idx]
  (let [header-row (.getRow sheet header-row-idx)
        header-cells (when header-row
                      (mapv excel-value->str (excel/cell-seq header-row)))]

    ;; Return a map of column names to their indices
    (into {}
          (keep-indexed
           (fn [idx val]
             (when (not (str/blank? val))
               [val idx]))
           header-cells))))

;; --- Row Processing ---

(defn- is-row-empty?
  "Check if a row is empty (all cells blank),
   porting TypeScript's isRowEmpty function."
  [row]
  (if row
    (every? (fn [cell]
              (let [val (excel-value->str cell)]
                (or (nil? val) (str/blank? val))))
            (excel/cell-seq row))
    true))

(defn- fix-dates-in-worksheet
  "Fix dates in specific columns, similar to the TypeScript fixDatesInWorksheet."
  [sheet col-indices]
  (let [date-col-1-idx (get col-indices "9")
        date-col-2-idx (get col-indices "10")]

    (when (and date-col-1-idx date-col-2-idx)
      (doseq [row (excel/row-seq sheet)]
        (when-let [row-num (.getRowNum row)]
          ;; Skip header row
          (when (> row-num 0)
            ;; Process first date column (9)
            (when-let [date-cell-1 (.getCell row date-col-1-idx)]
              (when (or (= (.getCellType date-cell-1) CellType/STRING)
                       (DateUtil/isCellDateFormatted date-cell-1))
                (let [date-val (excel/read-cell date-cell-1)]
                  (when (instance? Date date-val)
                    ;; Set as ISO date string, like TypeScript does
                    (.setCellValue date-cell-1 (format-java-date date-val))))))

            ;; Process second date column (10)
            (when-let [date-cell-2 (.getCell row date-col-2-idx)]
              (when (or (= (.getCellType date-cell-2) CellType/STRING)
                       (DateUtil/isCellDateFormatted date-cell-2))
                (let [date-val (excel/read-cell date-cell-2)]
                  (when (instance? Date date-val)
                    ;; Set as ISO date string, like TypeScript does
                    (.setCellValue date-cell-2 (format-java-date date-val))))))))))))

;; --- UID Handling ---

(defn- resolve-temp-uids
  "Resolve temporary UIDs in specific columns,
   equivalent to the TypeScript resolveTempUIDs function."
  [sheet col-indices min-free-uid min-free-fact-uid max-temp-uid]
  (let [lh-obj-idx (get col-indices "2")
        rel-type-idx (get col-indices "60")
        rh-obj-idx (get col-indices "15")
        fact-idx (get col-indices "1")]

    (doseq [row (excel/row-seq sheet)]
      (when (> (.getRowNum row) 0) ; Skip header
        ;; Process LH object UID
        (when lh-obj-idx
          (when-let [cell (.getCell row lh-obj-idx)]
            (let [val (excel/read-cell cell)]
              (when (and (number? val) (< val max-temp-uid))
                (.setCellValue cell (+ val min-free-uid))))))

        ;; Process relation type UID
        (when rel-type-idx
          (when-let [cell (.getCell row rel-type-idx)]
            (let [val (excel/read-cell cell)]
              (when (and (number? val) (< val max-temp-uid))
                (.setCellValue cell (+ val min-free-uid))))))

        ;; Process RH object UID
        (when rh-obj-idx
          (when-let [cell (.getCell row rh-obj-idx)]
            (let [val (excel/read-cell cell)]
              (when (and (number? val) (< val max-temp-uid))
                (.setCellValue cell (+ val min-free-uid))))))

        ;; Process fact UID
        (when fact-idx
          (when-let [cell (.getCell row fact-idx)]
            (let [val (excel/read-cell cell)]
              (when (and (number? val) (< val max-temp-uid))
                (.setCellValue cell (+ val min-free-fact-uid))))))))))

;; --- File Processing ---

(defn- process-sheet
  "Process a worksheet, handling dates and UIDs.
   Implements the combination of TypeScript readXLS and fixDatesInWorksheet."
  [sheet config]
  (let [{:keys [skip-rows remove-empty-rows? date-col-ids uid-cols uid-ranges]} config
        {:keys [min-free-uid min-free-fact-uid max-temp-uid]} uid-ranges

        ;; Find column indices similar to TypeScript
        col-indices (find-column-indices sheet 0) ; Use first row for column IDs

        ;; First, fix dates in the worksheet
        _ (fix-dates-in-worksheet sheet col-indices)

        ;; Then resolve temporary UIDs
        _ (resolve-temp-uids sheet col-indices min-free-uid min-free-fact-uid max-temp-uid)

        ;; Now extract the data for CSV export
        all-rows (drop skip-rows (excel/row-seq sheet))
        filtered-rows (if remove-empty-rows?
                       (remove is-row-empty? all-rows)
                       all-rows)

        ;; Convert to string data for CSV
        header-row (second (excel/row-seq sheet)) ; Get actual header row
        header-values (mapv excel-value->str (excel/cell-seq header-row))

        data-rows (mapv
                   (fn [row]
                     (mapv excel-value->str (excel/cell-seq row)))
                   filtered-rows)]

    {:header header-values :data data-rows}))

;; --- Entry Point ---

(defn xls-to-csv
  "Convert XLS to CSV, handling dates and UIDs.
   Implements core functionality from TypeScript's readXLS, fixDatesInWorksheet,
   and writeCSV."
  [xls-file-path csv-output-path config]
  (try
    (log/infof "Processing XLS: %s -> %s" xls-file-path csv-output-path)

    (with-open [in (FileInputStream. (io/file xls-file-path))]
      (let [workbook (WorkbookFactory/create in)
            sheet (.getSheetAt workbook 0) ; Process only the first sheet

            ;; Process the sheet including date fixing and UID resolution
            processed (process-sheet sheet config)

            header (:header processed)
            data (:data processed)]

        (if (and header (seq data))
          (do
            ;; Ensure directory has write permissions
            (when (not (.exists (.getParentFile (io/file csv-output-path))))
              (.mkdirs (.getParentFile (io/file csv-output-path))))

            ;; Reset permissions if needed
            ;; (reset-directory-permissions! (.getParent (io/file csv-output-path)))

            ;; Write CSV
            (with-open [writer (io/writer csv-output-path)]
              (csv/write-csv writer (cons header data)))

            ;; Reset permissions after writing
            ;; (reset-directory-permissions! (.getParent (io/file csv-output-path)))

            (log/infof "Successfully generated CSV: %s (%d data rows)"
                     csv-output-path (count data))
            {:status :success :csv-path csv-output-path :rows (count data)})

          (do
            (log/warnf "No data rows processed or header not found for %s. CSV not generated."
                      xls-file-path)
            {:status :no-data :file xls-file-path}))))

    (catch Exception e
      (log/errorf e "Failed to process XLS file: %s" xls-file-path)
      {:status :error :message (.getMessage e) :file xls-file-path})))

;; Permission handling
;; (defn- reset-directory-permissions!
;;   "Reset permissions on a directory to ensure write access."
;;   [dir-path]
;;   (log/info "Resetting permissions for directory:" dir-path)
;;   (let [result (shell/sh "chmod" "-R" "u+rw" dir-path)]
;;     (if (zero? (:exit result))
;;       (log/info "Successfully reset permissions for" dir-path)
;;       (log/error "Failed to reset permissions:" (:err result)))))

;; Main transform function
(defn transform-seed-xls!
  "Finds all .xls and .xlsx files in the seed directory, converts them to CSV.
   Replicates the TypeScript readXLSFixDatesAndSaveCSV functionality."
  []
  (let [seed-dir (config/seed-xls-dir)
        csv-dir (config/csv-output-dir)
        uid-config (config/uid-ranges)]

    (log/infof "Searching for XLS(X) files in: %s" seed-dir)
    (log/infof "CSV output directory: %s" csv-dir)

    ;; Ensure directories exist with proper permissions
    (let [seed-dir-file (io/file seed-dir)
          csv-dir-file (io/file csv-dir)]

      ;; Check/create CSV directory
      (when-not (.exists csv-dir-file)
        (log/infof "Creating CSV output directory: %s" csv-dir)
        (.mkdirs csv-dir-file))

      ;; Reset permissions on CSV directory
      ;; (reset-directory-permissions! csv-dir)

      ;; Find XLS files (similar to TypeScript)
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

                    ;; Map each file to a CSV (like TypeScript loop)
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

                  ;; Reset permissions one final time
                  ;; (reset-directory-permissions! csv-dir)

                  successful-results)))))))))

(comment

  (transform-seed-xls!)


  )
