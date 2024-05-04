import {
  textSearchQuery,
  countTextSearchQuery,
  uidSearchQuery,
  countUIDSearchQuery,
} from "../services/queries.js";
import executeSearchQuery from "./executeSearchQuery.js";

export const getTextSearchIndividual = async (
  searchTerm,
  collectionUID,
  page = 1,
  pageSize = 10
) => {
  return executeSearchQuery(
    textSearchQuery,
    countTextSearchQuery,
    searchTerm,
    [1225],
    [],
    collectionUID,
    page,
    pageSize,
    false // exactMatch
  );
};

export const getUIDSearchIndividual = async (
  searchTerm,
  collectionUID,
  page = 1,
  pageSize = 10
) => {
  return executeSearchQuery(
    uidSearchQuery,
    countUIDSearchQuery,
    searchTerm,
    [1225],
    [],
    collectionUID,
    page,
    pageSize,
    false // exactMatch
  );
};
