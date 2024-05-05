import { execQuery } from "../services/queryService.js";
import { createKind as ck } from "../services/queries.js";
import { convertNeo4jInts } from "../services/neo4jService.js";
import { reserveUID } from "../services/uidService.js";

export const createKind = async (parentUID, name, definition) => {
  const result = await execQuery(ck, { parentUID, name, definition });
  const convertedResult = convertNeo4jInts(result);
  return convertedResult;
};
