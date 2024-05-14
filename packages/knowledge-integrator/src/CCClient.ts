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
  full_definition: string,
) => {
  const response = await CCAxiosInstance.put("/model/definition", {
    fact_uid,
    partial_definition,
    full_definition,
  });
  return response.data;
};
