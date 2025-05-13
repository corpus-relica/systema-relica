(ns io.relica.archivist.basis.relation
  (:require [clojure.core.async :refer [<! go]]
            [clojure.tools.logging :as log]
            [io.relica.archivist.basis.core :refer [get-relations get-relations-filtered]]
            [io.relica.archivist.basis.lineage :refer [get-lineage]]
            [io.relica.archivist.basis.cone :refer [get-cone]]
            [clojure.pprint :as pp]))

;; ---------------------------------------------------

(defn get-realization [rel_type_uid]
  (go
    (let [relations (<! (get-relations rel_type_uid {:edge-type 5091
                                                     :direction :outgoing}))]
      (if (seq relations)
        (let [realization (first relations)]
          realization)
        nil))))

(defn get-realized [rel_type_uid]
  (go
    (let [relations (<! (get-relations rel_type_uid {:edge-type 5091
                                                     :direction :incoming}))]
      (if (seq relations)
        (let [realized (first relations)]
          realized)
        nil))))

;; get specialization
;; get specialized

;; get classification
;; get classified

;; ----------------------------------------------------

;; Role requirements for relations
(defn get-required-roles
  "Get the required roles for a relation type, checking up lineage if needed.
   Returns pair of [role1 role2] facts, or with metadata version returns
   {:role1 {:fact fact :distance n} :role2 {:fact fact :distance m}}"
  ([relation-type-uid]
   (get-required-roles relation-type-uid false))
  
  ([relation-type-uid include-metadata?]
   (go
    (try
      (let [lineage (get-lineage relation-type-uid)
            ;; Function to find first role up lineage
            find-role (fn [edge-type]
                       (go
                         (loop [[current & rest] lineage
                                distance 0]
                           (when current
                             (let [role (<! (get-relations-filtered current
                                              {:direction :outgoing
                                               :edge-type edge-type
                                               :filter-fn #(= (:rel_type_uid %) edge-type)}))
                                   role-fact (first role)]
                               (if role-fact
                                 (if include-metadata?
                                   {:fact role-fact :distance distance}
                                   role-fact)
                                 (recur rest (inc distance))))))))]
        ;; Find both roles
        (let [role1 (<! (find-role 4731))  ; requires-role-1
              role2 (<! (find-role 4733))]  ; requires-role-2
          (if include-metadata?
            {:role1 role1 :role2 role2}
            [role1 role2])))
      (catch Exception e
        (log/error "Error in get-required-roles:" (ex-message e))
        (if include-metadata?
          {:role1 nil :role2 nil}
          [nil nil]))))))

(defn get-required-role-uids
  "Get the required role UIDs for a relation type.
   Returns pair of [role1 role2] UIDs"
  [relation-type-uid]
  (go
    (try
      (let [[role1 role2] (<! (get-required-roles relation-type-uid))]
        [(if role1 (:rh_object_uid role1) nil)
         (if role2 (:rh_object_uid role2) nil)])
      (catch Exception e
        (log/error "Error in get-required-role-uids:" (ex-message e))
        [nil nil]))))

;; Role inheritance
(defn get-inheritable-roles
  "Get all roles that a kind can play through inheritance
   Returns set of role facts"
  [kind-uid]
  (go
    (try
      (let [lineage (get-lineage kind-uid)
            ;; Collect roles sequentially using loop/recur
            roles (loop [ancestors lineage
                         accumulated []]
                   (if (seq ancestors)
                     (let [ancestor (first ancestors)
                           new-roles (<! (get-relations ancestor
                                                      {:direction :outgoing
                                                       :edge-type 4714}))]
                       (recur (rest ancestors)
                              (concat accumulated new-roles)))
                     accumulated))]
        roles)
      (catch Exception e
        (log/error "Error in get-inheritable-roles:" (ex-message e))
        []))))

(defn compatible-role?
  "Determine if a role can fulfill a required role.
   A role is compatible if it is either the same role or a specialization of it.

   Parameters:
   - role: The role to check
   - required-role: The role requirement to check against

   Returns: Boolean indicating compatibility"
  [role-uid req-role-uid]
  (go
    (try
      (let [role-lineage (get-lineage role-uid)]
        ;; Role is compatible if required role appears in its lineage
        (contains? (set role-lineage) req-role-uid))
      (catch Exception e
        (log/error "Error in compatible-role?" (ex-message e))
        false))))

(defn roles-compatible?
  "Determine if an entity can play the roles required by a relation.
   Checks both inherited role capabilities and role compatibility.
   Parameters:
   - entity-uid: Entity to check
   - relation: Relation fact to check against
   Returns: Boolean indicating if entity can play required roles"
  [entity-uid relation-type-uid]
  (go
    (try
      (let [;; Get required roles for this relation type
            [req-role1 req-role2] (<! (get-required-roles relation-type-uid))
            ;; Get all roles this entity can play through inheritance
            playable-roles (<! (get-inheritable-roles entity-uid))
            ;; Check if any inherited role can fulfill either required role
            ;; We need to check each role sequentially within the go block
            can-play-role1? (loop [[role & rest-roles] playable-roles]
                              (cond
                                (nil? role) false
                                (<! (compatible-role? role req-role1)) true
                                :else (recur rest-roles)))
            can-play-role2? (loop [[role & rest-roles] playable-roles]
                              (cond
                                (nil? role) false
                                (<! (compatible-role? role req-role2)) true
                                :else (recur rest-roles)))]
        ;; Entity must be able to play at least one of the required roles
        (or can-play-role1? can-play-role2?))
      (catch Exception e
        (log/error "Error in roles-compatible?" (ex-message e))
        false))))

(defn can-play-role?
  "Check if an entity can play a specific role, either directly or through inheritance.
   Returns boolean (wrapped in channel due to async nature)"
  [entity-uid role-uid]
  (go
    (try
      (let [lineage (get-lineage entity-uid)
            ;; Check each ancestor for the role relation
            found (loop [[ancestor & rest] lineage]
                   (if ancestor
                     (let [role-relations (<! (get-relations-filtered ancestor
                                              {:direction :outgoing
                                               :edge-type 4714
                                               :filter-fn #(= (:rh_object_uid %) role-uid)}))]
                       (if (seq role-relations)
                         true
                         (recur rest)))
                     false))]
        found)
      (catch Exception e
        (log/error "Error in can-play-role?:" (ex-message e))
        false))))

(defn most-specific
  "Get the 'most specific' concept from a set of concepts;
   presumably the one with the longest lineage.
   Returns the UID of the most specific concept."
  [concepts]
  (go
    (try
      (let [;; Convert concepts set to a vector for indexed access
            concepts-vec (vec concepts)
            ;; Get lineage for each concept (synchronously)
            lineages (map get-lineage concepts-vec)
            ;; Get the length of each lineage
            lineage-lengths (map count lineages)
            ;; Find the index of the longest lineage
            max-index (first (apply max-key second (map-indexed vector lineage-lengths)))]
        ;; Return the concept with the longest lineage
        (nth concepts-vec max-index))
      (catch Exception e
        (log/error "Error in most-specific:" (ex-message e))
        nil))))

(defn expand-binary-fact
  "Expand binary fact into explicit role-based form
   Returns map containing full role structure"
  [fact]
  (go
    (let [;; isolate relevant uids
          lh-object-uid (:lh_object_uid fact)
          rh-object-uid (:rh_object_uid fact)
          rel-type-uid (:rel_type_uid fact)
          ;; get required roles of relation type
          [role1-uid role2-uid] (<! (get-required-role-uids rel-type-uid))
          ;; get all subtypes of the required roles
          role1-cone (<! (get-cone role1-uid))
          role2-cone (<! (get-cone role2-uid))
          ;; get the roles the objects can play
          lh-object-roles (<! (get-inheritable-roles lh-object-uid))
          rh-object-roles (<! (get-inheritable-roles rh-object-uid))
          ;; filter the roles to only those that are in the cone of the required roles
          lh-roles (filter #(contains? role1-cone (:rh_object_uid %)) lh-object-roles)
          rh-roles (filter #(contains? role2-cone (:rh_object_uid %)) rh-object-roles)
          ;; get the most specific role from the filtered roles
          lh-role-uids (set (map :rh_object_uid lh-roles))
          rh-role-uids (set (map :rh_object_uid rh-roles))
          lh-role-uid (<! (most-specific lh-role-uids))
          rh-role-uid (<! (most-specific rh-role-uids))
          lh-role (first (filter #(= (:rh_object_uid %) lh-role-uid) lh-object-roles))
          rh-role (first (filter #(= (:rh_object_uid %) rh-role-uid) rh-object-roles))]
      (merge
        fact
        {:lh_role_uid (:rh_object_uid lh-role)
         :lh_role_name (:rh_object_name lh-role)
         :rh_role_uid (:rh_object_uid rh-role)
         :rh_role_name (:rh_object_name rh-role)
         }))))

(comment
  ;; Example usage
  (go
    (let [val (<! (expand-binary-fact {:lh_object_uid 1146
                                       :rh_object_uid 3941
                                       :rel_type_uid 790123}))]
      (pp/pprint val)))

  (go
    (let [val (<! (expand-binary-fact {:lh_object_uid 1483
                                       :rh_object_uid 730044
                                       :rel_type_uid 1436}))]
      (pp/pprint val)))

  (pp/pprint))

  ;; ---------------------------------------------------

  ;; Example usage of the functions

  ;; (go
  ;;   (let [val (<! (expand-binary-fact {:lh_object_uid 1146
  ;;                                      :rh_object_uid 3941
  ;;                                      :rel_type_uid 790123}))]
  ;;     (pp/pprint val))))

;; Expand binary to explicit
;; (defn expand-binary-relation
;;   "Expand binary relation into explicit role-based form
;;    Returns map containing full role structure"
;;   [lh-object rel-type rh-object]
;;   (go
;;     (let [[role1 role2] (<! (get-required-roles rel-type))
;;           _ (pp/pprint (compatible-role? lh-object role1))
;;           lh-roles (<! (get-inheritable-roles lh-object))
;;           rh-roles (<! (get-inheritable-roles rh-object))
;;           ;; Match inherited roles against requirements
;;           lh-matching-role (first (filter #(compatible-role? (:rh_object_uid %) (:rh_object_uid role1)) lh-roles))
;;           rh-matching-role (first (filter #(compatible-role? (:rh_object_uid %) (:rh_object_uid role2)) rh-roles))]
;;       {:lh_object lh-object
;;        :lh_role lh-matching-role
;;        :relation rel-type
;;        :rh_role rh-matching-role
;;        :rh_object rh-object})))

;;Get inherited relations
;; (defn get-inherited-relations
;;   "Get relations that could apply through inheritance, preserving lineage order

;;    Returns: Vector of maps, each containing:
;;    - :level - Distance from original entity in lineage
;;    - :ancestor - The ancestor entity where relation was found
;;    - :relations - Vector of relations found at this level

;;    Order is maintained from most specific (level 0) to most general"
;;   ([entity-uid]
;;    (get-inherited-relations entity-uid nil nil))

;;   ([entity-uid rel-types]
;;    (get-inherited-relations entity-uid rel-types nil))

;;   ([entity-uid rel-types {:keys [filter-fn include-subtypes?]
;;                           :or {include-subtypes? true}}]
;;    (go
;;     (try
;;       (let [lineage (get-lineage entity-uid)
;;             ;; Build ordered sequence of inheritance levels
;;             levels (for [[ancestor level] (map vector lineage (range))]
;;                      (let [relations (<! (get-relations ancestor
;;                                             {:edge-type rel-types
;;                                              :include-subtypes? include-subtypes?}))
;;                            filtered (if filter-fn
;;                                      (filter filter-fn relations)
;;                                      relations)
;;                            ;; this is a bit redundant re: the rules of gellish
;;                            ;; i.e. the fact that the relations were considering are ones
;;                            ;; involving a supertype of the input entity(-uid) implies
;;                            ;; that the relations also apply to the entity(-uid) itself.
;;                            ;; nonetheless, this mechanism supplies some validation/confirmation
;;                            ;; we can be assured that structures based on
;;                            ;; anything that makes it through this
;;                            ;; are in fact semantically verifiable
;;                            compatible (filter #(roles-compatible? entity-uid (:rel_type_uid %))
;;                                             filtered)]
;;                        {:level level
;;                         :ancestor ancestor
;;                         :relations (vec compatible)}))]
;;         ;; Return vector preserving order
;;         (vec (filter #(seq (:relations %)) levels)))
;;       (catch Exception e
;;         (log/error "Error in get-inherited-relations:" (ex-message e))
;;         [])))))

(defn get-inherited-relations
  "Get relations that could apply through inheritance, preserving lineage order
   Returns: Vector of maps, each containing:
   - :level - Distance from original entity in lineage
   - :ancestor - The ancestor entity where relation was found
   - :relations - Vector of relations found at this level
   Order is maintained from most specific (level 0) to most general"
  ([entity-uid]
   (get-inherited-relations entity-uid nil nil))
  ([entity-uid rel-types]
   (get-inherited-relations entity-uid rel-types nil))
  ([entity-uid rel-types {:keys [filter-fn include-subtypes?]
                          :or {include-subtypes? true}}]
   (go
    (try
      (let [lineage (get-lineage entity-uid)
            ;; Process each ancestor sequentially within the go block
            levels (loop [ancestors lineage
                          level 0
                          result []]
                     (if (empty? ancestors)
                       result
                       (let [
                             ancestor (first ancestors)
                             relations (<! (get-relations ancestor
                                                         {:edge-type rel-types
                                                          :include-subtypes? include-subtypes?}))
                             pre-filtered (filter #(not (contains? #{1146 ;; specialization
                                                                     1981 ;; synonym
                                                                     1986 ;; inverse
                                                                     } (:rel_type_uid %))) relations)
                             filtered (if filter-fn
                                       (filter filter-fn pre-filtered)
                                       pre-filtered)

                             ;; _ (pp/pprint filtered)
                             ;; Process each relation sequentially to check compatibility
                             ;; compatible (loop [rels filtered
                             ;;                  compatible-rels []]
                             ;;              (if (empty? rels)
                             ;;                compatible-rels
                             ;;                (let [rel (first rels)
                             ;;                      is-compatible? (<! (roles-compatible? entity-uid (:rel_type_uid rel)))]
                             ;;                  (recur (rest rels)
                             ;;                         (if is-compatible?
                             ;;                           (conj compatible-rels rel)
                             ;;                           compatible-rels)))))
                             level-map {:level level
                                        :ancestor ancestor
                                        :relations (vec filtered)}
                             ]
                         (recur (rest ancestors)
                                (inc level)
                                (if (seq (:relations level-map))
                                  (conj result level-map)
                                  result)))))]
        ;; Return vector preserving order
        (vec levels))
      (catch Exception e
        (log/error "Error in get-inherited-relations:" (ex-message e))
        [])))))

(comment

  (go
    (let [val (<! (get-inherited-relations 1146))]
      (pp/pprint val)))

)
;; Role validation
(defn validate-role-players
  "Validate that entities can play the required roles in a relation"
  [relation-type lh-object rh-object]
  (go
    (let [[req-role1 req-role2] (<! (get-required-roles relation-type))
          lh-roles (<! (get-inheritable-roles lh-object))
          rh-roles (<! (get-inheritable-roles rh-object))]
      (and (some #(compatible-role? % req-role1) lh-roles)
           (some #(compatible-role? % req-role2) rh-roles)))))

(comment
  ;; Example usage
  (go
    (let [val (<! (get-realization 1436))]
      (pp/pprint  val)))

  (go
    (let [val (<! (get-realized 1436))]
      (pp/pprint  val)))

  (go
    (let [val (<! (get-realized 5111))]
      (pp/pprint val)))

  (println))

  ;; ---------------------------------------------------

  ;; Example usage of the functions)

(comment

  (go
    (let [val (<! (get-required-roles 1146))]
      (println "Required roles for 1146:" val)))

  (go
    (let [val (<! (get-required-roles 4718))]
      (println "Required roles for 1146:" val)))

  (go
    (let [val (<! (get-required-roles 790123))]
      (pp/pprint val)))

  (go
    (let [val (<! (get-required-roles 790123 true))]
      (pp/pprint val)))

  (go
    (let [val (<! (get-required-roles 1922))]
      (pp/pprint val)))

  ;; ----------------------------------------------

  (go
    (let [val (<! (get-inheritable-roles 1146))]
      (pp/pprint val)))

  (go
    (let [val (<! (get-inheritable-roles 3941))]
      (pp/pprint val)))

  (go
    (let [val (<! (get-inheritable-roles 193671))]
      (pp/pprint val)))

  ;; ----------------------------------------------

  (go
    (let [val (<! (compatible-role? 1146 790123))]
      (println "Compatible role?" val)))

  (go
    (let [val (<! (compatible-role? 3941 4729))]
      (println "Compatible role?" val)))

  ;; ----------------------------------------------

  (go
    (let [val (<! (roles-compatible? 193671 1917))]
      (pp/pprint val)))

  (go
    (let [val (<! (roles-compatible? 193671 1922))]
      (pp/pprint val)))

  ;; ----------------------------------------------

  (go
    (let [val (<! (can-play-role? 193671 3941))]
      (pp/pprint val)))

  ;; ----------------------------------------------

  ;; (go
  ;;   (let [val (<! (expand-binary-relation 193671 1922 193671))]
  ;;     (pp/pprint val)))

  ;; ----------------------------------------------


  (print))
