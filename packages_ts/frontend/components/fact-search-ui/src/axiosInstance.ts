import axios from "axios";
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
import qs from "qs"; // You may need to install the 'qs' library

// Create a function to initialize the axios instance with a token
export const createAxiosInstance = (token?: string) => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_RELICA_PORTAL_API_URL,
  });

  instance.interceptors.request.use((config) => {
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

// Export a default instance for cases where no token is needed
let axiosInstance = createAxiosInstance();

// Export a function to update the instance when token changes
export const updateAxiosInstance = (token?: string) => {
  axiosInstance = createAxiosInstance(token);
};

export default axiosInstance;

export const uidSearch = async (
  searchTerm: string,
  collectionUID: string = ""
) => {
  try {
    const response = await axiosInstance.get(UID_SEARCH_ENDPOINT, {
      params: { searchTerm, collectionUID },
    });
    const { facts } = response.data;
    return facts;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const getCollections = async () => {
  try {
    const response = await axiosInstance.get(COLLECTIONS_ENDPOINT);
    const collections = response.data;
    return collections;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

function isIntegerString(str: string) {
  return Number.isInteger(Number(str));
}

// Create a variable to store the current cancel token
let cancelToken: any;

export const performSearch = async (
  searchTerm: string,
  page: number,
  pageSize: number,
  // config: any
  filter: { type: string; uid: number } | undefined
) => {
  const searchType: string = ""; //KIND;
  const selectedCollName = ALL;
  const selectedCollUID = "";

  // Check if there are any previous pending requests
  if (typeof cancelToken != typeof undefined) {
    cancelToken.cancel("Operation canceled due to new request.");
  }

  // Save the new request for cancellation
  cancelToken = axios.CancelToken.source();

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
        cancelToken: cancelToken.token, // Assign the cancel token to this request
      });

      console.log("response.data", response.data);
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
    console.error("Error:", error);
    throw error;
  }
};

export const performQuery = async (
  query: string,
  page: number = 1,
  pageSize: number = 50
) => {
  try {
    // const response = await axiosInstance.get("/query/queryString", {
    //   params: { queryString: query },
    // });
    // POST
    const response = await axiosInstance.post("/query/queryString", {
      queryString: query,
      page,
      pageSize,
    });
    return response.data;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
