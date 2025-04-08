(ns io.relica.prism.db
  (:require [neo4j-clj.core :as neo4j]
            [io.relica.prism.config :as config]
            [taoensso.timbre :as log])
  (:import (org.neo4j.driver.exceptions TransientException)))

;; Connection configuration
(def db-config
  {:uri (config/neo4j-uri)
   :user (config/neo4j-user)
   :password (config/neo4j-password)})

;; Define a Neo4j connection
(def default-driver (neo4j/connect db-config))

;; Define a connection function with retry logic
(defn with-retry
  "Execute a function with Neo4j session with retries on transient errors"
  [f & [max-retries]]
  (let [max-retries (or max-retries 3)]
    (loop [retries 0]
      (let [[success result] (try
                               [true (neo4j/with-session default-driver session
                                       (f session))]
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

(defn execute-query!
  "Executes a Cypher query with parameters using neo4j-clj.
   Logs query and handles basic errors."
  [query params]
  (log/debugf "Executing Cypher: %s\nParams: %s" query params)
  (try
    (with-retry
      (fn [session]
        (neo4j/execute session query params))
      3)
    (log/debug "Cypher execution successful.")
    {:success true}
    (catch Exception e
      (log/errorf e "Error executing Cypher query: %s" query)
      {:success false :error (.getMessage e)})))

(defn execute-query
  "Executes a Cypher query with parameters and returns results."
  [query params]
  (log/debugf "Executing Cypher: %s\nParams: %s" query params)
  (try
    (let [results (with-retry
                    (fn [session]
                      (neo4j/execute session query params))
                    3)]
      (log/debugf "Cypher query returned %d results." (count results))
      {:success true :results results})
    (catch Exception e
      (log/errorf e "Error executing Cypher query: %s" query)
      {:success false :error (.getMessage e)})))

(defn database-empty?
  "Checks if the Neo4j database has any nodes."
  []
  (log/info "Checking if database is empty...")
  (let [query "MATCH (n) RETURN count(n) AS node_count LIMIT 1"
        {:keys [success results error]} (execute-query query {})]
    (if success
      (let [first-result (first results)
            count (or (:node_count first-result) 0)]
        (log/infof "Database node count: %d" count)
        (zero? count))
      (do
        (log/error "Failed to check if database is empty:" error)
        (throw (ex-info "Failed to query database node count" {:error error}))))))

(defn load-nodes-from-csv!
  "Loads nodes from a CSV file using LOAD CSV.
   fileName should be relative to Neo4j's import directory."
  [fileName]
  (log/infof "Creating nodes from CSV file: %s" fileName)
  (let [;; NOTE: Ensure fileName is just the base name, e.g., "0.csv"
        ;; The path is relative to the Neo4j server's configured import directory
        cypher (format "
          LOAD CSV WITH HEADERS FROM 'file:///%s' AS line
          MERGE (lh:Entity {uid: toInteger(replace(line['2'], \",\", \"\"))})
          MERGE (rh:Entity {uid: toInteger(replace(line['15'], \",\", \"\"))})
        " fileName)]
    (execute-query! cypher {})))

(defn load-relationships-from-csv!
  "Loads facts and relationships from a CSV file using LOAD CSV.
   fileName should be relative to Neo4j's import directory."
  [fileName]
  (log/infof "Creating relationships from CSV file: %s" fileName)
  (let [;; NOTE: Ensure fileName is just the base name, e.g., "0.csv"
        ;; The path is relative to the Neo4j server's configured import directory
        cypher (format "
LOAD CSV WITH HEADERS FROM 'file:///%s' AS line
MATCH (lh:Entity {uid: toInteger(replace(line['2'], \",\", \"\"))})
MATCH (rh:Entity {uid: toInteger(replace(line['15'], \",\", \"\"))})
CREATE (rel:Fact {
    sequence: toInteger(replace(line['0'], \",\", \"\")),
    language_uid: toInteger(replace(line['69'], \",\", \"\")),
    language: line['54'],
    lh_context_uid: toInteger(replace(line['71'], \",\", \"\")),
    lh_context_name: line['16'],
    lh_reality: line['39'],
    lh_object_uid: toInteger(replace(line['2'], \",\", \"\")),
    lh_cardinalities: line['44'],
    lh_object_name: line['101'],
    lh_role_uid: toInteger(replace(line['72'], \",\", \"\")),
    lh_role_name: line['73'],
    intention_uid: toInteger(replace(line['5'], \",\", \"\")),
    intention: line['43'],
    val_context_uid: toInteger(replace(line['19'], \",\", \"\")),
    val_context_name: line['18'],
    fact_uid: toInteger(replace(line['1'], \",\", \"\")),
    fact_description: line['42'],
    rel_type_uid: toInteger(replace(line['60'], \",\", \"\")),
    rel_type_name: line['3'],
    rh_role_uid: toInteger(replace(line['74'], \",\", \"\")),
    rh_role_name: line['75'],
    rh_object_uid: toInteger(replace(line['15'], \",\", \"\")),
    rh_cardinalities: line['45'],
    rh_object_name: line['201'],
    partial_definition: line['65'],
    full_definition: line['4'],
    uom_uid: toInteger(replace(line['66'], \",\", \"\")),
    uom_name: line['7'],
    accuracy_uid: toInteger(replace(line['76'], \",\", \"\")),
    accuracy_name: line['77'],
    picklist_uid: toInteger(replace(line['70'], \",\", \"\")),
    picklist_name: line['20'],
    remarks: line['14'],
    approval_status: line['8'],
    successor_uid: toInteger(replace(line['78'], \",\", \"\")),
    reason: line['24'],
    effective_from: date(
        CASE
            WHEN apoc.date.parse(line['9'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['9'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['9'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['9'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['9'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['9'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
            ELSE NULL
        END
    ),
    creator_uid: toInteger(replace(line['13'], \",\", \"\")),
    latest_update: date(
        CASE
            WHEN apoc.date.parse(line['10'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['10'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['10'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['10'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['10'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['10'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
            ELSE NULL
        END
    ),
    author_uid: toInteger(replace(line['6'], \",\", \"\")),
    author: line['12'],
    copy_date: date(
        CASE
            WHEN apoc.date.parse(line['22'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['22'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['22'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['22'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['22'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['22'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
            ELSE NULL
        END
    ),
    availability_date: date(
        CASE
            WHEN apoc.date.parse(line['23'], 'ms', 'yyyy-MM-dd') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['23'], 'ms', 'yyyy-MM-dd'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['23'], 'ms', 'MM/dd/yyyy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['23'], 'ms', 'MM/dd/yyyy'), 'ms', 'yyyy-MM-dd')
            WHEN apoc.date.parse(line['23'], 'ms', 'dd-MMM-yy') IS NOT NULL THEN apoc.date.format(apoc.date.parse(line['23'], 'ms', 'dd-MMM-yy'), 'ms', 'yyyy-MM-dd')
            ELSE NULL
        END
    ),
    addressee_uid: toInteger(replace(line['178'], \",\", \"\")),
    addressee_name: line['179'],
    reference: line['13'],
    line_uid: toInteger(replace(line['53'], \",\", \"\")),
    collection_uid: toInteger(replace(line['50'], \",\", \"\")),
    collection_name: line['68'],
    lh_commonality: line['80'],
    rh_commonality: line['81']
})

WITH rh, lh, rel
CALL apoc.create.relationship(lh, \"role\", {}, rel) YIELD rel AS foo
WITH rh, rel
CALL apoc.create.relationship(rel, \"role\", {}, rh) YIELD rel AS bar

RETURN count(rel)
        " fileName)]
    (execute-query! cypher {})))

;; Close resources when application shuts down
(defn shutdown []
  (log/info "Shutting down Neo4j connection...")
  (neo4j/disconnect default-driver))

(log/info "Prism DB namespace loaded.")

;; Register shutdown hook
(.addShutdownHook (Runtime/getRuntime) 
                  (Thread. shutdown))