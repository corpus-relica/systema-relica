import {
  textSearchQuery,
  countTextSearchQuery,
  uidSearchQuery,
  countUIDSearchQuery,
} from "../services/queries.js";
import executeSearchQuery from "./executeSearchQuery.js";

export const getTextSearchKind = async (
  searchTerm,
  collectionUID,
  page = 1,
  pageSize = 10
) =>
  executeSearchQuery(
    textSearchQuery,
    countTextSearchQuery,
    searchTerm,
    [1146, 1981],
    [],
    collectionUID,
    page,
    pageSize,
    false // exactMatch
  );

export const getUIDSearchKind = async (
  searchTerm,
  collectionUID,
  page = 1,
  pageSize = 50
) =>
  executeSearchQuery(
    uidSearchQuery,
    countUIDSearchQuery,
    searchTerm,
    [1146, 1981],
    [],
    collectionUID,
    page,
    pageSize,
    false // exactMatch
  );
