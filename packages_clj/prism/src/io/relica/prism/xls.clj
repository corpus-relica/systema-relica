(ns io.relica.prism.xls
  (:require [dk.ative.docjure.spreadsheet :as excel]
            [clojure.data.csv :as csv]
            [clojure.java.io :as io]
            [io.relica.prism.config :as config]
            [taoensso.timbre :as log]
            [clojure.string :as str]))

(defn remove-commas [s]
  (when s (str/replace s "," "")))

(defn normalize-value [_ value] 
  ;; Apply specific normalization based on column index if needed
  ;; For now, just remove commas from all string values
  (if (string? value)
    (remove-commas value)
    value))

(defn try-parse-long [s]
  (try
    (Long/parseLong (remove-commas (str s)))
    (catch NumberFormatException _ nil)))

(defn resolve-temp-uids
  "Resolves temporary UIDs based on configured ranges.
   Takes the current uid-map state and the row vector, returns [updated-map new-row-vector].
   The uid-map state should contain {:mappings {} :next-free-uid Long :next-free-fact-uid Long}."
  [uid-map row uid-config]
  (let [{:keys [max-temp-uid]} uid-config
        ;; 0-based indices for UID columns
        fact-uid-idx 1
        lh-obj-uid-idx 2
        rh-obj-uid-idx 15
        rel-type-uid-idx 60
        uid-indices [fact-uid-idx lh-obj-uid-idx rh-obj-uid-idx rel-type-uid-idx]]

    (loop [current-row row
           current-map uid-map
           indices-to-check uid-indices]
      (if-let [idx (first indices-to-check)]
        (let [raw-value (get current-row idx)
              temp-uid (try-parse-long raw-value)]
          (if (and temp-uid (< temp-uid max-temp-uid))
            (if-let [perm-uid (get (:mappings current-map) temp-uid)]
              ;; Temp UID already mapped
              (recur (assoc current-row idx perm-uid) current-map (rest indices-to-check))
              ;; New Temp UID found
              (let [is-fact-uid? (= idx fact-uid-idx)
                    counter-key (if is-fact-uid? :next-free-fact-uid :next-free-uid)
                    next-perm-uid (get current-map counter-key)
                    updated-map (-> current-map
                                    (assoc-in [:mappings temp-uid] next-perm-uid)
                                    (update counter-key inc))]
                (log/tracef "Mapping temp UID %d (col %d) to permanent UID %d" temp-uid idx next-perm-uid)
                (recur (assoc current-row idx next-perm-uid) updated-map (rest indices-to-check))))
            ;; Not a temp UID or not parseable, skip to next index
            (recur current-row current-map (rest indices-to-check))))
        ;; Base case: no more indices to check
        [current-map current-row]))))

