import { execQuery } from "../services/queryService.js";
import {
  subtypes,
  classified,
  factsAboutIndividual,
} from "../services/queries.js";
import {
  getCategory,
  getSpecializationHierarchy,
  getRequiredRole1,
  getRequiredRole2,
  getPartialDefs,
  getPossibleRoles,
  getPossibleRolePlayers,
  getRequiringRelations,
  getSynonyms,
  getInverses,
} from "./gellishBaseController.js";
import cache from "../utils/cache.js";
import { transformResults } from "../utils/index.js";
import { convertNeo4jInts } from "../services/neo4jService.js";

export const getSubtypes = async (uid) => {
  const result = await execQuery(subtypes, { uid });
  const facts = result.map((item) => {
    const obj = convertNeo4jInts(item.toObject().r);
    return Object.assign({}, obj.properties);
  });
  return facts;
};

export const getClassified = async (uid) => {
  console.log("GET CLASSIFIED");
  const result = await execQuery(classified, { uid });
  console.log(result);
  console.log("GET CLASSIFIED ?");
  if (result.length === 0) return [];
  console.log("GET CLASSIFIED ??");
  console.log(result);
  console.log(transformResults(result));
  console.log("GET CLASSIFIED ???");
  return transformResults(result);
};

const getFactsAboutRole = async (uid) => {
  const possRolePlayers = await getPossibleRolePlayers(uid);
  const requiringRels = await getRequiringRelations(uid);

  return { possRolePlayers, requiringRels };
};
const getFactsAboutQuality = async (uid) => {
  return {};
};
const getFactsAboutAspect = async (uid) => {
  return {};
};
const getFactsAboutOccurrence = async (uid) => {
  const role1 = await getRequiredRole1(uid);
  const role2 = await getRequiredRole2(uid);

  return { reqRoles: [role1, role2] };
};
const getFactsAboutPhysicalObject = async (uid) => {
  return {};
};
export const getFactsAboutRelation = async (uid) => {
  const role1 = await getRequiredRole1(uid);
  const role2 = await getRequiredRole2(uid);

  return { reqRoles: [role1, role2] };
};

export const getFactsAboutKind = async (uid) => {
  getAllFactsAboutKind(uid);
  if (uid === "730000") return {};

  const category = await getCategory(uid);
  const specH = await getSpecializationHierarchy(uid);
  const syn = await getSynonyms(uid);
  const inv = await getInverses(uid);
  const partialDefs = await getPartialDefs(uid);
  const possRoles = await getPossibleRoles(uid);

  const commonComponents = {
    category,
    specH,
    syn,
    inv,
    partialDefs,
    possRoles,
  };

  switch (category) {
    case "occurrence":
      return Object.assign(
        {},
        commonComponents,
        await getFactsAboutOccurrence(uid),
      );
    case "physical object":
      return Object.assign(
        {},
        commonComponents,
        await getFactsAboutPhysicalObject(uid),
      );
    case "role":
      return Object.assign({}, commonComponents, await getFactsAboutRole(uid));
    case "quality":
      return Object.assign(
        {},
        commonComponents,
        await getFactsAboutQuality(uid),
      );
    case "aspect":
      return Object.assign(
        {},
        commonComponents,
        await getFactsAboutAspect(uid),
      );
    case "relation":
      return Object.assign(
        {},
        commonComponents,
        await getFactsAboutRelation(uid),
      );
    default:
      return commonComponents;
  }
};

export const getAllRelatedFacts = async (uid) => {
  const allRelatedFactsQuery = `
MATCH (start:Entity)--(r)-->(end:Entity)
WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
RETURN r
`;

  const allRelatedFactsQueryb = `
MATCH (start:Entity)<--(r)--(end:Entity)
WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
RETURN r
`;

  const subtypes1146 = await cache.allDescendantsOf(1146); // 'is a specialization of'
  const subtypes2850 = await cache.allDescendantsOf(2850); // 'relation'

  const rel_type_uids = subtypes2850.filter(
    (item) => !subtypes1146.includes(item) && item !== 1146,
  );

  const results2850 = await execQuery(allRelatedFactsQuery, {
    start_uid: uid,
    rel_type_uids,
  });
  const res2850 = transformResults(results2850);

  const results2850b = await execQuery(allRelatedFactsQueryb, {
    start_uid: uid,
    rel_type_uids,
  });
  const res2850b = transformResults(results2850b);

  return res2850.concat(res2850b);
};

