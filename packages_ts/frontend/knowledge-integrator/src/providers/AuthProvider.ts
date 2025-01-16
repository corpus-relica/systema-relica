import { AuthProvider, HttpError } from "react-admin";
import { archivistClient } from "../io/ArchivistBaseClient.js";

export const getAuthToken = () => {
  const token = localStorage.getItem("access_token");
  console.log("getAuthToken called, token:", token ? "exists" : "missing");
  return token;
};

export const authProvider: AuthProvider = {
  login: async ({
    username,
    password,
  }: {
    username: string;
    password: string;
  }) => {
    try {
      const { data } = await archivistClient.axiosInstance.post("/auth/login", {
        username,
        password,
      });
      const { access_token } = data;
      localStorage.setItem("access_token", access_token);
      return Promise.resolve(data);
    } catch (error) {
      throw new HttpError("Unauthorized", 401, {
        message: "Invalid username or password",
      });
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    return Promise.resolve();
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("access_token");
      return Promise.reject();
    }
    return Promise.resolve();
  },

  checkAuth: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return Promise.reject();
    }

    try {
      // Validate token with backend
      // The token will be automatically injected by the axiosInstance interceptor
      await archivistClient.axiosInstance.post("/auth/validate");
      return Promise.resolve();
    } catch {
      localStorage.removeItem("access_token");
      return Promise.reject();
    }
  },

  getIdentity: async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return Promise.reject();
    }

    try {
      // The token will be automatically injected by the axiosInstance interceptor
      const { data } = await archivistClient.axiosInstance.get("/auth/profile");
      return {
        id: data.sub,
        fullName: data.username,
        // Add any other user properties you want to expose
      };
    } catch {
      return Promise.reject();
    }
  },

  getPermissions: () => {
    return Promise.resolve(undefined);
  },
};

export default authProvider;
