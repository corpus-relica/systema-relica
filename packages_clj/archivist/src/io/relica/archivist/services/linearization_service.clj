(ns io.relica.archivist.services.linearization-service
  (:require [mount.core :refer [defstate]]
            [clojure.set :as set]
            [clojure.tools.logging :as log]
            [io.relica.archivist.services.graph-service :as graph-service]
            [io.relica.archivist.db.queries :as queries]))

;; Core C3 implementation
(defn- merge-sequences
  "Merges sequences according to C3 linearization rules."
  [sequences]
  (loop [result []
         seqs (mapv vec sequences)]
    (if (empty? (remove empty? seqs))
      result
      (let [candidates (for [s (remove empty? seqs)
                             :let [head (first s)]
                             :when (not-any? #(some #{head} (rest %))
                                             (remove empty? seqs))]
                         head)]
        (if (empty? candidates)
          (throw (ex-info "Cannot find C3 linearization for input"
                          {:sequences (remove empty? seqs)
                           :partial-result result}))
          (let [candidate (first candidates)]
            (recur (conj result candidate)
                   (mapv #(filterv (complement #{candidate}) %) seqs))))))))

(defn- linearize-node
  "Linearizes a single node and its parents."
  [graph node results visiting {:keys [python? reverse?] :as opts}]
  (if (contains? @results node)
    (get @results node)
    (if (contains? @visiting node)
      (throw (ex-info "Circular dependency found"
                      {:node node
                       :visiting @visiting
                       :current-results @results}))
      (let [_ (swap! visiting conj node)
            parents (get graph node [])
            ordered-parents (if reverse? (reverse parents) parents)
            linearized-parents (mapv #(linearize-node graph % results visiting opts)
                                     ordered-parents)
            sequences (if python?
                        (conj (vec linearized-parents) ordered-parents)
                        linearized-parents)
            result (if (seq sequences)
                     (into [node] (merge-sequences sequences))
                     [node])]
        (swap! visiting disj node)
        (swap! results assoc node result)
        result))))

(defprotocol LinearizationServiceOperations
  (linearize [this graph]
    "Computes C3 linearization for a graph of inheritance relationships.")
  (calculate-lineage [this uid]
    "Calculate the lineage for a specific entity UID"))

;; Helper function for linearization
(defn- do-linearize [graph opts]
  (let [results (atom {})
        visiting (atom #{})]
    (doseq [head (keys graph)]
      (linearize-node graph head results visiting opts))
    @results))

;; Helper function to process Neo4j paths (needs refinement)
(defn- build-parent-map-from-paths
  "Processes Neo4j path results from specialization-hierarchy query,
   extracts IS_A/QUALIFIES relationships from the properties of 'Fact' nodes within the path segments,
   and returns a map like {'ChildUID' ['ParentUID1', ...]} for linearization."
  [neo4j-paths]
  (let [parent-map (atom {})] ; The final map for linearization

    ;; 1. Build the parent map by extracting info from 'Fact' nodes in the path
    (doseq [path-result neo4j-paths]
      (when-let [path-obj (get path-result :path)] ; Get the InternalPath object
        (try
          (doseq [node (.nodes path-obj)] ; Iterate through NODES in the path
            ;; Check if the node has the 'Fact' label
            (when (some #{"Fact"} (.labels node))
              (let [node-props (.asMap node) ; Get node properties as a map
                    ;; Convert property keys to keywords for consistent access
                    node-props-kw (into {} (map (fn [[k v]] [(keyword k) v]) node-props))
                    child-uid (:lh_object_uid node-props-kw)
                    parent-uid (:rh_object_uid node-props-kw)
                    rel-type (:rel_type_uid node-props-kw)]

                ;; Debugging output (optional)
                 (log/debug "Processing Fact Node" {:props node-props-kw})

                ;; Only consider IS_A (1146) or QUALIFIES (1726) relationships defined on the Fact node
                (when (and child-uid parent-uid (or (= rel-type 1146) (= rel-type 1726)))
                  (swap! parent-map update child-uid (fnil conj []) parent-uid)))))
          (catch Exception e
            (log/error e "Error processing path nodes" {:path-result path-result})))))

    ;; 2. Ensure all nodes mentioned exist as keys (important for do-linearize)
    (let [all-nodes (set (concat (keys @parent-map) (flatten (vals @parent-map))))
          final-map @parent-map]
       ;; Use reduce to build the final map ensuring all nodes are present
       (reduce (fn [acc node]
                 (if (contains? acc node)
                   acc ; Node already exists as a key
                   (assoc acc node []))) ; Add node with empty parent list
               final-map
               all-nodes))))

;; Service component
(defrecord LinearizationServiceComponent []
  LinearizationServiceOperations

  (linearize
    [_ graph]
    (do-linearize graph {}))

  (calculate-lineage [_ uid] ; Changed 'this' to '_' as it's not used directly
    (try
      ;; 1. Execute the hierarchy query
      (let [results (graph-service/exec-query @graph-service/graph-service
                                              queries/specialization-hierarchy
                                              {:uid uid, :rel_type_uids [1146 1726]}) ; Updated rel_type_uids
            _ (log/debug "Neo4j path results for UID:" uid results)
            ;; 2. Process Neo4j path results to build parent map
            graph-map (build-parent-map-from-paths results)
            _ (log/debug "Graph map for UID:" uid graph-map) ; Debugging the graph map
                                        ]

        ;; 3. Perform linearization
        (if (empty? graph-map)
          ;; If no hierarchy found (or graph map is empty), lineage is just the node itself
          (do
            (log/warn "No hierarchy found or empty graph map for UID:" uid " - returning [uid]")
            [uid])
          (let [linearization-result (do-linearize graph-map {})
                raw-lineage (get linearization-result uid [])]
            ;; 4. Extract the lineage for the specific UID
            ;; Parse UIDs to integers (like TS version) - assuming UIDs are numeric or string representations
            (mapv #(if (string? %) (Long/parseLong %) (long %)) raw-lineage))))

      (catch Exception e
        (log/error e "Failed to calculate lineage for UID:" uid)
        []))))

;; Component lifecycle management
(defn create-linearization-service-component []
  (->LinearizationServiceComponent))

(defonce linearization-service-comp (atom nil))

(defn start []
  (println "Starting Linearization Service...")
  (let [service (create-linearization-service-component)]
    (reset! linearization-service-comp service)
    service))

(defn stop []
  (println "Stopping Linearization Service..."))

;; Example usage in REPL
(comment

  ;; Start the service
  (def service (start))

  (calculate-lineage service 1146)


  ;; Basic usage
  (def graph {"C" ["A" "B"]
              "A" []
              "B" []})

  (linearize service graph)

  ;; => {"A" ["A"], "B" ["B"], "C" ["C" "A" "B"]}

  ;; Python-style linearization
  ;; (linearize service graph {:python? true})

  ;; Complex example
  (def complex-graph
    {"X" ["A" "B" "C"]
     "A" ["D" "E"]
     "B" ["E" "F"]
     "C" ["F"]
     "D" []
     "E" []
     "F" []})

  (linearize service complex-graph)


  (linearize service complex-graph {:python? true}))
