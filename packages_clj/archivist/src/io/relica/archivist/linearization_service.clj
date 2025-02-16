(ns io.relica.archivist.linearization-service
  (:require [mount.core :refer [defstate]]
            [clojure.set :as set]))

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

;; Service component
(defrecord LinearizationServiceComponent []
  LinearizationServiceOperations

  ;; (linearize
  ;;   ([this graph]
  ;;    (do-linearize graph {}))
  ;;   ([this graph options]
  ;;    (do-linearize graph options)))

  (linearize
    [this graph]
     (do-linearize graph {}))

  (calculate-lineage [this uid]
    ;; Placeholder for lineage calculation
    []))

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

;; (ns io.relica.archivist.linearization.c3
;;   (:require [clojure.set :as set]
;;             [clojure.pprint :as pp]))


;; (defn linearize
;;   "Computes C3 linearization for a graph of inheritance relationships.

;;    Options:
;;    :python? - If true, uses Python-style linearization (includes parent list)
;;    :reverse? - If true, reverses parent order before processing

;;    Returns a map of {node -> linearized-order}"
;;   ([graph]
;;    (linearize graph {}))
;;   ([graph {:keys [python? reverse?] :or {python? false reverse? false} :as opts}]
;;    (let [results (atom {})
;;          visiting (atom #{})]
;;      (doseq [node (keys graph)]
;;        (linearize-node graph node results visiting opts))
;;      @results)))

;; (comment
;;   ;; Test case 1: Simple inheritance
;;   (def simple-graph
;;     {"C" ["A" "B"]
;;      "A" []
;;      "B" []})

;;   (linearize simple-graph)

;;   ;; => {"A" ["A"], "B" ["B"], "C" ["C" "A" "B"]}

;;   ;; Test case 2: Diamond inheritance
;;   (def diamond-graph
;;     {"D" []
;;      "B" ["D"]
;;      "C" ["D"]
;;      "A" ["B" "C"]})

;;   (linearize diamond-graph)

;;   ;; Test case 3: Complex inheritance
;;   (def complex-graph
;;     {"X" ["A" "B" "C"]
;;      "A" ["D" "E"]
;;      "B" ["E" "F"]
;;      "C" ["F"]
;;      "D" []
;;      "E" []
;;      "F" []})

;;   (println "\nStandard C3:")

;;   (pp/pprint (linearize complex-graph))

;;   (println "\nPython-style:")

;;   (pp/pprint (linearize complex-graph {:python? true}))

;;   )
