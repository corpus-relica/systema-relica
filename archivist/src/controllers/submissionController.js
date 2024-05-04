import { reserveUID as reserveUIDs } from "../services/uidService.js";
import { createFact } from "../services/queries.js";
import { execQuery } from "../services/queryService.js";
import { convertNeo4jInts } from "../services/neo4jService.js";
import cache from "../utils/cache.js";

const isTempUIDP = (uid) => {
  return parseInt(uid) >= 1 && parseInt(uid) <= 100;
};

//TODO: if essential fields are partially complete (e.g. only rh_object_uid is provided), then the function should resolve the missing fields
export const submitBinaryFact = async (fact) => {
  try {
    const [lh_object_uid, fact_uid] = reserveUIDs(2);

    let finalFact = Object.assign({}, fact, { fact_uid });

    if (
      parseInt(fact.lh_object_uid) >= 0 &&
      parseInt(fact.lh_object_uid) <= 100
    ) {
      finalFact = Object.assign({}, finalFact, {
        lh_object_uid,
      });
      const result = await execQuery(`MERGE (n:Entity {uid: $uid}) RETURN n`, {
        uid: lh_object_uid,
      });
      if (result.length == 0) {
        throw new Error("Merge operation failed");
      }
      const node = result[0].toObject().n;
    }

    const result = await execQuery(createFact, {
      lh_object_uid: finalFact.lh_object_uid,
      rh_object_uid: finalFact.rh_object_uid,
      properties: finalFact,
    });

    if (!result || result.length == 0) {
      return { success: false, message: "Execution of createFact failed" };
    }

    const convertedResult = convertNeo4jInts(result[0].toObject().r);
    const returnFact = Object.assign(
      { rel_type_name: finalFact.rel_type_name },
      convertedResult.properties,
    );

    // UPATE CACHE
    // collect all the uids of the nodes involved in the fact
    const uids = [returnFact.lh_object_uid, returnFact.rh_object_uid];
    await Promise.all(
      uids.map(async (uid) => {
        await cache.updateFactsInvolvingEntity(uid);
      }),
    );
    //

    return {
      success: true,
      fact: returnFact,
    };
  } catch (error) {
    console.error(`Error in submitBinaryFact: ${error.message}`);
    // Rethrow the error if you want to handle it in a higher level of your app
    // throw error;
    return { success: false, message: error.message };
  }
};

export const submitBinaryFacts = async (facts) => {
  const tempUIDs = Array.from(
    facts
      .reduce((acc, fact) => {
        if (isTempUIDP(fact.lh_object_uid)) acc.add(fact.lh_object_uid);
        if (isTempUIDP(fact.rh_object_uid)) acc.add(fact.rh_object_uid);
        if (isTempUIDP(fact.rel_type_uid)) acc.add(fact.rel_type_uid);
        return acc;
      }, new Set())
      .values(),
  );

  const newUIDMap = tempUIDs.reduce((acc, tempUID) => {
    acc[tempUID] = reserveUIDs()[0];
    return acc;
  }, {});

  const resolvedFacts = facts.map((fact, index) => {
    const { lh_object_uid, rel_type_uid, rh_object_uid } = fact;

    return Object.assign({}, fact, {
      fact_uid: reserveUIDs()[0],
      lh_object_uid: isTempUIDP(lh_object_uid)
        ? newUIDMap[lh_object_uid]
        : lh_object_uid,
      rh_object_uid: isTempUIDP(rh_object_uid)
        ? newUIDMap[rh_object_uid]
        : rh_object_uid,
      rel_type_uid: isTempUIDP(rel_type_uid)
        ? newUIDMap[rel_type_uid]
        : rel_type_uid,
    });
  });

  try {
    // Create nodes
    const createNodesQuery = `
  UNWIND $params AS param
  MERGE (n:Entity {uid: param.uid})
  RETURN n`;

    const nodeParams = resolvedFacts.flatMap((item) => [
      { uid: item.lh_object_uid },
      { uid: item.rh_object_uid },
    ]);

    const result = await execQuery(createNodesQuery, { params: nodeParams });

    // Create relationships
    const createRelationshipsQuery = `
  UNWIND $params AS param
  MATCH (a:Entity {uid: param.lh_object_uid})
  MATCH (b:Entity {uid: param.rh_object_uid})
  CALL apoc.create.relationship(a, param.rel_type_name, param.properties, b) YIELD rel
  return rel
`;

    const relationshipParams = resolvedFacts.map((item) => ({
      lh_object_uid: item.lh_object_uid,
      rh_object_uid: item.rh_object_uid,
      rel_type_uid: item.rel_type_uid,
      rel_type_name: item.rel_type_name,
      properties: item,
    }));

    const result2 = await execQuery(createRelationshipsQuery, {
      params: relationshipParams,
    });

    const returnFacts = result2.map((item) => {
      return Object.assign(
        { rel_type_name: item.get("rel").type },
        item.toObject().rel.properties,
      );
    });

    // UPATE CACHE
    // collect all the uids of the nodes involved in the fact
    const uids = resolvedFacts.flatMap((fact) => [
      fact.lh_object_uid,
      fact.rh_object_uid,
    ]);
    await Promise.all(
      uids.map(async (uid) => {
        await cache.updateFactsInvolvingEntity(uid);
      }),
    );
    //

    return {
      success: true,
      facts: returnFacts,
    };
  } catch (error) {
    console.error(`Error in submitBinaryFacts: ${error.message}`);
    return { success: false, message: error.message };
  }
};
