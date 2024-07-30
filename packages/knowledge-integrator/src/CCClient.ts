import axios from "axios";

console.log("CONNECTING CC CLIENT", import.meta.env.VITE_RELICA_CC_API_URL);
const CCAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_RELICA_CC_API_URL,
});

export const retrieveEnvironment = async () => {
  const response = await CCAxiosInstance.get("/environment/retrieve");
  return response.data;
};

export const retrieveKindModel = async (uid: number) => {
  if (!uid) return;
  const response = await CCAxiosInstance.get("/model/kind", {
    params: { uid },
  });
  return response.data;
};

export const retrieveIndividualModel = async (uid: number) => {
  if (!uid) return;
  const response = await CCAxiosInstance.get("/model/individual", {
    params: { uid },
  });
  return response.data;
};

export const retrieveModels = async (uids: number[]) => {
  const response = await CCAxiosInstance.get("/model", {
    params: { uids },
  });
  return response.data;
};

export const updateModelDefinition = async (
  fact_uid: number,
  partial_definition: string,
  full_definition: string
) => {
  const response = await CCAxiosInstance.put("/model/definition", {
    fact_uid,
    partial_definition,
    full_definition,
  });
  return response.data;
};

export const updateModelCollection = async (
  fact_uid: number,
  collection_uid: number,
  collection_name: string
) => {
  const response = await CCAxiosInstance.put("/model/collection", {
    fact_uid,
    collection_uid,
    collection_name,
  });
  return response.data;
};

export const conjureDefinition = async (
  apiKey: string,
  supertypeUID: number,
  newKindName: string
) => {
  const response = await CCAxiosInstance.get(
    "/artificialIntelligence/conjureDefinition",
    {
      params: { apiKey, supertypeUID, newKindName },
    }
  );
  return response.data;
};

/////////////////////////////////////////////// MODELLING /////////////////

export const getWorkflows = async () => {
  const response = await CCAxiosInstance.get("/modelling/workflows");
  return response.data;
};

export const getWorkflowState = async () => {
  const response = await CCAxiosInstance.get("/modelling/state");
  return response.data;
};

export const initWorkflow = async (workflowId: string) => {
  const response = await CCAxiosInstance.get(
    "/modelling/workflow/init/" + workflowId
  );
  return response.data;
};

export const branchWorkflow = async (workflowId: string) => {
  const response = await CCAxiosInstance.get(
    "/modelling/workflow/branch/" + workflowId
  );
  return response.data;
};

export const incrementWorkflowStep = async (workflowId: string) => {
  const response = await CCAxiosInstance.get(
    "/modelling/workflow/increment/" + workflowId
  );
  return response.data;
};

export const decrementWorkflowStep = async (workflowId: string) => {
  const response = await CCAxiosInstance.get(
    "/modelling/workflow/decrement/" + workflowId
  );
  return response.data;
};
