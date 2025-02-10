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

import axios, { AxiosInstance } from "axios";
import { Fact } from "./types";

console.log("Creating ArchivistBaseClient instance...");
class ArchivistBaseClient {
  axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_RELICA_ARCHIVIST_API_URL,
    });

    // Add request interceptor to inject token
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor to handle token expiration
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem("access_token");
          window.location.href = "/#/login";
          return Promise.reject(
            new Error("Session expired, please login again")
          );
        }
        return Promise.reject(error);
      }
    );

    console.log(
      "CONNECTING ARCHIVIST CLIENT",
      import.meta.env.VITE_RELICA_ARCHIVIST_API_URL
    );
  }

  // Your existing methods, now as class methods
  async getSpecializationHierarchy(uid: number) {
    const response = await this.axiosInstance.get(
      SPECIALIZATION_HIERARCHY_ENDPOINT,
      {
        params: { uid },
      }
    );
    return response.data;
  }

  async getCollections(uid: number) {
    const response = await this.axiosInstance.get(COLLECTIONS_ENDPOINT, {
      params: { uid },
    });
    return response.data;
  }

  async getDefinition(uid: number) {
    const response = await this.axiosInstance.get(GET_DEFINITION_ENDPOINT, {
      params: { uid },
    });
    return response.data;
  }

  async uidSearch(searchTerm: number, collectionUID: string = "") {
    try {
      const response = await this.axiosInstance.get(UID_SEARCH_ENDPOINT, {
        params: { searchTerm, collectionUID },
      });
      const { facts } = response.data;
      return facts;
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async textSearch(
    searchTerm: string,
    page: number = 1,
    pageSize: number = 50
  ) {
    const response = await this.axiosInstance.get(TEXT_SEARCH_ENDPOINT, {
      params: { searchTerm, page, pageSize, collectionUID: "" },
    });
    return response.data;
  }

  async getEntityType(uid: number) {
    const type = await this.axiosInstance.get(ENTITY_TYPE_ENDPOINT, {
      params: { uid },
    });
    return type.data;
  }

  async getAllRelatedFacts(uid: number, n: number = 1) {
    const response = await this.axiosInstance.get(ALL_RELATED_FACTS_ENDPOINT, {
      params: { uid, depth: n },
    });
    return response.data;
  }

  async getSubtypes(uid: number) {
    const response = await this.axiosInstance.get(SUBTYPES_ENDPOINT, {
      params: { uid },
    });
    return response.data;
  }

  async getSubtypesCone(uid: number) {
    const response = await this.axiosInstance.get(SUBTYPES_CONE_ENDPOINT, {
      params: { uid },
    });
    return response.data;
  }

  async getClassified(uid: number) {
    const response = await this.axiosInstance.get(CLASSIFIED_ENDPOINT, {
      params: { uid },
    });
    return response.data;
  }

  async getClassificationFact(uid: number) {
    const response = await this.axiosInstance.get(
      CLASSIFICATION_FACT_ENDPOINT,
      {
        params: { uid },
      }
    );
    return response.data;
  }

  async resolveUIDs(uids: number[]) {
    const response = await this.axiosInstance.get("/concept/entities", {
      params: { uids: "[" + uids.join(",") + "]" },
    });
    return response.data;
  }

  async getEntityPrompt({ queryKey }: { queryKey: [string, number] }) {
    const [_key, uid] = queryKey;
    const response = await this.axiosInstance.get("/retrieveEntity/prompt", {
      params: { uid },
    });
    return response.data;
  }

  async postEntityPrompt(uid: number, prompt: string) {
    const response = await this.axiosInstance.post("/retrieveEntity/prompt", {
      uid,
      prompt,
    });
    return response.data;
  }

  async validateBinaryFact(fact: Fact) {
    const response = await this.axiosInstance.get(
      SIMPLE_VALIDATE_BINARY_FACT_ENDPOINT,
      { params: fact }
    );
    return response.data;
  }

  async submitBinaryFact(fact: Fact) {
    const response = await this.axiosInstance.post(
      SUBMIT_BINARY_FACT_ENDPOINT,
      fact
    );
    return response.data;
  }
}

// Create and export a singleton instance
export const archivistClient = new ArchivistBaseClient();

// You can also export individual methods if you want to keep the same interface
export const getSpecializationHierarchy = (uid: number) =>
  archivistClient.getSpecializationHierarchy(uid);
export const getCollections = (uid: number) =>
  archivistClient.getCollections(uid);
export const getDefinition = (uid: number) =>
  archivistClient.getDefinition(uid);
export const uidSearch = (searchTerm: number, collectionUID: string = "") =>
  archivistClient.uidSearch(searchTerm, collectionUID);
export const textSearch = (
  searchTerm: string,
  page: number = 1,
  pageSize: number = 50
) => archivistClient.textSearch(searchTerm, page, pageSize);
export const getEntityType = (uid: number) =>
  archivistClient.getEntityType(uid);
export const getAllRelatedFacts = (uid: number, n: number = 1) =>
  archivistClient.getAllRelatedFacts(uid, n);
export const getSubtypes = (uid: number) => archivistClient.getSubtypes(uid);
export const getSubtypesCone = (uid: number) =>
  archivistClient.getSubtypesCone(uid);
export const getClassified = (uid: number) =>
  archivistClient.getClassified(uid);
export const getClassificationFact = (uid: number) =>
  archivistClient.getClassificationFact(uid);
export const resolveUIDs = (uids: number[]) =>
  archivistClient.resolveUIDs(uids);
export const getEntityPrompt = ({ queryKey }: { queryKey: [string, number] }) =>
  archivistClient.getEntityPrompt({ queryKey });
export const postEntityPrompt = (uid: number, prompt: string) =>
  archivistClient.postEntityPrompt(uid, prompt);
export const validateBinaryFact = (fact: Fact) =>
  archivistClient.validateBinaryFact(fact);
export const submitBinaryFact = (fact: Fact) =>
  archivistClient.submitBinaryFact(fact);

// // Export the class as well in case someone needs to create a new instance
// export default ArchivistBaseClient;
