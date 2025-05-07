(ns io.relica.archivist.query.rgns-parser
  (:require [clojure.tools.logging :as log]
            [clojure.string :as str]))

;; Helper function to parse numbers safely
(defn parse-number
  "Parse string as number"
  [s]
  (try
    (Integer/parseInt s)
    (catch Exception _
      nil)))

;; Function to remove quotes from strings if present
(defn remove-quotes [s]
  (if (and (str/starts-with? s "\"") (str/ends-with? s "\""))
    (subs s 1 (dec (count s)))
    s))

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
              uid (parse-number (first parts))
              name (if (> (count parts) 1) (remove-quotes (second parts)) nil)]
          {:type :placeholder
           :uid uid
           :name name})))
    
    ;; Regular entity (101.Name)
    :else
    (let [parts (str/split text #"\." 2)
          uid (parse-number (first parts))
          name (if (> (count parts) 1) (remove-quotes (second parts)) nil)]
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

;; Parse nested entities like "(201.Impeller, 202.Shaft, 203.Casing)"
(defn parse-nested-entities [text]
  (let [inner-text (str/trim (subs text 1 (dec (count text))))
        parts (str/split inner-text #",")
        entities (mapv (comp parse-entity-with-role str/trim) parts)]
    {:type :nested
     :entities entities}))

;; Parse statement with nested entities
(defn parse-statement-with-nested [text]
  (let [parts (str/split text #">")
        left-text (str/trim (first parts))
        relation-text (str/trim (second parts))
        right-text (str/trim (nth parts 2))
        left (parse-entity-with-role left-text)
        relation (parse-entity-with-role relation-text)
        right (if (str/starts-with? right-text "(")
                (parse-nested-entities right-text)
                (parse-entity-with-role right-text))]
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

;; Public API function to parse RGNS queries
(defn parse
  "Parse RGNS query string and return structured data"
  [input]
  (try
    (let [lines (str/split-lines input)
          parsed-lines (mapv
                       (fn [line]
                         (let [trimmed (str/trim line)]
                           (cond
                             (str/blank? trimmed) nil
                             (str/starts-with? trimmed "@") (parse-metadata trimmed)
                             (str/includes? trimmed ">") 
                               (if (re-find #"\([^)]*\)" trimmed)
                                 (parse-statement-with-nested trimmed)
                                 (parse-statement trimmed))
                             :else nil)))
                       lines)]
      (filterv some? parsed-lines))
    (catch Exception e
      (log/error "Error parsing RGNS query:" (pr-str input) "Exception:" (ex-message e))
      (throw (ex-info "Error parsing RGNS query" 
                      {:input input :error (ex-message e)} e)))))

;; Convert parsed data to a format compatible with the existing system
(defn statement->fact
  "Convert a parsed statement to a fact map"
  [statement]
  {:lh_object_uid (get-in statement [:left :uid] 0)
   :lh_object_name (get-in statement [:left :name] "")
   :lh_role_uid (get-in statement [:left :role :uid] 0)
   :lh_role_name (get-in statement [:left :role :name] "")
   :rel_type_uid (get-in statement [:relation :uid] 0)
   :rel_type_name (get-in statement [:relation :name] "")
   :rel_role_uid (get-in statement [:relation :role :uid] 0)
   :rel_role_name (get-in statement [:relation :role :name] "")
   :rh_object_uid (get-in statement [:right :uid] 0)
   :rh_object_name (get-in statement [:right :name] "")
   :rh_role_uid (get-in statement [:right :role :uid] 0)
   :rh_role_name (get-in statement [:right :role :name] "")
   :intention (cond
                (or (= :placeholder (get-in statement [:left :type]))
                    (= :placeholder (get-in statement [:right :type]))) "question"
                (or (= :what-placeholder (get-in statement [:left :type]))
                    (= :what-placeholder (get-in statement [:right :type]))) "question"
                :else "assertion")
   :fact_uid 0})

;; Convert all parsed statements to facts
(defn parsed-to-facts
  "Convert parsed RGNS data to facts"
  [parsed-data]
  (let [statements (filter #(= :statement (:type %)) parsed-data)
        metadata (filter #(= :metadata (:type %)) parsed-data)
        facts (mapv statement->fact statements)]
    (reduce (fn [acc meta-item]
              (mapv #(assoc % (:key meta-item) (:value meta-item)) acc))
            facts
            metadata)))