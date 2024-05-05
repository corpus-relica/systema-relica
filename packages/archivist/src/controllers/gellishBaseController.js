import { execQuery } from "../services/queryService.js";
import {
  entity,
  entities,
  specializationHierarchy,
  possibleRoles,
  synonyms,
  inverses,
  partialDefs,
  classificationFact,
  specializationFact,
  possibleRolePlayers,
  requiringRelations,
  requiredRole1,
  requiredRole2,
  fact,
  facts,
  updateFactDefinitionQuery,
  qualificationFact,
} from "../services/queries.js";
import { transformResult, transformResults } from "../utils/index.js";
import {
  OCCURRENCE_UID,
  PHYSICAL_OBJECT_UID,
  ROLE_UID,
  ASPECT_UID,
  RELATION_UID,
} from "../bootstrapping.js";
import { convertNeo4jInts } from "../services/neo4jService.js";
import cache from "../utils/cache.js";
import { linearize } from "c3-linearization";

/////////////////////////////////////////////////////////////  LINEARIZATION  //

export const getLineage = async (uid) => {
  const lineage = await cache.lineageOf(uid);
  console.log("GOT LINEAGE (", uid, ")", lineage);
  console.log(
    "GOT LINEAGE (",
    uid,
    ")",
    lineage.map((x) => typeof x),
  );
  return lineage;
};

////////////////////////////////////////////////////////////////////////////////

export const getSpecializationHierarchy = async (uid) => {
  const conceptsSet = new Set();
  const concepts = [];

  const lineage = await getLineage(uid);
  // lineage.pop();

  const facts = await lineage.reduce(async (accPromise, uid) => {
    const acc = await accPromise;
    const specFacts = await getSpecializationFact(uid);
    return acc.concat(specFacts); // Using concat to avoid nested arrays
  }, Promise.resolve([]));

  const allFacts = await Promise.all(facts);

  allFacts.forEach((fact) => {
    const lh_uid = fact.lh_object_uid;
    const rh_uid = fact.rh_object_uid;
    if (lh_uid && !conceptsSet.has(lh_uid)) {
      conceptsSet.add(lh_uid);
      concepts.push({ uid: lh_uid });
    }
    if (rh_uid && !conceptsSet.has(rh_uid)) {
      conceptsSet.add(rh_uid);
      concepts.push({ uid: rh_uid });
    }
  });

  return { facts, concepts };
};

export const getSH = async (uid) => {
  const result = await getSpecializationHierarchy(uid);

  if (result.facts.length === 0) {
    return [];
  }

  return result.facts.map((item) => {
    return [item.lh_object_uid, item.rel_type_uid, item.rh_object_uid];
  });
};

export const getEntities = async (uids) => {
  const result = await execQuery(entities, { uids });
  if (result.length === 0) {
    return null;
  }
  return await Promise.all(
    result.map(async (record) => {
      const entity = record.get("n");
      convertNeo4jInts(entity);

      // get descendants from Redis
      const descendants = await cache.allDescendantsOf(entity.properties.uid);

      // Combine the entity properties and the descendants
      return Object.assign({}, entity.properties, { descendants });
    }),
  );
};

export const getSpecializationFact = async (uid) => {
  const result = await execQuery(specializationFact, { uid });
  if (result.length === 0) {
    return [];
  }

  return result.map((r) => transformResult(r));
};

export const getSpecializationFacts = async (uids) => {
  if (Array.isArray(uids) && uids.length === 0) {
    return [];
  } else if (!Array.isArray(uids) && uids === undefined) {
    return [];
  } else if (!Array.isArray(uids)) {
    uids = [uids];
  }
  return await Promise.all(
    uids.map(async (uid) => {
      const result = await getSpecializationFact(parseInt(uid));
      return result;
    }),
  );
};

export const getQualificationFact = async (uid) => {
  const result = await execQuery(qualificationFact, { uid });
  if (result.length === 0) {
    return [];
  }

  return result.map((r) => transformResult(r));
};

export const getClassificationFact = async (uid) => {
  const result = await execQuery(classificationFact, { uid });
  if (result.length === 0) return [];
  return transformResults(result);
};

export const getClassificationFacts = async (uids) => {
  return await Promise.all(
    uids.map(async (uid) => {
      const result = await getClassificationFact(uid);
      return result;
    }),
  );
};

export const getCategory = async (uid) => {
  const physicalObjectSubtypes =
    await cache.allDescendantsOf(PHYSICAL_OBJECT_UID);
  const roleSubtypes = await cache.allDescendantsOf(ROLE_UID);
  const aspectSubtypes = await cache.allDescendantsOf(ASPECT_UID);
  const relationSubtypes = await cache.allDescendantsOf(RELATION_UID);
  const occurrenceSubtypes = await cache.allDescendantsOf(OCCURRENCE_UID);

  if (physicalObjectSubtypes.includes(uid)) {
    return "physical object";
  } else if (roleSubtypes.includes(uid)) {
    return "role";
  } else if (aspectSubtypes.includes(uid)) {
    return "aspect";
  } else if (occurrenceSubtypes.includes(uid)) {
    return "occurrence";
  } else if (relationSubtypes.includes(uid)) {
    return "relation";
  } else {
    return "anything";
  }
};

