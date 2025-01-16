import { AuthProvider, HttpError } from "react-admin";
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000",
});

// Add interceptor to handle 401s globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      return Promise.reject(new HttpError("Session expired", 401));
    }
    return Promise.reject(error);
  }
);

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
      const { data } = await apiClient.post("/auth/login", {
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
      await apiClient.post("/auth/validate", null, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const { data } = await apiClient.get("/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

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
