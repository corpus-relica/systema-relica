import axios from "axios";
import {
  SUBMIT_DEFINITION_ENDPOINT,
  DELETE_ENTITY_ENDPOINT,
  SPECIALIZATION_HIERARCHY_ENDPOINT,
  SPECIALIZATION_FACT_ENDPOINT,
  SUBTYPES_ENDPOINT,
  SUBTYPES_CONE_ENDPOINT,
  FACT_ENDPOINT,
  FACTS_ENDPOINT,
  ENTITY_ENDPOINT,
  ENTITY_CATEGORY_ENDPOINT,
  ALL_RELATED_FACTS_ENDPOINT,
  DEFINITIVE_FACTS_ENDPOINT,
  RELATED_ON_SUBTYPE_CONE_ENDPOINT,
  ENTITY_TYPE_ENDPOINT,
  FACTS_RELATING_ENTITIES_ENDPOINT,
  TEXT_SEARCH_ENDPOINT,
  SUBMIT_BINARY_FACT_ENDPOINT,
  CLASSIFIED_ENDPOINT,
  CLASSIFICATION_FACT_ENDPOINT,
} from "@relica/constants";

const URL = process.env.RELICA_NEO4J_URL;

export const getSpecializationHierarchy = async (uid: number) => {
  const result = await axios.get(
    `${URL}${SPECIALIZATION_HIERARCHY_ENDPOINT}?uid=${uid}`,
  );
  return result.data;
};

export const getSpecializationFact = async (uid: number) => {
  const result = await axios.get(
    `${URL}${SPECIALIZATION_FACT_ENDPOINT}?uid=${uid}`,
  );
  return result.data;
};

export const getSubtypes = async (uid: number) => {
  const result = await axios.get(`${URL}${SUBTYPES_ENDPOINT}?uid=${uid}`);
  return result.data;
};

export const getSubtypesCone = async (uid: number) => {
  const result = await axios.get(`${URL}${SUBTYPES_CONE_ENDPOINT}?uid=${uid}`);
  return result.data;
};

export const getFact = async (uid: number) => {
  const result = await axios.get(`${URL}${FACT_ENDPOINT}?uid=${uid}`);
  return result.data;
};

export const getFacts = async (factUIDs: number[]) => {
  const result = await axios.get(
    `${URL}${FACTS_ENDPOINT}?uids=${JSON.stringify(factUIDs)}`,
  );
  return result.data;
};

export const getEntity = async (uid: number) => {
  const result = await axios.get(`${URL}${ENTITY_ENDPOINT}?uid=${uid}`);
  return result.data;
};

export const retrieveAllFacts = async (uid: number) => {
  const result = await axios.get(
    `${URL}${ALL_RELATED_FACTS_ENDPOINT}?uid=${uid}`,
  );
  return result.data;
};

export const getCategory = async (uid: number) => {
  const result = await axios.get(
    `${URL}${ENTITY_CATEGORY_ENDPOINT}?uid=${uid}`,
  );
  return result.data;
};

export const getDefinitiveFacts = async (uid: number) => {
  const result = await axios.get(
    `${URL}${DEFINITIVE_FACTS_ENDPOINT}?uid=${uid}`,
  );
  return result.data;
};

export const getRelatedOnUIDSubtypeCone = async (
  lh_object_uid: number,
  rel_type_uid: number,
) => {
  const result = await axios.get(
    `${URL}${RELATED_ON_SUBTYPE_CONE_ENDPOINT}?lh_object_uid=${lh_object_uid}&rel_type_uid=${rel_type_uid}`,
  );
  return result.data;
};

export const getEntityType = async (uid: number) => {
  const result = await axios.get(`${URL}${ENTITY_TYPE_ENDPOINT}?uid=${uid}`);
  return result.data;
};

export const getFactsRelatingEntities = async (uid1: number, uid2: number) => {
  const result = await axios.get(
    `${URL}${FACTS_RELATING_ENTITIES_ENDPOINT}?uid1=${uid1}&uid2=${uid2}`,
  );
  return result.data;
};

export const textSearchExact = async (searchTerm: string) => {
  const result = await axios.get(
    `${URL}${TEXT_SEARCH_ENDPOINT}?searchTerm=${searchTerm}&exactMatch=true`,
  );
  return result.data;
};

export const createKind = async (
  parentUID: number,
  parentName: string,
  name: string,
  definition: string,
) => {
  const result = await axios.post(`${URL}${SUBMIT_BINARY_FACT_ENDPOINT}`, {
    lh_object_uid: "1",
    lh_object_name: name,
    rel_type_uid: 1146,
    rel_type_name: "is a specialization of",
    rh_object_uid: parentUID,
    rh_object_name: parentName,
    full_definition: definition,
  });
  return result.data;
};

export const createIndividual = async (
  kindUID: number,
  kindName: string,
  name: string,
  definition: string,
) => {
  const result = await axios.post(`${URL}${SUBMIT_BINARY_FACT_ENDPOINT}`, {
    lh_object_uid: "1",
    lh_object_name: name,
    rel_type_uid: 1225,
    rel_type_name: "is classified as a",
    rh_object_uid: kindUID,
    rh_object_name: kindName,
    full_definition: definition,
  });
  return result.data;
};

export const deleteEntity = async (uid: number) => {
  const result = await axios.delete(
    `${URL}${DELETE_ENTITY_ENDPOINT}?uid=${uid}`,
  );
  return result.data;
};

export const getClassified = async (uid: number) => {
  const result = await axios.get(`${URL}${CLASSIFIED_ENDPOINT}?uid=${uid}`);
  return result.data;
};

export const getClassificationFact = async (uid: number) => {
  const result = await axios.get(
    `${URL}${CLASSIFICATION_FACT_ENDPOINT}?uid=${uid}`,
  );
  return result.data;
};

export const submitDefinition = async (
  fact_uid: number,
  partial_definition: string,
  full_definition: string,
) => {
  const result = await axios.put(`${URL}${SUBMIT_DEFINITION_ENDPOINT}`, {
    fact_uid,
    partial_definition,
    full_definition,
  });
  return result.data;
};
