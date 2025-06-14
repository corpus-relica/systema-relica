import axios from "axios";
//@ts-ignore
import {
  ENTITY_TYPE_ENDPOINT,
  SPECIALIZATION_HIERARCHY_ENDPOINT,
  GET_DEFINITION_ENDPOINT,
  COLLECTIONS_ENDPOINT,
  UID_SEARCH_ENDPOINT,
  TEXT_SEARCH_ENDPOINT,
  SUBTYPES_ENDPOINT,
  SUBTYPES_CONE_ENDPOINT,
  ALL_RELATED_FACTS_ENDPOINT,
  CLASSIFIED_ENDPOINT,
  CLASSIFICATION_FACT_ENDPOINT,
  SIMPLE_VALIDATE_BINARY_FACT_ENDPOINT,
  SUBMIT_BINARY_FACT_ENDPOINT,
} from "@relica/constants";
import { Fact } from "./types";
import { getAuthToken } from "./authProvider";

console.log('Creating ArchivistDataProvider axios instance...');
const apiUrl = import.meta.env.VITE_RELICA_DB_API_URL || 'http://localhost:3000';

console.log(
  "connections RLC BASE CLIENT ", apiUrl
);

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_RELICA_DB_API_URL,
});

export const getSpecializationHierarchy = async (uid: number) => {
  const response = await axiosInstance.get(SPECIALIZATION_HIERARCHY_ENDPOINT, {
    params: { uid },
  });
  return response.data;
};

export const getCollections = async (uid: number) => {
  const response = await axiosInstance.get(COLLECTIONS_ENDPOINT, {
    params: { uid },
  });
  return response.data;
};

export const getDefinition = async (uid: number) => {
  const response = await axiosInstance.get(GET_DEFINITION_ENDPOINT, {
    params: { uid },
  });
  return response.data;
};

export const uidSearch = async (
  searchTerm: number,
  collectionUID: string = "",
) => {
  try {
    const response = await axiosInstance.get(UID_SEARCH_ENDPOINT, {
      params: { searchTerm, collectionUID },
    });
    const { facts } = response.data;
    return facts;
  } catch (error) {
    console.error("Error:", error);
  }
};

export const textSearch = async (
  searchTerm: string,
  page: number = 1,
  pageSize: number = 50,
) => {
  const response = await axiosInstance.get(TEXT_SEARCH_ENDPOINT, {
    params: { searchTerm, page, pageSize, collectionUID: "" },
  });
  return response.data;
};

export const getEntityType = async (uid: number) => {
  const type = await axiosInstance.get(ENTITY_TYPE_ENDPOINT, {
    params: { uid },
  });
  return type.data;
};

export const getAllRelatedFacts = async (uid: number, n: number = 1) => {
  const response = await axiosInstance.get(ALL_RELATED_FACTS_ENDPOINT, {
    params: { uid, depth: n },
  });
  return response.data;
};

export const getSubtypes = async (uid: number) => {
  const response = await axiosInstance.get(SUBTYPES_ENDPOINT, {
    params: { uid },
  });
  return response.data;
};

export const getSubtypesCone = async (uid: number) => {
  const response = await axiosInstance.get(SUBTYPES_CONE_ENDPOINT, {
    params: { uid },
  });
  return response.data;
};

export const getClassified = async (uid: number) => {
  const response = await axiosInstance.get(CLASSIFIED_ENDPOINT, {
    params: { uid },
  });
  return response.data;
};

export const getClassificationFact = async (uid: number) => {
  const response = await axiosInstance.get(CLASSIFICATION_FACT_ENDPOINT, {
    params: { uid },
  });
  return response.data;
};

export const resolveUIDs = async (uids: number[]) => {
  const response = await axiosInstance.get("/concept/entities", {
    params: { uids: "[" + uids.join(",") + "]" },
  });
  return response.data;
};

export const getEntityPrompt = async ({ queryKey }) => {
  const [_key, uid] = queryKey;
  const response = await axiosInstance.get("/retrieveEntity/prompt", {
    params: { uid },
  });
  return response.data;
};

export const postEntityPrompt = async (uid: number, prompt: string) => {
  const response = await axiosInstance.post("/retrieveEntity/prompt", {
    uid,
    prompt,
  });
  return response.data;
};

export const validateBinaryFact = async (fact: Fact) => {
  const response = await axiosInstance.get(
    SIMPLE_VALIDATE_BINARY_FACT_ENDPOINT,
    { params: fact },
  );
  return response.data;
};

export const submitBinaryFact = async (fact: Fact) => {
  const response = await axiosInstance.post(SUBMIT_BINARY_FACT_ENDPOINT, fact);
  return response.data;
};