export const getSynonyms = async (uid) => {
  const result = await execQuery(synonyms, { uid });
  return transformResults(result);
};

export const getInverses = async (uid) => {
  const result = await execQuery(inverses, { uid });
  return transformResults(result);
};

export const getPossibleRoles = async (uid) => {
  const specH = await getSpecializationHierarchy(uid);

  let i = 0;
  const uniqueResults = new Set(); // Use a Set to store unique entries
  while (i < specH.length - 1) {
    const fact = specH[i];
    const res = await execQuery(possibleRoles, { uid: fact.lh_object_uid });

    res.forEach((item) => {
      const transformedItem = Object.assign({}, item.toObject().r.properties, {
        rel_type_name: item.get("r").type,
      });
      uniqueResults.add(JSON.stringify(transformedItem)); // Add the stringified transformed item to the Set
    });

    i++;
  }

  if (uniqueResults.size === 0) {
    return [];
  }

  const transformedResult = Array.from(uniqueResults).map((item) =>
    JSON.parse(item),
  ); // Convert the unique items back to objects

  return transformedResult;
};

export const getPartialDefs = async (uid) => {
  const result = await execQuery(partialDefs, { uid });
  const ret = result.map((item) => {
    return {
      sourceUID: item.get("source_uid"),
      partialDef: item.get("partial_definition"),
    };
  });
  return ret;
};

export const getNames = async (uid) => {
  const specFact = await getSpecializationFact(uid);
  const specFactNames = specFact.map((x) => x.lh_object_name);
  const classFact = await getClassificationFact(uid);
  const classFactNames = classFact.map((x) => x.lh_object_name);
  const synonyms = await getSynonyms(uid);
  const synonymsNames = synonyms.map((x) => x.lh_object_name);
  const names = [...specFactNames, ...classFactNames, ...synonymsNames];
  return names;
};

const getRequiredRole = async (relationUID, roleIndex) => {
  const specH = await getSpecializationHierarchy(relationUID);
  const query = roleIndex === 1 ? requiredRole1 : requiredRole2;

  let i = 0;
  let result = [];
  while (i < specH.facts.length - 1 && result.length === 0) {
    const fact = specH.facts[i];
    result = await execQuery(query, { uid: fact.lh_object_uid });
    i++;
  }
  if (result.length === 0) {
    return null;
  }
  return transformResult(result[0]);
};

export const getRequiredRole1 = async (relationUID) => {
  return await getRequiredRole(relationUID, 1);
};

export const getRequiredRole2 = async (relationUID) => {
  return await getRequiredRole(relationUID, 2);
};

export const getPossibleRolePlayers = async (roleUID) => {
  const specH = await getSpecializationHierarchy(roleUID);
  const facts = specH.facts;

  let i = 0;
  let result = [];
  while (i < facts.length - 1 && result.length === 0) {
    const fact = facts[i];
    const res = await execQuery(possibleRolePlayers, {
      uid: fact.lh_object_uid,
    });
    result = [...result, ...res];
    i++;
  }
  if (result.length === 0) {
    return [];
  }
  return transformResults(result);
};

export const getRequiringRelations = async (roleUID) => {
  const specH = await getSpecializationHierarchy(roleUID);

  let i = 0;
  let result = [];
  while (i < specH.length - 1 && result.length === 0) {
    const fact = specH[i];
    const res = await execQuery(requiringRelations, {
      uid: fact.lh_object_uid,
    });
    result = [...result, ...res];
    i++;
  }
  if (result.length === 0) {
    return [];
  }
  return transformResults(result);
};

export const getFact = async (factUID) => {
  const result = await execQuery(fact, { uid: factUID });
  if (result.length === 0) {
    return null;
  }
  const restultFact = result[0].get("n");
  convertNeo4jInts(restultFact);

  return restultFact.properties;
};

export const getFacts = async (factUIDs) => {
  const result = await execQuery(facts, { uids: factUIDs });
  if (result.length === 0) {
    return null;
  }
  return result.map((record) => {
    const fact = record.get("n");
    convertNeo4jInts(fact);
    return fact.properties;
  });
};

export const getDefinitiveFacts = async (uid) => {
  const specializationFact = await getSpecializationFact(uid);
  const classificationFact = await getClassificationFact(uid);
  const qualificationFact = await getQualificationFact(uid);

  console.log("GET DEFINITIVE FACTS", uid);
  console.log(specializationFact, classificationFact, qualificationFact);

  if (
    specializationFact.length === 0 &&
    classificationFact.length === 0 &&
    qualificationFact.length === 0
  ) {
    return [];
  }

  if (specializationFact.length > 0) {
    console.log("RETURN SPEC FACT");
    return specializationFact;
  }

  if (classificationFact.length > 0) {
    console.log("RETURN CLASS FACT");
    return classificationFact;
  }

  if (qualificationFact.length > 0) {
    console.log("RETURN QUAL FACT");
    return qualificationFact;
  }

  console.log("RETURN NO FACT");
  return [];
};

export const updateFactDefinition = async (
  fact_uid,
  partial_definition,
  full_definition,
) => {
  const result = await execQuery(updateFactDefinitionQuery, {
    fact_uid,
    partial_definition,
    full_definition,
  });
  console.log("UPDATE FACT DEFINITION", result);
  return transformResult(result[0]);
};
