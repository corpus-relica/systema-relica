import axios from "axios";
import {
  SUBMIT_DEFINITION_ENDPOINT,
  DELETE_ENTITY_ENDPOINT,
} from "@relica/constants";

const URL = process.env.RELICA_NEO4J_URL;

export const getSpecializationHierarchy = async (uid: number) => {
  const result = await axios.get(
    `${URL}/factRetrieval/specializationHierarchy?uid=${uid}`,
  );
  return result.data;
};

export const getSpecializationFact = async (uid: number) => {
  const result = await axios.get(
    `${URL}/factRetrieval/specializationFact?uid=${uid}`,
  );
  return result.data;
};

export const getSubtypes = async (uid: number) => {
  const result = await axios.get(`${URL}/factRetrieval/subtypes?uid=${uid}`);
  return result.data;
};

export const getSubtypesCone = async (uid: number) => {
  const result = await axios.get(
    `${URL}/factRetrieval/subtypesCone?uid=${uid}`,
  );
  return result.data;
};

export const getFact = async (uid: number) => {
  const result = await axios.get(`${URL}/factRetrieval/fact?uid=${uid}`);
  return result.data;
};

export const getFacts = async (factUIDs: number[]) => {
  const result = await axios.get(
    `${URL}/factRetrieval/facts?uids=${JSON.stringify(factUIDs)}`,
  );
  return result.data;
};

export const getEntity = async (uid: number) => {
  const result = await axios.get(`${URL}/retrieveEntity/entity?uid=${uid}`);
  return result.data;
};

export const retrieveAllFacts = async (uid: number) => {
  const result = await axios.get(
    `${URL}/factRetrieval/allRelatedFacts?uid=${uid}`,
  );
  return result.data;
};

export const getCategory = async (uid: number) => {
  console.log("getCategory", uid, `${URL}/retrieveEntity/category?uid=${uid}`);
  const result = await axios.get(`${URL}/retrieveEntity/category?uid=${uid}`);
  console.log("getCategory result", result.data);
  return result.data;
};

export const getDefinitiveFacts = async (uid: number) => {
  console.log("getDefinitiveFacts", uid);
  console.log(`${URL}/factRetrieval/definitiveFacts?uid=${uid}`);
  const result = await axios.get(
    `${URL}/factRetrieval/definitiveFacts?uid=${uid}`,
  );
  console.log("getDefinitiveFacts", result.data);
  return result.data;
};

export const getRelatedOnUIDSubtypeCone = async (
  lh_object_uid: number,
  rel_type_uid: number,
) => {
  const result = await axios.get(
    `${URL}/factRetrieval/relatedOnUIDSubtypeCone?lh_object_uid=${lh_object_uid}&rel_type_uid=${rel_type_uid}`,
  );
  return result.data;
};

export const getEntityType = async (uid: number) => {
  const result = await axios.get(`${URL}/retrieveEntity/type?uid=${uid}`);
  return result.data;
};

export const getFactsRelatingEntities = async (uid1: number, uid2: number) => {
  console.log("getFactsRelatingEntities", uid1, uid2);
  const result = await axios.get(
    `${URL}/factRetrieval/factsRelatingEntities?uid1=${uid1}&uid2=${uid2}`,
  );
  return result.data;
};

export const textSearchExact = async (searchTerm: string) => {
  const result = await axios.get(
    `${URL}/generalSearch/text?searchTerm=${searchTerm}&exactMatch=true`,
  );
  return result.data;
};

export const createKind = async (
  parentUID: number,
  parentName: string,
  name: string,
  definition: string,
) => {
  const result = await axios.post(`${URL}/submit/binaryFact`, {
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
  const result = await axios.post(`${URL}/submit/binaryFact`, {
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
  const result = await axios.get(`${URL}/factRetrieval/classified?uid=${uid}`);
  return result.data;
};

export const getClassificationFact = async (uid: number) => {
  const result = await axios.get(
    `${URL}/factRetrieval/classificationFact?uid=${uid}`,
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