export const getAllRelatedFactsRecursive = (uid, depth = 1) => {
  const maxDepth = 3; // Define the maximum allowed depth
  const actualDepth = Math.min(depth, maxDepth); // Ensure the depth does not exceed the maximum

  const recurse = async (currentUid, currDepth) => {
    if (currDepth < actualDepth) {
      let result = await getAllRelatedFacts(currentUid);
      let nextUids = result.map((item) => item.lh_object_uid);

      let recursiveResults = await Promise.all(
        nextUids.map((nextUid) => recurse(nextUid, currDepth + 1)),
      );
      return [...result, ...recursiveResults.flat()];
    } else {
      return [];
    }
  };

  return recurse(uid, 0);
};

export const getFactsAboutIndividual = async (uid) => {
  const result = await execQuery(factsAboutIndividual, { uid });
  const transformedResult = result.map((item) => {
    return Object.assign({}, item.toObject().r.properties, {
      rel_type_name: item.get("r").type,
    });
  });

  return { factsAboutIndividual: transformedResult };
};

export const getRelatedOnUIDSubtypeCone = async (
  lh_object_uid,
  rel_type_uid,
) => {
  console.log("GRoUSC", lh_object_uid, rel_type_uid);
  const subtypesOfRelType = (await cache.allDescendantsOf(rel_type_uid)).concat(
    [rel_type_uid],
  );
  const allRelatedFactsQuery = `
MATCH (start:Entity)--(r)-->(end:Entity)
WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
RETURN r
`;

  //   const allRelatedFactsQueryb = `
  // MATCH (start:Entity)<--(r)--(end:Entity)
  // WHERE start.uid = $start_uid AND r.rel_type_uid IN $rel_type_uids
  // RETURN r
  // `;

  const results = await execQuery(allRelatedFactsQuery, {
    start_uid: lh_object_uid,
    rel_type_uids: subtypesOfRelType,
  });
  const res = transformResults(results);

  // const resultsb = await execQuery(allRelatedFactsQueryb, {
  //   start_uid: lh_object_uid,
  //   rel_type_uids: subtypesOfRelType,
  // });
  // const resb = transformResults(resultsb);

  const possiblyReduntResults = res; //.concat(resb);
  const uniqueResults = possiblyReduntResults.filter((item, index) => {
    const indexOfFirstOccurence = possiblyReduntResults.findIndex(
      (item2) => item2.fact_uid === item.fact_uid,
    );
    return indexOfFirstOccurence === index;
  });

  return uniqueResults;
};

export const getFactsRelatingEntities = async (uid1, uid2) => {
  console.log(
    "GET FACTS RELATIONG ENTITIES ------------------------------------------!",
    uid1,
    uid2,
  );
  const allRelatedFactsQuery = `
MATCH (start:Entity)--(r)-->(end:Entity)
WHERE start.uid = $start_uid AND end.uid = $end_uid
RETURN r
`;

  const allRelatedFactsQueryb = `
MATCH (start:Entity)<--(r)--(end:Entity)
WHERE start.uid = $start_uid AND end.uid = $end_uid
RETURN r
`;

  const results = await execQuery(allRelatedFactsQuery, {
    start_uid: uid1,
    end_uid: uid2,
  });
  const res = transformResults(results);

  const resultsb = await execQuery(allRelatedFactsQueryb, {
    start_uid: uid1,
    end_uid: uid2,
  });
  const resb = transformResults(resultsb);

  const possiblyReduntResults = res.concat(resb);
  const uniqueResults = possiblyReduntResults.filter((item, index) => {
    const indexOfFirstOccurence = possiblyReduntResults.findIndex(
      (item2) => item2.fact_uid === item.fact_uid,
    );
    return indexOfFirstOccurence === index;
  });

  return uniqueResults;
};
