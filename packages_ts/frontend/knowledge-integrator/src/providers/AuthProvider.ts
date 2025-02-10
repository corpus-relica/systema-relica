import { AuthProvider, HttpError } from "react-admin";
import { shutterClient } from "../io/ShutterClient.js";
import { initializeWebSocket, closeWebSocket } from "../socket.js";

export const authProvider: AuthProvider = {
  login: async ({ email, password }: { email: string; password: string }) => {
    try {
      const { data } = await shutterClient.post("/api/login", {
        email,
        password,
      });
      console.log("Login response:", data);
      console.log(typeof data);
      // Note: backend sends 'token' in response, not 'access_token'
      const { token, user } = data;
      localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Initialize WebSocket connection after successful login
      await initializeWebSocket(token);

      return Promise.resolve(data);
    } catch (error) {
      console.error("Login error:", error);
      throw new HttpError("Unauthorized", 401, {
        message: "Invalid email or password",
      });
    }
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    closeWebSocket();
    return Promise.resolve();
  },

  checkError: (error) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      closeWebSocket();
      return Promise.reject();
    }
    return Promise.resolve();
  },

  checkAuth: async () => {
    const token = localStorage.getItem("access_token");
    console.log("Checking auth with token:", token);
    if (!token) {
      return Promise.reject();
    }
    try {
      // Validate token with backend - use the verify endpoint
      await shutterClient.post("/api/validate");

      // Ensure WebSocket is connected
      await initializeWebSocket(token);
      return Promise.resolve();
    } catch (error) {
      console.error("Auth check error:", error);
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      closeWebSocket();
      return Promise.reject();
    }
  },

  getIdentity: async () => {
    const token = localStorage.getItem("access_token");
    console.log("Getting identity with token:", token);

    if (!token) {
      return Promise.reject();
    }

    // Try to get from localStorage first
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return {
        id: user.id,
        fullName: user.username,
      };
    }

    // Fallback to API call if not in localStorage
    try {
      const { data } = await shutterClient.get("/auth/profile");
      return {
        id: data.sub,
        fullName: data.username,
      };
    } catch (error) {
      console.error("Get identity error:", error);
      return Promise.reject();
    }
  },

  getPermissions: () => Promise.resolve(undefined),
};

export const getAuthToken = () => localStorage.getItem("access_token");
