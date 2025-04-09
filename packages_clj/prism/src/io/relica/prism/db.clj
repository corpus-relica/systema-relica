(ns io.relica.prism.db
  (:require [neo4j-clj.core :as neo4j]
            [io.relica.prism.config :as config]
            [taoensso.timbre :as log])
  (:import (org.neo4j.driver.exceptions TransientException)
           (java.net URI)))

;; Define a Neo4j connection
;; Create a URI object from the connection string
(def neo4j-uri (URI. (config/neo4j-uri)))
(def neo4j-user (config/neo4j-user))
(def neo4j-password (config/neo4j-password))

(defonce default-driver (atom nil))

;; Initialize connection
(defn init-connection! []
  (log/info "Initializing Neo4j connection to:" neo4j-uri)
  (reset! default-driver (neo4j/connect neo4j-uri neo4j-user neo4j-password))
  (log/info "Neo4j connection established")
  @default-driver)

;; Get driver, initializing if needed
(defn get-driver []
  (if @default-driver
    @default-driver
    (init-connection!)))

;; Define common queries we'll use
(neo4j/defquery count-nodes-query "MATCH (n) RETURN count(n) AS node_count LIMIT 1")
(neo4j/defquery execute-cypher-query "CALL apoc.cypher.run($cypher, $params) YIELD value RETURN value")

;; Define Gellish column mapping
(def column-mapping {
  "0" "sequence",
  "1" "fact_uid",
  "2" "lh_object_uid",
  "3" "rel_type_name",
  "4" "full_definition",
  "5" "intention_uid",
  "6" "author_uid",
  "7" "uom_name",
  "8" "approval_status",
  "9" "effective_from",
  "10" "latest_update",
  "12" "author",
  "13" "reference",
  "14" "remarks",
  "15" "rh_object_uid",
  "16" "lh_context_name",
  "18" "val_context_name",
  "19" "val_context_uid",
  "20" "picklist_name",
  "24" "reason",
  "39" "lh_reality",
  "42" "fact_description",
  "43" "intention",
  "44" "lh_cardinalities",
  "45" "rh_cardinalities",
  "50" "collection_uid",
  "53" "line_uid",
  "54" "language",
  "60" "rel_type_uid",
  "62" "facts_inherited",
  "63" "expandable_ui",
  "64" "allowed_equality",
  "65" "partial_definition",
  "66" "uom_uid",
  "67" "successor_uid",
  "68" "collection_name",
  "69" "language_uid",
  "70" "picklist_uid",
  "71" "lh_context_uid",
  "72" "lh_role_uid",
  "73" "lh_role_name",
  "74" "rh_role_uid",
  "75" "rh_role_name",
  "76" "accuracy_uid",
  "77" "accuracy_name",
  "78" "successor_uid",
  "80" "lh_commonality",
  "81" "rh_commonality",
  "101" "lh_object_name",
  "201" "rh_object_name"
})

;; Log the column mapping at startup
(log/info "Loaded Gellish column mapping:" column-mapping)

