import neo4j from "neo4j-driver";
import { execQuery } from "../services/queryService.js";
import { convertNeo4jInts } from "../services/neo4jService.js";
import {transformResult} from "../utils/index.js";

const executeSearchQuery = async (
  searchQuery,
  countQuery,
  searchTerm,
  relTypeUIDs = [],
  filterUIDs = [],
  collectionUID,
  page = 1,
  pageSize = 10,
  exactMatch = false,
) => {
  const skip = (page - 1) * pageSize;
  const result = await execQuery(searchQuery, {
    searchTerm,
    relTypeUIDs,
    filterUIDs,
    collectionUID,
    skip: neo4j.int(skip),
    pageSize: neo4j.int(pageSize),
    exactMatch,
  });

  const transformedResult = result
    .map((item) => transformResult(item))

  const countResult = await execQuery(countQuery, {
    searchTerm,
    relTypeUIDs,
    filterUIDs,
    collectionUID,
    skip: neo4j.int(skip),
    pageSize: neo4j.int(pageSize),
    exactMatch,
  });

  const totalCount = countResult[0]?.get("total").toNumber() ?? 0;

  return {
    facts: transformedResult,
    totalCount,
  };
};

export default executeSearchQuery;
