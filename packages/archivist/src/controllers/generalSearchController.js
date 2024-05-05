import {
  textSearchQuery,
  countTextSearchQuery,
  uidSearchQuery,
  countUIDSearchQuery,
} from "../services/queries.js";
import executeSearchQuery from "./executeSearchQuery.js";
import cache from "../utils/cache.js";

export const getTextSearch = async (
  searchTerm,
  collectionUID,
  page = 1,
  pageSize = 10,
  filter = null,
  exactMatch = false,
) => {
  let descendants = [];
  if (filter) {
    descendants = await cache.allDescendantsOf(parseInt(filter.uid));
  }

  return executeSearchQuery(
    textSearchQuery,
    countTextSearchQuery,
    searchTerm,
    [1146, 1726, 1981, 1225],
    descendants,
    collectionUID,
    page,
    pageSize,
    exactMatch,
  );
};
export const getUIDSearch = async (
  searchTerm,
  collectionUID,
  page = 1,
  pageSize = 10,
  filter = null,
) => {
  let descendants = [];
  if (filter) {
    descendants = await cache.allDescendantsOf(parseInt(filter.uid));
  }

  return executeSearchQuery(
    uidSearchQuery,
    countUIDSearchQuery,
    searchTerm,
    [1146, 1726, 1981, 1225],
    descendants,
    collectionUID,
    page,
    pageSize,
  );
};
