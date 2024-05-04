import {
  allFactsInvolvingEntity,
  deleteFactQuery,
  deleteEntityQuery,
} from "../services/queries.js";
import { execQuery } from "../services/queryService.js";
import { convertNeo4jInts } from "../services/neo4jService.js";
import cache from "../utils/cache.js";
import { getFact } from "../controllers/gellishBaseController.js";

export const deleteEntity = async (uid) => {
  // TODO: remove entity from cache if is kind

  // to delete an entity we need to delete all the facts involving the entity
  const factUIDs = await cache.allFactsInvolvingEntity(uid);
  const facts = await Promise.all(
    factUIDs.map(async (factUID) => {
      return await getFact(factUID);
    }),
  );
  console.log("FACT UIDS", factUIDs);
  await Promise.all(
    facts.map(async (fact) => {
      console.log("FACT", fact);
      await cache.removeFromFactsInvolvingEntity(
        fact.lh_object_uid,
        fact.fact_uid,
      );
      await cache.removeFromFactsInvolvingEntity(
        fact.rh_object_uid,
        fact.fact_uid,
      );
      await execQuery(deleteFactQuery, { uid: fact.fact_uid });
    }),
  );

  // await Promise.all(
  //   factUIDs.map(async (fact_uid) => {
  //     await execQuery(deleteFactQuery, { uid: fact_uid });
  //   }),
  // );

  // // delete all the facts
  await execQuery(deleteEntityQuery, { uid });

  return { result: "success", uid: uid, deletedFacts: facts };
  // return { result: "testing" };
};
