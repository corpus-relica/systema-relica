import axios, { AxiosInstance } from "axios";

console.log("Creating CCBaseClient instance...");
class CCBaseClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_RELICA_CC_API_URL,
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
          localStorage.removeItem("access_token");
          window.location.href = "/#/login";
          return Promise.reject(
            new Error("Session expired, please login again")
          );
        }
        return Promise.reject(error);
      }
    );

    console.log("CONNECTING CC CLIENT", import.meta.env.VITE_RELICA_CC_API_URL);
  }

  async retrieveEnvironment() {
    const response = await this.axiosInstance.get("/environment/retrieve");
    return response.data;
  }

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

  async conjureDefinition(
    apiKey: string,
    supertypeUID: number,
    newKindName: string
  ) {
    const response = await this.axiosInstance.get(
      "/artificialIntelligence/conjureDefinition",
      {
        params: { apiKey, supertypeUID, newKindName },
      }
    );
    return response.data;
  }

  // Modelling methods
  async getWorkflows() {
    const response = await this.axiosInstance.get("/modelling/workflows");
    return response.data;
  }

  async getWorkflowState() {
    const response = await this.axiosInstance.get("/modelling/state");
    return response.data;
  }

  async initWorkflow(workflowId: string) {
    const response = await this.axiosInstance.get(
      "/modelling/workflow/init/" + workflowId
    );
    return response.data;
  }

  async branchWorkflow(fieldId: string, workflowId: string) {
    const response = await this.axiosInstance.get(
      "/modelling/workflow/branch/" + fieldId + "/" + workflowId
    );
    return response.data;
  }

  async incrementWorkflowStep(workflowId: string) {
    const response = await this.axiosInstance.get(
      "/modelling/workflow/increment/" + workflowId
    );
    return response.data;
  }

  async decrementWorkflowStep(workflowId: string) {
    const response = await this.axiosInstance.get(
      "/modelling/workflow/decrement/" + workflowId
    );
    return response.data;
  }

  async validateWorkflow() {
    const response = await this.axiosInstance.get(
      "/modelling/workflow/validate"
    );
    return response.data;
  }

  async finalizeWorkflow() {
    const response = await this.axiosInstance.get(
      "/modelling/workflow/finalize"
    );
    return response.data;
  }

  async popWorkflow() {
    const response = await this.axiosInstance.get("/modelling/workflow/pop");
    return response.data;
  }

  async setWorkflowValue(key: string, value: any) {
    const response = await this.axiosInstance.get(
      `/modelling/workflow/setValue/${key}/${value}`
    );
    return response.data;
  }

  async setWorkflowKGValue(key: string, uid: number, value: any) {
    const response = await this.axiosInstance.get(
      `/modelling/workflow/setKGValue/${key}/${uid}/${value}`
    );
    return response.data;
  }
}

// Create and export a singleton instance
export const ccClient = new CCBaseClient();

// Export individual methods to maintain the same interface
export const retrieveEnvironment = () => ccClient.retrieveEnvironment();
export const retrieveKindModel = (uid: number) =>
  ccClient.retrieveKindModel(uid);
export const retrieveIndividualModel = (uid: number) =>
  ccClient.retrieveIndividualModel(uid);
export const retrieveModels = (uids: number[]) => ccClient.retrieveModels(uids);
export const updateModelDefinition = (
  fact_uid: number,
  partial_definition: string,
  full_definition: string
) =>
  ccClient.updateModelDefinition(fact_uid, partial_definition, full_definition);
export const updateModelName = (fact_uid: number, name: string) =>
  ccClient.updateModelName(fact_uid, name);
export const updateModelCollection = (
  fact_uid: number,
  collection_uid: number,
  collection_name: string
) => ccClient.updateModelCollection(fact_uid, collection_uid, collection_name);
export const conjureDefinition = (
  apiKey: string,
  supertypeUID: number,
  newKindName: string
) => ccClient.conjureDefinition(apiKey, supertypeUID, newKindName);

// Export modelling methods
export const getWorkflows = () => ccClient.getWorkflows();
export const getWorkflowState = () => ccClient.getWorkflowState();
export const initWorkflow = (workflowId: string) =>
  ccClient.initWorkflow(workflowId);
export const branchWorkflow = (fieldId: string, workflowId: string) =>
  ccClient.branchWorkflow(fieldId, workflowId);
export const incrementWorkflowStep = (workflowId: string) =>
  ccClient.incrementWorkflowStep(workflowId);
export const decrementWorkflowStep = (workflowId: string) =>
  ccClient.decrementWorkflowStep(workflowId);
export const validateWorkflow = () => ccClient.validateWorkflow();
export const finalizeWorkflow = () => ccClient.finalizeWorkflow();
export const popWorkflow = () => ccClient.popWorkflow();
export const setWorkflowValue = (key: string, value: any) =>
  ccClient.setWorkflowValue(key, value);
export const setWorkflowKGValue = (key: string, uid: number, value: any) =>
  ccClient.setWorkflowKGValue(key, uid, value);

// export default CCBaseClient;
