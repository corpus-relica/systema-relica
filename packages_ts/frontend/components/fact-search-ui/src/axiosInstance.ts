import axios, { AxiosInstance, CancelTokenSource } from "axios";
//@ts-ignore
import {
  COLLECTIONS_ENDPOINT,
  UID_SEARCH_KIND_ENDPOINT,
  TEXT_SEARCH_KIND_ENDPOINT,
  UID_SEARCH_INDIVIDUAL_ENDPOINT,
  TEXT_SEARCH_INDIVIDUAL_ENDPOINT,
  UID_SEARCH_ENDPOINT,
  TEXT_SEARCH_ENDPOINT,
  KIND,
  INDIVIDUAL,
  ALL,
} from "@relica/constants";

// Internal variable to hold the singleton instance
let instance: AxiosInstance | null = null;
let currentCancelToken: CancelTokenSource | null = null;

// Function to initialize the singleton instance
export const initializeAxiosInstance = (baseURL: string, token?: string) => {
  if (!baseURL) {
    console.error("Axios instance cannot be initialized without a baseURL.");
    // Or throw an error, depending on desired strictness
    // throw new Error("Axios instance cannot be initialized without a baseURL.");
    return; // Prevent initialization if baseURL is missing
  }
  instance = axios.create({
    baseURL: baseURL, // Use the provided baseURL
  });

  // Add request interceptor to inject the token
  instance.interceptors.request.use((config) => {
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  // Optional: Add response interceptors if needed (e.g., error handling)
  // instance.interceptors.response.use(...);

  console.log(`Axios instance initialized with baseURL: ${baseURL}`);
};

// Function to get the initialized instance
export const getAxiosInstance = (): AxiosInstance => {
  if (!instance) {
    throw new Error(
      "Axios instance has not been initialized. Call initializeAxiosInstance first."
    );
  }
  return instance;
};

// --- API Call Functions --- (Now use getAxiosInstance)

export const uidSearch = async (
  searchTerm: string,
  collectionUID: string = ""
) => {
  try {
    const axiosInstance = getAxiosInstance(); // Get the initialized instance
    const response = await axiosInstance.get(UID_SEARCH_ENDPOINT, {
      params: { searchTerm, collectionUID },
    });
    const { facts } = response.data;
    return facts;
  } catch (error) {
    console.error("Error in uidSearch:", error);
    throw error;
  }
};

export const getCollections = async () => {
  try {
    const axiosInstance = getAxiosInstance(); // Get the initialized instance
    const response = await axiosInstance.get(COLLECTIONS_ENDPOINT);
    const collections = response.data.collections;
    return collections;
  } catch (error) {
    console.error("Error in getCollections:", error);
    throw error;
  }
};

function isIntegerString(str: string) {
  return Number.isInteger(Number(str));
}

export const performSearch = async (
  searchTerm: string,
  page: number,
  pageSize: number,
  filter: { type: string; uid: number } | undefined
) => {
  const axiosInstance = getAxiosInstance(); // Get the initialized instance
  const searchType: string = ""; // KIND;
  const selectedCollName = ALL;
  const selectedCollUID = "";

  // Check if there are any previous pending requests
  if (currentCancelToken) {
    currentCancelToken.cancel("Operation canceled due to new request.");
  }

  // Save the new request for cancellation
  currentCancelToken = axios.CancelToken.source();

  try {
    const isUID = isIntegerString(searchTerm);
    let targetEndpoint;

    if (searchType === KIND) {
      targetEndpoint = isUID
        ? UID_SEARCH_KIND_ENDPOINT
        : TEXT_SEARCH_KIND_ENDPOINT;
    } else if (searchType === INDIVIDUAL) {
      targetEndpoint = isUID
        ? UID_SEARCH_INDIVIDUAL_ENDPOINT
        : TEXT_SEARCH_INDIVIDUAL_ENDPOINT;
    } else if (selectedCollName === ALL) {
      targetEndpoint = isUID ? UID_SEARCH_ENDPOINT : TEXT_SEARCH_ENDPOINT;
    }

    if (targetEndpoint && searchTerm !== "") {
      const response = await axiosInstance.get(targetEndpoint, {
        params: {
          searchTerm,
          collectionUID: selectedCollUID,
          page,
          pageSize,
          filter,
        },
        cancelToken: currentCancelToken.token, // Assign the cancel token to this request
      });

      console.log("performSearch response.data", response.data);
      currentCancelToken = null; // Clear token after successful request
      return {
        facts: response.data.facts,
        count: response.data.totalCount,
      };
    }

    return {
      facts: [],
      count: 0,
    };
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message);
    } else {
      console.error("Error in performSearch:", error);
    }
    currentCancelToken = null; // Clear token on error
    // Depending on how you want to handle cancellations, you might re-throw or return empty
    // For now, let's just return empty to avoid breaking the UI on cancellation
    // throw error;
    return { facts: [], count: 0 }; // Return empty on error/cancellation
  }
};

export const performQuery = async (
  query: string,
  page: number = 1,
  pageSize: number = 50
) => {
  try {
    const axiosInstance = getAxiosInstance(); // Get the initialized instance
    const response = await axiosInstance.post("/query/queryString", {
      queryString: query,
      page,
      pageSize,
    });
    return response.data;
  } catch (error) {
    console.error("Error in performQuery:", error);
    throw error;
  }
};
