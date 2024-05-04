import { execQuery } from "../services/queryService.js";
import {
  supertypes,
  synonyms,
  inverses,
  intrinsicAspectsDef,
  qualitativeAspectsDef,
  intendedFunctionsDef,
  partsDef,
  collectionsDef,
} from "../services/queries.js";
import { convertNeo4jInts } from "../services/neo4jService.js";

const postProcess = (result) => {
  console.log(result);
  return result.map((item) => {
    const obj = convertNeo4jInts(item.toObject().r);
    return Object.assign({}, obj.properties);
  });
};

const execAndPostProcess = async (query, uid) =>
  postProcess(
    await execQuery(query, {
      uid,
    })
  );

export const getDefinition = async (uid) => {
  const supertypesRes = await execAndPostProcess(supertypes, uid);
  const synonymsRes = await execAndPostProcess(synonyms, uid);
  const inversesRes = await execAndPostProcess(inverses, uid);
  const intrinsicAspectsRes = await execAndPostProcess(
    intrinsicAspectsDef,
    uid
  );
  const qualitativeAspectsRes = await execAndPostProcess(
    qualitativeAspectsDef,
    uid
  );
  const intendedFunctionsRes = await execAndPostProcess(
    intendedFunctionsDef,
    uid
  );
  //
  //
  const partsRes = await execAndPostProcess(partsDef, uid);
  const collectionsRes = await execAndPostProcess(collectionsDef, uid);

  return {
    supertypes: supertypesRes,
    aliases: {
      synonyms: synonymsRes,
      inverses: inversesRes,
    },
    intrinsicAspects: intrinsicAspectsRes,
    qualitativeAspects: qualitativeAspectsRes,
    intendedFunctions: intendedFunctionsRes,
    pictures: {}, // TODO
    information: {}, // TODO
    parts: partsRes,
    collections: collectionsRes,
  };
};
