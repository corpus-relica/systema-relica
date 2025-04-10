import axios, { AxiosInstance } from "axios";
import { portalWs } from "../socket";

import {
  ENTITY_TYPE_ENDPOINT,
  SPECIALIZATION_HIERARCHY_ENDPOINT,
  GET_DEFINITION_ENDPOINT,
  ALL_RELATED_FACTS_ENDPOINT,
  SUBMIT_BINARY_FACT_ENDPOINT,
  CLASSIFIED_ENDPOINT,
  SUBTYPES_ENDPOINT,
  SUBTYPES_CONE_ENDPOINT,
} from "@relica/constants";

// Types for Prism setup
export interface SetupState {
  stage: "not-started" | "db-check" | "user-setup" | "db-seed" | "cache-build" | "complete";
  masterUser: string | null;
  status: string;
  progress: number;
  error: string | null;
}

console.log("Creating PortalClient instance...");

class PortalClient {
  axiosInstance: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_PORTAL_API_URL || "http://localhost:2174";
    this.axiosInstance = axios.create({
      baseURL,
    });

    // Add request interceptor to inject token
    this.axiosInstance.interceptors.request.use((config) => {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.axiosInstance.interceptors.request.use((config) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const clientId = portalWs.getClientId();

      // Add user context to all requests
      if (user.id) {
        config.params = {
          ...config.params,
          userId: user.id,
          clientId: clientId,
        };
      }
      return config;
    });

    // Add response interceptor to handle token expiration
    // this.axiosInstance.interceptors.response.use(
    //   (response) => response,
    //   (error) => {
    //     if (error.response?.status === 401) {
    //       localStorage.removeItem("access_token");
    //       window.location.href = "/#/login";
    //       return Promise.reject(
    //         new Error("Session expired, please login again")
    //       );
    //     }
    //     return Promise.reject(error);
    //   }
    // );

    console.log("CONNECTING PORTAL CLIENT", baseURL);
  }

  /////////////////////////// ENV ///////////////////////////

  async retrieveEnvironment() {
    const response = await this.axiosInstance.get("/environment/retrieve");
    return response.data;
  }

  async retrieveModels(uids: number[]) {
    const response = await this.axiosInstance.get("/model", {
      params: { uids },
    });
    return response.data;
  }

  async updateModelDefinition(
    fact_uid: number,
    partial_definition: string,
    full_definition: string
  ) {
    const response = await this.axiosInstance.put("/model/definition", {
      fact_uid,
      partial_definition,
      full_definition,
    });
    return response.data;
  }

  async updateModelName(fact_uid: number, name: string) {
    const response = await this.axiosInstance.put("/model/name", {
      fact_uid,
      name,
    });
    return response.data;
  }

  async updateModelCollection(
    fact_uid: number,
    collection_uid: number,
    collection_name: string
  ) {
    const response = await this.axiosInstance.put("/model/collection", {
      fact_uid,
      collection_uid,
      collection_name,
    });
    return response.data;
  }

  /////////////////////////// FACTS ///////////////////////////

  async resolveUIDs(uids: number[]) {
    const response = await this.axiosInstance.get("/concept/entities", {
      params: { uids: "[" + uids.join(",") + "]" },
    });
    return response.data;
  }

  async getSpecializationHierarchy(uid: number) {
    const response = await this.axiosInstance.get(
      SPECIALIZATION_HIERARCHY_ENDPOINT,
      {
        params: { uid },
      }
    );
    return response.data;
  }

  async getDefinition(uid: number) {
    const response = await this.axiosInstance.get(GET_DEFINITION_ENDPOINT, {
      params: { uid },
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

  async submitBinaryFact(fact: Fact) {
    const response = await this.axiosInstance.post(
      SUBMIT_BINARY_FACT_ENDPOINT,
      fact
    );
    return response.data;
  }

  async getClassified(uid: number) {
    const response = await this.axiosInstance.get(CLASSIFIED_ENDPOINT, {
      params: { uid },
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

  /////////////////////////// SEMANTIC MODELS ///////////////////////////

  async retrieveKindModel(uid: number) {
    if (!uid) return;
    const response = await this.axiosInstance.get("/model/kind", {
      params: { uid },
    });
    return response.data;
  }

  async retrieveIndividualModel(uid: number) {
    if (!uid) return;
    const response = await this.axiosInstance.get("/model/individual", {
      params: { uid },
    });
    return response.data;
  }

  async retrieveEntityModel(uid: number) {
    if (!uid) return;
    const response = await this.axiosInstance.get("/model/entity", {
      params: { uid },
    });
    return response.data;
  }

  /////////////////////////// PRISM SETUP ///////////////////////////

  // Get the current setup status
  async getSetupStatus(): Promise<SetupState> {
    try {
      const response = await this.axiosInstance.get("/api/prism/setup/status");
      return response.data;
    } catch (error) {
      console.error('Failed to get setup status:', error);
      throw error;
    }
  }

  // Start the setup sequence
  async startSetup(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.axiosInstance.post("/api/prism/setup/start");
      return response.data;
    } catch (error) {
      console.error('Failed to start setup:', error);
      throw error;
    }
  }

  // Create admin user during setup
  async createAdminUser(username: string, password: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.axiosInstance.post("/api/prism/setup/user", {
        username,
        password,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create admin user:', error);
      throw error;
    }
  }

  // Process current setup stage
  async processSetupStage(): Promise<{ success: boolean; message: string; state: SetupState }> {
    try {
      const response = await this.axiosInstance.post("/api/prism/setup/process-stage");
      return response.data;
    } catch (error) {
      console.error('Failed to process setup stage:', error);
      throw error;
    }
  }
}

export const portalClient = new PortalClient();
