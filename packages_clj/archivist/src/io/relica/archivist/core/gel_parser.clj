(ns io.relica.archivist.core.gel-parser
  (:require [instaparse.core :as insta]))


;; (def gellish-parser
;;   (insta/parser
;;     "DOCUMENT = (METADATA | STATEMENT)*

;;      METADATA = <'@'> KEY <'='> VALUE

;;      STATEMENT = (SPECIFIC-QUERY | WHAT-QUERY | FACT)

;;      FACT = ENTITY-WITH-ROLE <whitespace>? <'>'> <whitespace>? ENTITY-WITH-ROLE <whitespace>? <'>'> <whitespace>? (ENTITY-WITH-ROLE | NESTED-ENTITIES)

;;      SPECIFIC-QUERY = <'?'> ENTITY-WITH-ROLE <'>'> ENTITY-WITH-ROLE <'>'> ENTITY-WITH-ROLE

;;      WHAT-QUERY = <'*'> ENTITY-WITH-ROLE <'>'> ENTITY-WITH-ROLE <'>'> ENTITY-WITH-ROLE

;;      ENTITY-WITH-ROLE = ENTITY ROLE?

;;      ENTITY = NUMBER (<'.'> NAME)?

;;      ROLE = <':'> NUMBER (<'.'> NAME)?

;;      NESTED-ENTITIES = <'('> ENTITY (<','> ENTITY)* <')'>

;;      NUMBER = #'\\d+'

;;      NAME = QUOTED-STRING | SIMPLE-NAME

;;      QUOTED-STRING = <'\"'> #'[^\"]*' <'\"'>

;;      SIMPLE-NAME = #'[^>:(),\"]*[^>:(),\"\\s]'

;;      KEY = #'[A-Z_]+'

;;      VALUE = #'[^\\n]+'

;;      <whitespace> = #'\\s+'"))

(def gellish-parser
  (insta/parser
    "DOCUMENT = (METADATA | STATEMENT)*

     METADATA = <'@'> KEY <'='> VALUE

     STATEMENT = (SPECIFIC-QUERY | WHAT-QUERY | FACT)

     STATEMENT = (ENTITY | ENTITY-CONE) <whitespace>? <'>'> <whitespace>? (ENTITY | ENTITY-CONE) <whitespace>? <'>'> <whitespace>? (ENTITY | ENTITY-CONE)

     ENTITY-CONE = '['ENTITY']'

     ENTITY = PLACEHOLDER-ENTITY | REGULAR-ENTITY

     PLACEHOLDER-ENTITY = <'?'> NUMBER? (<'.'> (IDENTIFIER | QUOTED-STRING))? ROLE?

     REGULAR-ENTITY = NUMBER (<'.'> (IDENTIFIER | QUOTED-STRING))? ROLE?

     ROLE = <':'> IDENTIFIER

     KEY = IDENTIFIER

     VALUE = QUOTED-STRING

     NUMBER = #'\\d+'

     IDENTIFIER = ALUM (ALUM | '_' | SPACE)*

     QUOTED-STRING = <'\"'> #'[^\"]*' <'\"'>

     ALUM = #'[A-Za-z0-9]+'

     <SPACE> = <#'[ ]+'>
     <whitespace> = #'\\s+'"))

(def bullshit-parser
  (insta/parser
   "foo = letter-or-number_
    letter-or-number = #'[A-Za-z0-9]'
    letter = #'[A-Za-z]'
    number = #'[0-9]'"))

(bullshit-parser "1234")

(comment
  ;; Test just number
  (gellish-parser "73000")
  
  ;; Test number with name
  (gellish-parser "73000.physical object")
  
  ;; Test full statement
  (gellish-parser "73000.physical object > 1146.is a specialization of > 730000.anything")

  (def test-cases
     ["101.Pump A > 1190.has as part > 201.Impeller"])

      ;; "101.Pump A:4732.whole > 1190.has as part:4731.part > 201.Impeller"

      ;; "@INTENTION=statement
      ;;  @VALIDITY=design_phase
      ;;  101.Pump A > 1726.rotation speed > 4325.3000 rpm"

      ;; "?101.Pump A > 1190.has as part > ?"

      ;; "* > 4658.is related to > 101.Pump A"

      ;; "101.\"Pump A (2023 model)\" > 1190.has as part > 201.Impeller"

      ;; "101.Pump A > 1190.has as part > (201.Impeller, 202.Shaft, 203.Casing)"])



;; Try parsing each test case
  (doseq [test-case test-cases]
    (println "\nParsing:" test-case)
    (println (gellish-parser test-case)))

  (print))

(defn transform-parse-tree [tree]
  (insta/transform
    {:NUMBER #(Integer/parseInt %)
     :IDENTIFIER identity
     :STRING-LITERAL identity
     :ROLE (fn [id] {:role id})
     :REGULAR-ENTITY (fn [& parts]
                      (let [[num name role] parts]
                        {:type "regular"
                         :uid num
                         :name (or name "")
                         :role (:role role)}))
     :PLACEHOLDER-ENTITY (fn [& parts]
                          {:type "placeholder"
                           :number (first (filter number? parts))
                           :name (first (filter string? parts))})
     :ENTITY identity
     :STATEMENT (fn [left rel right]
                  {:type "statement"
                   :left left
                   :relation rel
                   :right right})
     :METADATA-LINE (fn [key value]
                     {:type "metadata"
                      :key key
                      :value value})
     :DOCUMENT vector}
    tree))

(defn create-fact [statement]
  {:lh_object_uid (if (= (:type (:left statement)) "regular")
                    (:uid (:left statement))
                    (:number (:left statement)))
   :lh_object_name (or (:name (:left statement)) "")
   :rel_type_uid (if (= (:type (:relation statement)) "regular")
                   (:uid (:relation statement))
                   (:number (:relation statement)))
   :rel_type_name (or (:name (:relation statement)) "")
   :rh_object_uid (if (= (:type (:right statement)) "regular")
                    (:uid (:right statement))
                    (:number (:right statement)))
   :rh_object_name (or (:name (:right statement)) "")
   :intention (if (or (= (:type (:left statement)) "placeholder")
                     (= (:type (:right statement)) "placeholder"))
               "question"
               "assertion")
   :fact_uid 0})

(defprotocol IGellishParser
  (parse [this query-string]))

(deftype GellishParser []
  IGellishParser
  (parse [_ query-string]
    (try
      (let [parse-tree (gellish-parser query-string)
            result (transform-parse-tree parse-tree)]
        (if (insta/failure? result)
          (throw (ex-info "Parse failed" {:failure result}))
          (reduce (fn [fact item]
                   (if (= (:type item) "statement")
                     (create-fact item)
                     (assoc fact (:key item) (:value item))))
                 {:lh_object_uid 0
                  :lh_object_name ""
                  :rel_type_uid 0
                  :rel_type_name ""
                  :rh_object_uid 0
                  :rh_object_name ""
                  :intention "assertion"
                  :fact_uid 0}
                 result)))
      (catch Exception e
        (println "Error parsing Gellish:" e)
        (throw e)))))

(comment
  ;; Create parser instance
  (def parser (GellishParser.))

  ;; Basic tests
  (.parse parser "73000.physical object > 1146.is a specialization of > 730000.anything")

  ;; With variable/placeholder
  (.parse parser "?1.physical thing > 1146.specialization > 73000.physical object")

  ;; With metadata
  (.parse parser "@intention=assertion\n73000 > 1146 > 730000")

  ;; With comments
  (.parse parser "// This is a comment\n73000 > 1146 > 730000")

  ;; Complex entity names
  (.parse parser "73000.\"physical object\" > 1146.\"is a specialization of\" > 730000.\"anything\"")

  ;; Multiple placeholders
  (.parse parser "?1.thing > ?2.relates to > ?3.other thing")

  ;; With roles
  (.parse parser "73000:subject > 1146 > 730000:object")

  ;; Combination
  (.parse parser "@language=english\n73000.physical:subject > 1146.\"is a\" > ?1.\"something\":object"))
