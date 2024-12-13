import axios from "axios";
//@ts-ignore
import {
  SPECIALIZATION_FACT_ENDPOINT,
  DESCENDANTS_ENDPOINT,
  SYNONYM_FACTS_ENDPOINT,
  INVERSE_FACTS_ENDPOINT,
} from "@relica/constants";
//@ts-ignore
import { Fact } from "@relica/types";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_RELICA_DB_API_URL,
});

export default axiosInstance;

export const getSpecFact = async (uid: number): Promise<Fact> => {
  try {
    const response = await axiosInstance.get(SPECIALIZATION_FACT_ENDPOINT, {
      params: { uid },
    });
    // const { fact } = response.data;
    // return fact;
    return response.data;
  } catch (error) {
    console.error("Error:", error);
  }
};

export const getSynFacts = async (uid: number): Promise<Fact> => {
  try {
    const response = await axiosInstance.get(SYNONYM_FACTS_ENDPOINT, {
      params: { uid },
    });
    console.log("getSynFacts, response:", response);
    // const { facts } = response.data;
    // return facts;
    return response.data;
  } catch (error) {
    console.error("Error:", error);
  }
};

export const getInvFacts = async (uid: number): Promise<Fact> => {
  try {
    const response = await axiosInstance.get(INVERSE_FACTS_ENDPOINT, {
      params: { uid },
    });
    const { facts } = response.data;
    return facts;
  } catch (error) {
    console.error("Error:", error);
  }
};

export const getDescendants = async (uid: number): Promise<Array<number>> => {
  try {
    const response = await axiosInstance.get(DESCENDANTS_ENDPOINT, {
      params: { uid },
    });
    // console.log("getDescendants, response:", response);
    // const { descendants } = response.data;
    return response.data || [];
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