;; Define specific named queries for csv loading
(neo4j/defquery load-nodes-from-csv-query
  "LOAD CSV WITH HEADERS FROM $file_url AS line
   // Extract the UIDs using the column identifiers in line
   // Also check if line contains the keys to avoid null errors
   WITH line,
        (CASE WHEN line['2'] IS NOT NULL AND trim(line['2']) <> '' 
              THEN toInteger(replace(line['2'], ',', '')) 
              ELSE null END) AS lh_uid,
        (CASE WHEN line['15'] IS NOT NULL AND trim(line['15']) <> '' 
              THEN toInteger(replace(line['15'], ',', '')) 
              ELSE null END) AS rh_uid
   
   // Only create entities when we have valid UIDs
   WHERE lh_uid IS NOT NULL OR rh_uid IS NOT NULL
   
   // Create the left hand entity if UID exists
   FOREACH (ignored IN CASE WHEN lh_uid IS NOT NULL THEN [1] ELSE [] END |
     MERGE (lh:Entity {uid: lh_uid})
   )
   
   // Create the right hand entity if UID exists
   FOREACH (ignored IN CASE WHEN rh_uid IS NOT NULL THEN [1] ELSE [] END |
     MERGE (rh:Entity {uid: rh_uid})
   )
   
   // Count created entities (1 or 2 depending on if both UIDs were valid)
   RETURN count(lh_uid) + count(rh_uid) as count")

(neo4j/defquery load-relationships-from-csv-query
  "LOAD CSV WITH HEADERS FROM $file_url AS line
   
   // Skip rows with missing UIDs
   WITH line WHERE 
     line['2'] IS NOT NULL AND trim(line['2']) <> '' AND
     line['15'] IS NOT NULL AND trim(line['15']) <> ''
   
   // Match entities
   MATCH (lh:Entity {uid: toInteger(replace(line['2'], ',', ''))})
   MATCH (rh:Entity {uid: toInteger(replace(line['15'], ',', ''))})
   
   // Create fact relationship with all properties
   CREATE (rel:Fact {
       sequence: CASE WHEN line['0'] IS NOT NULL THEN toInteger(replace(line['0'], ',', '')) ELSE null END,
       language_uid: CASE WHEN line['69'] IS NOT NULL THEN toInteger(replace(line['69'], ',', '')) ELSE null END,
       language: line['54'],
       lh_context_uid: CASE WHEN line['71'] IS NOT NULL THEN toInteger(replace(line['71'], ',', '')) ELSE null END,
       lh_context_name: line['16'],
       lh_reality: line['39'],
       lh_object_uid: toInteger(replace(line['2'], ',', '')),
       lh_cardinalities: line['44'],
       lh_object_name: line['101'],
       lh_role_uid: CASE WHEN line['72'] IS NOT NULL THEN toInteger(replace(line['72'], ',', '')) ELSE null END,
       lh_role_name: line['73'],
       intention_uid: CASE WHEN line['5'] IS NOT NULL THEN toInteger(replace(line['5'], ',', '')) ELSE null END,
       intention: line['43'],
       val_context_uid: CASE WHEN line['19'] IS NOT NULL THEN toInteger(replace(line['19'], ',', '')) ELSE null END,
       val_context_name: line['18'],
       fact_uid: CASE WHEN line['1'] IS NOT NULL THEN toInteger(replace(line['1'], ',', '')) ELSE null END,
       fact_description: line['42'],
       rel_type_uid: CASE WHEN line['60'] IS NOT NULL THEN toInteger(replace(line['60'], ',', '')) ELSE null END,
       rel_type_name: line['3'],
       rh_role_uid: CASE WHEN line['74'] IS NOT NULL THEN toInteger(replace(line['74'], ',', '')) ELSE null END,
       rh_role_name: line['75'],
       rh_object_uid: toInteger(replace(line['15'], ',', '')),
       rh_cardinalities: line['45'],
       rh_object_name: line['201'],
       partial_definition: line['65'],
       full_definition: line['4'],
       uom_uid: CASE WHEN line['66'] IS NOT NULL THEN toInteger(replace(line['66'], ',', '')) ELSE null END,
       uom_name: line['7'],
       accuracy_uid: CASE WHEN line['76'] IS NOT NULL THEN toInteger(replace(line['76'], ',', '')) ELSE null END,
       accuracy_name: line['77'],
       picklist_uid: CASE WHEN line['70'] IS NOT NULL THEN toInteger(replace(line['70'], ',', '')) ELSE null END,
       picklist_name: line['20'],
       remarks: line['14'],
       approval_status: line['8'],
       successor_uid: CASE WHEN line['78'] IS NOT NULL THEN toInteger(replace(line['78'], ',', '')) ELSE null END,
       reason: line['24'],
       creator_uid: CASE WHEN line['13'] IS NOT NULL THEN toInteger(replace(line['13'], ',', '')) ELSE null END,
       author_uid: CASE WHEN line['6'] IS NOT NULL THEN toInteger(replace(line['6'], ',', '')) ELSE null END,
       author: line['12'],
       reference: line['13'],
       line_uid: CASE WHEN line['53'] IS NOT NULL THEN toInteger(replace(line['53'], ',', '')) ELSE null END,
       collection_uid: CASE WHEN line['50'] IS NOT NULL THEN toInteger(replace(line['50'], ',', '')) ELSE null END,
       collection_name: line['68'],
       lh_commonality: line['80'],
       rh_commonality: line['81']
   })
   
   // Create relationships between entities and fact
   WITH rh, lh, rel
   CALL apoc.create.relationship(lh, 'role', {}, rel) YIELD rel AS foo
   WITH rh, rel
   CALL apoc.create.relationship(rel, 'role', {}, rh) YIELD rel AS bar
   
   RETURN count(rel) as count")

;; Define a connection function with retry logic for transactions
(defn with-retry
  "Execute a function with Neo4j transaction with retries on transient errors"
  [f & [max-retries]]
  (let [max-retries (or max-retries 3)
        driver (get-driver)]
    (loop [retries 0]
      (let [[success result] (try
                               [true (neo4j/with-transaction driver tx
                                       (f tx))]
                               (catch TransientException e
                                 (if (< retries max-retries)
                                   [false e]
                                   (throw e)))
                               (catch Exception e
                                 (throw e)))]
        (if success
          result
          (do
            (log/warnf "Transient Neo4j error, retrying (%d/%d): %s" 
                     (inc retries) max-retries (.getMessage result))
            (Thread/sleep (+ 200 (* retries 100))) ; Exponential backoff
            (recur (inc retries))))))))

;; For compatibility with setup.clj
(defn execute-query!
  "Executes a raw Cypher query with parameters. Used by setup.clj."
  [cypher params]
  (try
    (let [driver (get-driver)
          result (neo4j/with-transaction driver tx
                   (let [session-result (neo4j/execute tx cypher params)]
                     (doall session-result)))]
      {:success true :results result})
    (catch Exception e
      (log/error e "Failed to execute Cypher query")
      {:success false :error (.getMessage e)})))

(defn database-empty?
  "Checks if the Neo4j database has any nodes."
  []
  (log/info "Checking if database is empty...")
  (try
    (let [driver (get-driver)
          results (neo4j/with-transaction driver tx
                    (let [query-results (count-nodes-query tx {})]
                      ;; Fully realize results inside the transaction
                      (doall query-results)))
          first-result (first results)
          count (or (:node_count first-result) 0)]
      (log/infof "Database node count: %d" count)
      (zero? count))
    (catch Exception e
      (log/error e "Failed to check if database is empty")
      (throw (ex-info "Failed to query database node count" {:error (.getMessage e)})))))

(defn load-nodes-from-csv!
  "Loads nodes from a CSV file using LOAD CSV.
   fileName should be relative to Neo4j's import directory."
  [fileName]
  (log/infof "Creating nodes from CSV file: %s" fileName)
  (let [file-url (str "file:///" fileName)] 
    (try
      (let [driver (get-driver)
            result (neo4j/with-transaction driver tx
                    (let [query-result (load-nodes-from-csv-query tx {:file_url file-url})]
                      ;; Fully realize results inside the transaction
                      (doall query-result)))
            count (:count (first result))]
        (log/infof "Successfully loaded nodes from CSV file. Created/matched %d nodes." count)
        {:success true})
      (catch Exception e
        (log/error e "Failed to load nodes from CSV file")
        {:success false :error (.getMessage e)}))))

(defn load-relationships-from-csv!
  "Loads facts and relationships from a CSV file using LOAD CSV.
   fileName should be relative to Neo4j's import directory."
  [fileName]
  (log/infof "Creating relationships from CSV file: %s" fileName)
  (let [file-url (str "file:///" fileName)]
    (try
      (let [driver (get-driver)
            result (neo4j/with-transaction driver tx
                    (let [query-result (load-relationships-from-csv-query tx {:file_url file-url})]
                      ;; Fully realize results inside the transaction
                      (doall query-result)))
            count (:count (first result))]
        (log/infof "Successfully loaded relationships from CSV file. Created %d relationships." count)
        {:success true})
      (catch Exception e
        (log/error e "Failed to load relationships from CSV file")
        {:success false :error (.getMessage e)}))))

;; Close resources when application shuts down
(defn shutdown []
  (log/info "Shutting down Neo4j connection...")
  (when @default-driver
    (neo4j/disconnect @default-driver)
    (reset! default-driver nil)
    (log/info "Neo4j connection closed")))

(log/info "Prism DB namespace loaded.")

;; Register shutdown hook
(.addShutdownHook (Runtime/getRuntime) 
                  (Thread. shutdown))