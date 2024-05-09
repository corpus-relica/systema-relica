export const fact = `
MATCH (n:Fact {fact_uid: $uid}) RETURN n
`;

export const facts = `
MATCH (n:Fact)
WHERE n.fact_uid IN $uids
RETURN n
`;

export const entity = `
MATCH (n:Entity {uid: $uid}) RETURN n
`;

export const entities = `
MATCH (n:Entity)
WHERE n.uid IN $uids
RETURN n
`;

export const partialDefs = `
MATCH (startNode:Entity {uid: $uid}), (topNode:Entity {uid: '730000'})
MATCH path = shortestPath((startNode)-[r*]->(topNode))
WHERE ALL(rel IN r WHERE rel.rel_type_uid = '1146')
WITH relationships(path) as rels, startNode
UNWIND rels as rel
WITH rel, startNode
WHERE rel.partial_definition IS NOT NULL
WITH rel.partial_definition as partial_definition, rel.lh_object_uid as source_uid, apoc.path.create(startNode, [rel]) as newPath
RETURN partial_definition, source_uid
ORDER BY length(newPath)
`;

export const collections = `
MATCH (r:Fact)
WITH DISTINCT r.collection_uid as uid, r.collection_name as name
RETURN COLLECT({uid: uid, name: name}) as collections
`;

export const textSearchQuery = `
MATCH (kind:Entity)-->(r:Fact)-->(parent:Entity)
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
SKIP $skip LIMIT $pageSize`;

export const countTextSearchQuery = `
MATCH (kind:Entity)-->(r:Fact)-->(parent:Entity)
WHERE r.rel_type_uid IN $relTypeUIDs
AND
CASE $exactMatch
  WHEN true THEN toLower(r.lh_object_name) = toLower($searchTerm)
  ELSE toLower(r.lh_object_name) CONTAINS toLower($searchTerm)
END
AND ($collectionUID = '' OR r.collection_uid = $collectionUID)
AND ($filterUIDs IS NULL OR size($filterUIDs) = 0 OR kind.uid IN $filterUIDs)
RETURN count(r) as total`;

export const uidSearchQuery = `
MATCH (kind:Entity)--(r:Fact)-->(parent:Entity)
WHERE r.rel_type_uid IN $relTypeUIDs
AND r.lh_object_uid = $searchTerm
AND ($collectionUID = '' OR r.collection_uid = $collectionUID)
RETURN r
ORDER BY r.lh_object_name
SKIP $skip LIMIT $pageSize`;

export const countUIDSearchQuery = `
MATCH (kind:Entity)-->(r:Fact)-->(parent:Entity)
WHERE r.rel_type_uid IN $relTypeUIDs
AND r.lh_object_uid = $searchTerm
AND ($collectionUID = '' OR r.collection_uid = $collectionUID)
RETURN count(r) as total`;

export const specializationHierarchy = `
MATCH path = (start:Entity)-[]->(f1:Fact)-[]->(end:Entity)
WHERE start.uid = $uid AND end.uid = 730000 AND f1.rel_type_uid IN $rel_type_uids
RETURN path

UNION

MATCH path = (start:Entity)-[]->(f2:Fact)-[]->(:Entity)
((:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(:Entity)){0,100}
(:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(end:Entity)
WHERE start.uid = $uid AND end.uid = 730000 AND f2.rel_type_uid IN $rel_type_uids
RETURN path
`;

export const allSubtypePaths = `
MATCH path = (start:Entity)-[]->(r:Fact {rel_type_uid: 1146})-[]->(end:Entity)
WHERE end.uid = $uid
RETURN path

UNION

MATCH path = (start:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(:Entity)
((:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(:Entity)){0,10}
(:Entity)-[]->(:Fact {rel_type_uid: 1146})-[]->(end:Entity)
WHERE end.uid = $uid
RETURN path
`;

export const specializationFact = `
MATCH (a)--(r)-->(b)
WHERE r.rel_type_uid = 1146 AND r.lh_object_uid = $uid
RETURN r
`;

export const qualificationFact = `
MATCH (a)--(r)-->(b)
WHERE r.rel_type_uid = 1726 AND r.lh_object_uid = $uid
RETURN r
`;

export const supertypes = `
MATCH (a:Entity {uid: $uid})--(r)-->(b)
WHERE r.rel_type_uid = 1146
RETURN r
`;

export const subtypes = `
MATCH (a)--(r)-->(b:Entity {uid: $uid})
WHERE r.rel_type_uid = 1146 OR r.rel_type_uid = 1726
RETURN r
`;

export const classified = `
MATCH (a)--(r)-->(b:Entity {uid: $uid})
WHERE r.rel_type_uid = 1225
RETURN r
`;

export const classificationFact = `
MATCH (a:Entity {uid: $uid})--(r)-->(b)
WHERE r.rel_type_uid = 1225
RETURN r
`;

export const requiredRole1 = `
MATCH (a:Entity {uid: $uid})--(r)-->(b)
WHERE r.rel_type_uid = 4731
RETURN r
`;

export const requiredRole2 = `
MATCH (a:Entity {uid: $uid})--(r)-->(b)
WHERE r.rel_type_uid = 4733
RETURN r
`;

