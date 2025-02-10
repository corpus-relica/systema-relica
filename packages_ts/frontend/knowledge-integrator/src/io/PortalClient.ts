import axios, { AxiosInstance } from "axios";

console.log("Creating PortalClient instance...");

class PortalClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    const baseURL =
      import.meta.env.VITE_PORTAL_API_URL || "http://localhost:2174";
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
      console.log("THE MUTHER FUCKIN USER", user);

      // Add user context to all requests
      if (user.id) {
        config.params = {
          ...config.params,
          userId: user.id,
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
}

export const portalClient = new PortalClient();
