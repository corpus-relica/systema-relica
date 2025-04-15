(ns io.relica.archivist.db.queries
  (:require [neo4j-clj.core :as neo4j]))

;; ;;(neo4j/defquery match-entities-by-uid
;; (neo4j/defquery uid-search-query
;;   "MATCH (kind:Entity)--(r:Fact)-->(parent:Entity)
;;    WHERE r.rel_type_uid IN $relTypeUIDs
;;    AND r.lh_object_uid = $searchTerm
;;    AND ($collectionUID = '' OR r.collection_uid = $collectionUID)
;;    RETURN r
;;    ORDER BY r.lh_object_name
;;    SKIP $skip LIMIT $pageSize")


(neo4j/defquery fact
  "MATCH (n:Fact {fact_uid: $uid}) RETURN n")

(neo4j/defquery facts
  "MATCH (n:Fact)
  WHERE n.fact_uid IN $uids
  RETURN n")

(neo4j/defquery entity
  "MATCH (n:Entity {uid: $uid}) RETURN n")

(neo4j/defquery entities
  "MATCH (n:Entity)
  WHERE n.uid IN $uids
  RETURN n")

(neo4j/defquery partial-defs
  "MATCH (startNode:Entity {uid: $uid}), (topNode:Entity {uid: '730000'})
  MATCH path = shortestPath((startNode)-[r*]->(topNode))
  WHERE ALL(rel IN r WHERE rel.rel_type_uid = '1146')
  WITH relationships(path) as rels, startNode
  UNWIND rels as rel
  WITH rel, startNode
  WHERE rel.partial_definition IS NOT NULL
  WITH rel.partial_definition as partial_definition, rel.lh_object_uid as source_uid, apoc.path.create(startNode, [rel]) as newPath
  RETURN partial_definition, source_uid
  ORDER BY length(newPath)")

(neo4j/defquery text-search
  "MATCH (kind:Entity)-->(r:Fact)-->(parent:Entity)
  WHERE r.rel_type_uid IN $relTypeUIDs
  AND
  CASE $exactMatch
    WHEN true THEN toLower(r.lh_object_name) = toLower($searchTerm)
    ELSE toLower(r.lh_object_name) CONTAINS toLower($searchTerm)
  END
  AND ($collectionUID = '' OR r.collection_uid = $collectionUID)
  AND ($filterUIDs IS NULL OR size($filterUIDs) = 0 OR kind.uid IN $filterUIDs)
  RETURN r
  ORDER BY r.lh_object_name
  SKIP $skip LIMIT $pageSize")

(neo4j/defquery count-text-search
  "MATCH (kind:Entity)-->(r:Fact)-->(parent:Entity)
  WHERE r.rel_type_uid IN $relTypeUIDs
  AND
  CASE $exactMatch
    WHEN true THEN toLower(r.lh_object_name) = toLower($searchTerm)
    ELSE toLower(r.lh_object_name) CONTAINS toLower($searchTerm)
  END
  AND ($collectionUID = '' OR r.collection_uid = $collectionUID)
  AND ($filterUIDs IS NULL OR size($filterUIDs) = 0 OR kind.uid IN $filterUIDs)
  RETURN count(r) as total")

(neo4j/defquery uid-search
  "MATCH (kind:Entity)--(r:Fact)-->(parent:Entity)
  WHERE r.rel_type_uid IN $relTypeUIDs
  AND r.lh_object_uid = $searchTerm
  AND ($collectionUID = '' OR r.collection_uid = $collectionUID)
  RETURN r
  ORDER BY r.lh_object_name
  SKIP $skip LIMIT $pageSize")

(neo4j/defquery count-uid-search
  "MATCH (kind:Entity)-->(r:Fact)-->(parent:Entity)
  WHERE r.rel_type_uid IN $relTypeUIDs
  AND r.lh_object_uid = $searchTerm
  AND ($collectionUID = '' OR r.collection_uid = $collectionUID)
  RETURN count(r) as total")

(neo4j/defquery specialization-hierarchy
  "MATCH path = (start:Entity)-[]->(f1:Fact)-[]->(end:Entity)
  WHERE start.uid = $uid AND end.uid = 730000 AND f1.rel_type_uid IN $rel_type_uids
  RETURN path

  UNION

  MATCH path = (start:Entity)-[]->(f2:Fact)-[]->(:Entity)
  ((:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(:Entity)){0,100}
  (:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(end:Entity)
  WHERE start.uid = $uid AND end.uid = 730000 AND f2.rel_type_uid IN $rel_type_uids
  RETURN path")

(neo4j/defquery all-subtype-paths
  "MATCH path = (start:Entity)-[]->(r:Fact {rel_type_uid: 1146})-[]->(end:Entity)
  WHERE end.uid = $uid
  RETURN path

  UNION

  MATCH path = (start:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(:Entity)
  ((:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(:Entity)){0,10}
  (:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(end:Entity)
  WHERE end.uid = $uid
  RETURN path")

(neo4j/defquery specialization-fact
  "MATCH (a)--(r)-->(b)
  WHERE r.rel_type_uid = 1146 AND r.lh_object_uid = $uid
  RETURN r")

(neo4j/defquery qualification-fact
  "MATCH (a)--(r)-->(b)
  WHERE r.rel_type_uid = 1726 AND r.lh_object_uid = $uid
  RETURN r")

(neo4j/defquery supertypes
  "MATCH (a:Entity {uid: $uid})--(r)-->(b)
  WHERE r.rel_type_uid = 1146
  RETURN r")

(neo4j/defquery subtypes
  "MATCH (a)--(r)-->(b:Entity {uid: $uid})
  WHERE r.rel_type_uid = 1146 OR r.rel_type_uid = 1726
  RETURN r")

(neo4j/defquery classified
  "MATCH (a)--(r)-->(b:Entity {uid: $uid})
  WHERE r.rel_type_uid = 1225
  RETURN r")

(neo4j/defquery classification-fact
  "MATCH (a:Entity {uid: $uid})--(r)-->(b)
  WHERE r.rel_type_uid = 1225
  RETURN r")

(neo4j/defquery required-role1
  "MATCH (a:Entity {uid: $uid})--(r)-->(b)
  WHERE r.rel_type_uid = 4731
  RETURN r")

(neo4j/defquery required-role2
  "MATCH (a:Entity {uid: $uid})--(r)-->(b)
  WHERE r.rel_type_uid = 4733
  RETURN r")

(neo4j/defquery requiring-relations
  "MATCH (a)--(r)-->(b)
  WHERE (r.rel_type_uid = 4731 OR r.rel_type_uid = 4733) AND r.rh_object_uid = $uid
  RETURN r")

(neo4j/defquery fact-from-fact-uid
  "MATCH (a)--(r)-->(b)
  WHERE r.fact_uid = $factUID
  RETURN r")

(neo4j/defquery possible-role-players
  "MATCH (a)--(r)-->(b)
  WHERE r.rel_type_uid = 4714 AND r.rh_object_uid = $uid
  RETURN r")

(neo4j/defquery possible-roles
  "MATCH (a)--(r)-->(b)
  WHERE r.rel_type_uid = 4714 AND r.lh_object_uid = $uid
  RETURN r")

(neo4j/defquery synonyms
  "MATCH (a:Entity {uid: $uid})--(r)-->(b:Entity {uid: $uid})
  WHERE r.rel_type_uid = 1981
  RETURN r")

(neo4j/defquery synonyms
  "MATCH (a:Entity {uid: $uid})--(r)-->(b:Entity {uid: $uid})
  WHERE r.rel_type_uid = 1986
  RETURN r")

(neo4j/defquery create-fact
  "MERGE (lh:Entity {uid: $lh_object_uid})
  MERGE (rh:Entity {uid: $rh_object_uid})
  CREATE (r:Fact)
  SET r += $properties
  WITH lh, rh, r
  CALL apoc.create.relationship(lh, 'role', {}, r) YIELD rel AS rel1
  CALL apoc.create.relationship(r, 'role', {}, rh) YIELD rel AS rel2
  RETURN r")

;; // export const highestUID = `
;; // MATCH (n)
;; // WITH toInteger(n.uid) AS nodeUID
;; // WHERE nodeUID > $minThreshold AND nodeUID < $maxThreshold
;; // WITH collect(nodeUID) AS nodeUIDs
;; // RETURN apoc.coll.max(nodeUIDs) AS highestValue
;; // `;

;; // TODO: The above query is correct-ish, we want to keep the uid ranges for
;; // fact_uids and concept uids separate but for now we are using the same range
;; // for both. We will need to update this query to account for that.

(neo4j/defquery highest-uid
  "MATCH (n)
  WITH
  CASE
    WHEN n.uid IS NOT NULL THEN toInteger(n.uid)
    ELSE toInteger(n.fact_uid)
  END AS nodeID
  WHERE nodeID > $minThreshold AND nodeID < $maxThreshold
  RETURN max(nodeID) AS highestValue")

(neo4j/defquery facts-about-individual
  "MATCH (a)--(r)-->(b)
  WHERE a.uid = $uid OR b.uid = $uid
  RETURN r")

(neo4j/defquery intrinsic-aspects-def
  "MATCH (a)--(r)-->(b)
  WHERE a.uid = $uid AND r.rel_type_uid = 5848
  RETURN r")

(neo4j/defquery qualitative-aspects-def
  "MATCH (a)--(r)-->(b)
  WHERE a.uid = $uid AND r.rel_type_uid = 5283
  RETURN r")

(neo4j/defquery qualifications-of-aspect
  "MATCH (a)--(r)-->(b)
  WHERE b.uid = $uid AND r.rel_type_uid = 1726
  RETURN r")

(neo4j/defquery intended-functions-def
  "MATCH (a)--(r)-->(b)
  WHERE r.rel_type_uid = 5536
  RETURN r")

(neo4j/defquery parts-def
  "MATCH (a)--(r)-->(b)
  WHERE (a.uid = $uid OR b.uid = $uid) AND r.rel_type_uid = 5519
  RETURN r")

(neo4j/defquery collections-def
  "MATCH (a)--(r)-->(b)
  WHERE (a.uid = $uid OR b.uid = $uid) AND (r.rel_type_uid = 5713 OR r.rel_type_uid = 5013)
  RETURN r")

(neo4j/defquery all-facts-involving-entity
  "MATCH (a)--(r)--(b)
  WHERE a.uid = $uid OR b.uid = $uid
  RETURN r")

;;/////////////////////////////////////////////////////////////

(neo4j/defquery delete-fact
  "MATCH (n:Fact {fact_uid: $uid})
  DETACH DELETE n")

(neo4j/defquery delete-entity
  "MATCH (n:Entity {uid: $uid})
  DETACH DELETE n")

(neo4j/defquery update-fact-definition
  "MATCH (r:Fact {fact_uid: $fact_uid})
  SET r.full_definition = $full_definition
  SET r.partial_definition = $partial_definition
  RETURN r")

(neo4j/defquery update-fact-collection
  "MATCH (r:Fact {fact_uid: $fact_uid})
  SET r.collection_uid = $collection_uid
  SET r.collection_name = $collection_name
  RETURN r")

(neo4j/defquery update-fact-name
  "MATCH (r:Fact {fact_uid: $fact_uid})
  SET r.lh_object_name = $name
  RETURN r")

(neo4j/defquery update-fact-names
  "MATCH (r:Fact {fact_uid: $fact_uid})
  SET r.lh_object_name = $lh_name
  SET r.rh_object_name = $rh_name
  RETURN r")

;;/////////////////////////////////////////////////////////////

(neo4j/defquery get-facts-batch
  "MATCH (r:Fact)
   RETURN r
   ORDER BY r.fact_uid ASC
   SKIP $skip
   LIMIT $range"
  )

(neo4j/defquery get-facts-batch-on-relation-type
  "MATCH (r:Fact)
   WHERE r.rel_type_uid IN $relationTypeUIDs
   RETURN r
   ORDER BY r.fact_uid ASC
   SKIP $skip
   LIMIT $range"
  )

(neo4j/defquery get-facts-count
  "MATCH (n:Fact) RETURN count(n) as count")

;;//////

(neo4j/defquery get-lists-of-kinds
  "MATCH (a)--(r)-->()
  WHERE r.rel_type_uid = 1146 OR r.rel_type_uid = 1726
  WITH r, CASE WHEN $sortOrder = 'ASC' THEN r[$sortField] ELSE null END AS sortFieldAsc,
            CASE WHEN $sortOrder = 'DESC' THEN r[$sortField] ELSE null END AS sortFieldDesc
  ORDER BY sortFieldAsc ASC, sortFieldDesc DESC
  SKIP $skip LIMIT $pageSize
  RETURN r")

(neo4j/defquery count-kinds
  "MATCH (a)--(r)-->()
  WHERE r.rel_type_uid = 1146 OR r.rel_type_uid = 1726
  RETURN count(r) as total")

(neo4j/defquery get-entity-type
  "MATCH ()--(r)-->()
   WHERE r.lh_object_uid = $uid
   AND (r.rel_type_uid = 1146 OR r.rel_type_uid = 1726 OR r.rel_type_uid = 1225)
   RETURN r")

(neo4j/defquery reparent-kind
  "MATCH (n:Entity {uid: $uid})
  MATCH (p:Entity {uid: $newParentUID})--(fb)-->(x)
  WHERE fb.rel_type_uid = 1146
  MATCH (n)-[ra1]-(r)-[ra2]->(oldParent:Entity)
  WHERE r.rel_type_uid = 1146
  SET r.rh_object_uid = fb.lh_object_uid
  SET r.rh_object_name = fb.lh_object_name
  SET r.partial_definition =  $partialDefinition
  SET r.full_definition = $fullDefinition
  SET r.latest_update = $latestUpdate
  DELETE ra2
  CREATE (r)-[:role]->(p)
  RETURN r")

(neo4j/defquery remove-supertype
  "MATCH (n:Entity {uid: $uid})-[r1]->(r)-[r2]->(p:Entity {uid: $supertypeUid})
  WHERE r.rel_type_uid = 1146
  DELETE r1, r2, r
  RETURN r")

(neo4j/defquery related-facts
  "MATCH (start:Entity)--(r)-->(end:Entity)
  WHERE start.uid = $start_uid AND r.rel_type_uid = $rel_type_uid
  RETURN r")

(neo4j/defquery all-related-facts
  "MATCH (start:Entity)--(r)-->(end:Entity)
  WHERE start.uid = $start_uid AND end.uid = $end_uid
  RETURN r")

(neo4j/defquery all-related-facts-b
  "MATCH (start:Entity)<--(r)--(end:Entity)
  WHERE start.uid = $start_uid AND end.uid = $end_uid
  RETURN r")

(neo4j/defquery all-related-facts-c
  "MATCH (start:Entity)--(r)-->(end:Entity)
  WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
  RETURN r")

(neo4j/defquery all-related-facts-d
  "MATCH (start:Entity)<--(r)--(end:Entity)
  WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
  RETURN r")

(neo4j/defquery related-to
  "MATCH (start:Entity)--(r)-->(end:Entity)
  WHERE end.uid = $uid AND r.rel_type_uid IN $rel_type_uids
  RETURN r")

(neo4j/defquery any-related-to
  "MATCH (start:Entity)--(r)-->(end:Entity)
  WHERE end.uid = $uid
  RETURN r")

(neo4j/defquery facts-relating-entities
  "MATCH (start:Entity)--(r)-->(end:Entity)
  WHERE start.uid = $start_uid AND end.uid = $end_uid
  RETURN r")