export const requiringRelations = `
MATCH (a)--(r)-->(b)
WHERE (r.rel_type_uid = 4731 OR r.rel_type_uid = 4733) AND r.rh_object_uid = $uid
RETURN r
`;

export const factFromFactUID = `
MATCH (a)--(r)-->(b)
WHERE r.fact_uid = $factUID
RETURN r
`;

export const possibleRolePlayers = `
MATCH (a)--(r)-->(b)
WHERE r.rel_type_uid = 4714 AND r.rh_object_uid = $uid
RETURN r
`;

export const possibleRoles = `
MATCH (a)--(r)-->(b)
WHERE r.rel_type_uid = 4714 AND r.lh_object_uid = $uid
RETURN r
`;

export const synonyms = `
MATCH (a:Entity {uid: $uid})--(r)-->(b:Entity {uid: $uid})
WHERE r.rel_type_uid = 1981
RETURN r
`;

export const inverses = `
MATCH (a:Entity {uid: $uid})--(r)-->(b:Entity {uid: $uid})
WHERE r.rel_type_uid = 1986
RETURN r
`;

// export const createFact = `
// MATCH (lh:Entity {uid: $lh_object_uid})
// MATCH (rh:Entity {uid: $rh_object_uid})
// CREATE (lh)-[r:$rel_type_uid]->(rh)
// FOREACH (key IN keys($properties) |
//     SET r[key] = $properties[key]
// )
// RETURN r
// `;

export const createFact = `
MERGE (lh:Entity {uid: $lh_object_uid})
MERGE (rh:Entity {uid: $rh_object_uid})
CREATE (r:Fact)
SET r += $properties
WITH lh, rh, r
CALL apoc.create.relationship(lh, 'role', {}, r) YIELD rel AS rel1
CALL apoc.create.relationship(r, 'role', {}, rh) YIELD rel AS rel2
RETURN r
`;

export const createKind = `
CREATE (n:Entity {uid: $uid})
CREATE (r:Fact {fact_uid: $fact_uid, rel_type_uid: 1146, lh_object_uid: $uid, rh_object_uid: $parentUID, full_definition: $definition})
MATCH (parent:Entity {uid: $parentUID})
CALL apoc.create.relationship(n, 'role', {}, r)
CALL apoc.create.relationship(r, 'role', {}, parent)
RETURN r
`;

// export const highestUID = `
// MATCH (n)
// WITH toInteger(n.uid) AS nodeUID
// WHERE nodeUID > $minThreshold AND nodeUID < $maxThreshold
// WITH collect(nodeUID) AS nodeUIDs
// RETURN apoc.coll.max(nodeUIDs) AS highestValue
// `;

// TODO: The above query is correct-ish, we want to keep the uid ranges for
// fact_uids and concept uids separate but for now we are using the same range
// for both. We will need to update this query to account for that.
export const highestUID = `
MATCH (n)
WITH
CASE
  WHEN n.uid IS NOT NULL THEN toInteger(n.uid)
  ELSE toInteger(n.fact_uid)
END AS nodeID
WHERE nodeID > $minThreshold AND nodeID < $maxThreshold
RETURN max(nodeID) AS highestValue
`;

export const factsAboutIndividual = `
MATCH (a)--(r)-->(b)
WHERE a.uid = $uid OR b.uid = $uid
RETURN r
`;

export const intrinsicAspectsDef = `
MATCH (a)--(r)-->(b)
WHERE a.uid = $uid AND r.rel_type_uid = 5848
RETURN r
`;

export const qualitativeAspectsDef = `
MATCH (a)--(r)-->(b)
WHERE a.uid = $uid AND r.rel_type_uid = 5283
RETURN r
`;

export const intendedFunctionsDef = `
MATCH (a)--(r)-->(b)
WHERE r.rel_type_uid = 5536
RETURN r
`;

export const partsDef = `
MATCH (a)--(r)-->(b)
WHERE (a.uid = $uid OR b.uid = $uid) AND r.rel_type_uid = 5519
RETURN r
`;

export const collectionsDef = `
MATCH (a)--(r)-->(b)
WHERE (a.uid = $uid OR b.uid = $uid) AND (r.rel_type_uid = 5713 OR r.rel_type_uid = 5013)
RETURN r
`;

export const allFactsInvolvingEntity = `
MATCH (a)--(r)--(b)
WHERE a.uid = $uid OR b.uid = $uid
RETURN r
`;

/////////////////////////////////////////////////////////////

export const deleteFactQuery = `
MATCH (n:Fact {fact_uid: $uid})
DETACH DELETE n
`;

export const deleteEntityQuery = `
MATCH (n:Entity {uid: $uid})
DETACH DELETE n
`;

export const updateFactDefinitionQuery = `
MATCH (r:Fact {fact_uid: $fact_uid})
SET r.full_definition = $full_definition
SET r.partial_definition = $partial_definition
RETURN r
`;

/////////////////////////////////////////////////////////////

export const getListOfKindsQuery = `
MATCH (a)--(r)-->()
WHERE r.rel_type_uid = 1146 OR r.rel_type_uid = 1726
WITH r
ORDER BY r[$sortField]
SKIP $skip LIMIT $pageSize
RETURN r
`;