(defn process-row
  "Processes a single row: skips header/empty rows, normalizes values, resolves UIDs.
   Takes uid-map-atom, row-data, and uid-config. Returns processed row vector or nil."
  [uid-map-atom row-data uid-config header-rows-to-skip]
  (let [row-number (:row (meta row-data)) ; Docjure provides row number
        ;; Convert row map values to a vector. Assuming keys are sequential like :A, :B...
        ;; A more robust approach might be needed if keys aren't guaranteed order/presence
        row-vec (mapv val (sort-by key row-data))]
    (cond
      (<= row-number header-rows-to-skip) ; Skip header rows (adjusting for 1-based row-number from docjure?)
      nil

      (every? #(or (nil? %) (and (string? %) (str/blank? %))) row-vec) ; Skip empty rows
      nil

      :else
      (let [;; 1. Normalize basic values (e.g., remove commas)
            normalized-row (map-indexed normalize-value row-vec)
            ;; 2. Resolve temporary UIDs (needs state)
            ;; Pass current map state, get back updated map and resolved row
            [updated-map resolved-row] (resolve-temp-uids @uid-map-atom normalized-row uid-config)]
        ;; Update the atom state with the new map
        (reset! uid-map-atom updated-map)
        ;; Return the resolved row
        resolved-row))))

(defn xls-to-csv
  "Reads an XLS(X) file, processes rows, and writes to a CSV file.
   Returns the path to the generated CSV file or nil on error."
  [xls-file-path csv-output-path sheet-name header-rows-to-skip uid-config]
  (log/infof "Processing XLS file: %s -> %s" xls-file-path csv-output-path)
  (try
    (let [workbook (excel/load-workbook xls-file-path)
          ;; Get all available sheet names from the workbook
          available-sheets (excel/sheet-names workbook)
          _ (log/infof "Available sheets in %s: %s" xls-file-path available-sheets)
          
          ;; Use the first sheet by default instead of trying to select by name
          sheet (if (seq available-sheets)
                  (do
                    (log/infof "Using first sheet: %s" (first available-sheets))
                    (excel/select-sheet (first available-sheets) workbook))
                  (throw (IllegalArgumentException. 
                          (format "No sheets found in workbook %s" xls-file-path))))
          
          ;; Correctly extract header: read first N rows, find first non-empty, non-skipped one
          raw-rows (excel/row-seq sheet)
          ;; Initialize UID map atom with starting counters
          uid-map-atom (atom {:mappings {}
                              :next-free-uid (:min-free-uid uid-config)
                              :next-free-fact-uid (:min-free-fact-uid uid-config)})
          ;; Process rows using keep and the stateful atom
          processed-data-rows (doall (keep #(process-row uid-map-atom % uid-config header-rows-to-skip) raw-rows))

          ;; Re-read the header row(s) separately if needed, assuming simple structure for now
          ;; Let's assume the first row *before* skipping is the header we need for CSV
          ;; A better approach might parse headers explicitly before processing data.
          ;; For now, let's just write the processed data rows.
          ;; We might need the original header later if columns shift.
          ]

      (when (empty? processed-data-rows)
        (log/warnf "No data rows found or processed in %s (sheet: %s) after skipping %d headers." xls-file-path sheet-name header-rows-to-skip)
        ;; Don't throw error, just return nil as no CSV is generated
        (log/info "No CSV file generated as no data rows were processed.")
        (-> {:status :no-data :file xls-file-path}))

      (with-open [writer (io/writer csv-output-path)]
        (csv/write-csv writer processed-data-rows)) ; Write just the processed data

      (log/infof "Successfully generated CSV: %s (%d data rows)" csv-output-path (count processed-data-rows))
      {:status :success :csv-path csv-output-path})

    (catch Exception e
      (log/errorf e "Failed to process XLS file: %s" xls-file-path)
      {:status :error :file xls-file-path :error e})))

(defn process-seed-directory
  "Finds all .xls and .xlsx files in the seed directory, converts them to CSV.
   Returns a list of paths to the generated CSV files."
  []
  (let [seed-dir (config/seed-xls-dir)
        csv-dir (config/csv-output-dir)
        uid-config (config/uid-ranges)
        ;; Don't use a specific sheet name - we'll just use the first sheet
        ;; in each workbook automatically
        sheet-name nil  
        header-rows-to-skip 2]
    
    (log/infof "Searching for XLS(X) files in: %s" seed-dir)
    (log/infof "CSV output directory: %s" csv-dir)
    
    ;; Ensure seed directory exists
    (let [seed-dir-file (io/file seed-dir)]
      (if (not (.exists seed-dir-file))
        (do 
          (log/errorf "Seed directory not found: %s" seed-dir)
          [])
        
        ;; Directory exists, find XLS files
        (let [xls-files (filter #(and (.isFile %) (re-find #"\.xlsx?$" (.getName %)))
                              (file-seq seed-dir-file))]
          (if (empty? xls-files)
            (do
              (log/warnf "No XLS(X) files found in seed directory: %s" seed-dir)
              [])
            
            ;; Process the XLS files
            (do
              (log/infof "Found %d XLS(X) files. Processing..." (count xls-files))
              (log/debugf "XLS files: %s" (map #(.getName %) xls-files))
              
              ;; Ensure CSV output directory exists
              (let [csv-dir-file (io/file csv-dir)]
                (when (not (.exists csv-dir-file))
                  (log/infof "Creating CSV output directory: %s" csv-dir)
                  (.mkdirs csv-dir-file)))
              
              (let [results (doall (pmap (fn [xls-file] ; Use pmap for potential parallelism
                                         (let [base-name (str/replace (.getName xls-file) #"\.xlsx?$" "")
                                               csv-file-name (str base-name ".csv")
                                               csv-path (str csv-dir "/" csv-file-name)
                                               _ (log/debugf "Processing %s to %s" (.getAbsolutePath xls-file) csv-path)
                                               result-map (xls-to-csv (.getAbsolutePath xls-file) csv-path sheet-name header-rows-to-skip uid-config)]
                                          ;; Return the path on success, nil otherwise
                                           (when (= (:status result-map) :success)
                                             (:csv-path result-map))))
                                       xls-files))]
                (let [valid-results (filterv some? results)]
                  (log/infof "Successfully processed %d of %d XLS files" (count valid-results) (count xls-files))
                  valid-results)))))))))

(log/info "Prism XLS namespace loaded.")
