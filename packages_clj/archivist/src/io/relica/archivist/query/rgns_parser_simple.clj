(ns io.relica.archivist.query.rgns-parser-simple
  (:require [clojure.string :as str]))

;; Utility functions
(defn parse-int [s]
  (try
    (Integer/parseInt s)
    (catch Exception _
      nil)))

;; Parse entity like "101.Pump A" or "?101.Pump A" or "*"
(defn parse-entity [text]
  (cond
    ;; What placeholder (*)
    (= text "*")
    {:type :what-placeholder}
    
    ;; Placeholder entity (?...)
    (str/starts-with? text "?")
    (let [rest-text (subs text 1)]
      (if (empty? rest-text)
        {:type :placeholder}
        (let [parts (str/split rest-text #"\." 2)
              uid (parse-int (first parts))
              name (if (> (count parts) 1) (second parts) nil)]
          {:type :placeholder
           :uid uid
           :name name})))
    
    ;; Regular entity (101.Name)
    :else
    (let [parts (str/split text #"\." 2)
          uid (parse-int (first parts))
          name (if (> (count parts) 1) (second parts) nil)]
      {:type :regular
       :uid uid
       :name name})))

;; Parse entity with role like "101.Pump A : 4732.whole"
(defn parse-entity-with-role [text]
  (if (str/includes? text ":")
    (let [[entity-text role-text] (str/split text #":" 2)
          entity (parse-entity (str/trim entity-text))
          role (parse-entity (str/trim role-text))]
      (assoc entity :role role))
    (parse-entity text)))

;; Parse a statement like "101.Pump A > 1190.has as part > 201.Impeller"
(defn parse-statement [text]
  (let [parts (str/split text #">")
        left-text (str/trim (first parts))
        relation-text (str/trim (second parts))
        right-text (str/trim (nth parts 2))
        left (parse-entity-with-role left-text)
        relation (parse-entity-with-role relation-text)
        right (parse-entity-with-role right-text)]
    {:type :statement
     :left left
     :relation relation
     :right right}))

;; Parse metadata like "@KEY=VALUE"
(defn parse-metadata [text]
  (let [[_ key value] (re-find #"@([A-Za-z0-9_]+)=(.*)" text)]
    {:type :metadata
     :key key
     :value value}))

;; Parse RGNS text
(defn parse [input]
  (let [lines (str/split-lines input)
        parsed-lines (mapv
                      (fn [line]
                        (let [trimmed (str/trim line)]
                          (cond
                            (str/blank? trimmed) nil
                            (str/starts-with? trimmed "@") (parse-metadata trimmed)
                            :else (parse-statement trimmed))))
                      lines)]
    (filterv some? parsed-lines)))

;; For testing
(defn test-parser []
  (println "\nParsing: 101.Pump A > 1190.has as part > 201.Impeller")
  (prn (parse "101.Pump A > 1190.has as part > 201.Impeller"))
  
  (println "\nParsing: 101.\"Pump A (2023 model)\" > 1190.has as part > 201.Impeller")
  (prn (parse "101.\"Pump A (2023 model)\" > 1190.has as part > 201.Impeller"))
  
  (println "\nParsing: 101.Pump A : 4732.whole > 1190.has as part : 4731.part > 201.Impeller")
  (prn (parse "101.Pump A : 4732.whole > 1190.has as part : 4731.part > 201.Impeller"))
  
  (println "\nParsing: @INTENTION=statement\n@VALIDITY=design_phase\n101.Pump A > 1726.rotation speed > 4325.3000 rpm")
  (prn (parse "@INTENTION=statement\n@VALIDITY=design_phase\n101.Pump A > 1726.rotation speed > 4325.3000 rpm")))

(defn -main [& args]
  (test-parser))