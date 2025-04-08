import { AuthProvider, HttpError } from "react-admin";
import { shutterClient } from "../io/ShutterClient.js";
import { prismApi } from "../io/PrismClient.js";
import { initializeWebSocket, closeWebSocket } from "../socket.js";

// Add a flag to track if setup is needed
let setupNeeded = false;

export const authProvider: AuthProvider = {
  login: async ({ email, password }: { email: string; password: string }) => {
    try {
      // First, check if we need to run setup
      try {
        const setupState = await prismApi.getSetupStatus();
        
        // If setup is not complete, redirect to setup
        if (setupState.stage !== 'complete') {
          setupNeeded = true;
          throw new HttpError("Setup required", 307, {
            message: "System setup is required",
            redirectTo: "/setup"
          });
        }
      } catch (err: any) {
        // If error is our own setup redirect, throw it
        if (err instanceof HttpError && err.status === 307) {
          throw err;
        }
        // Otherwise, assume Prism is not available or setup is complete,
        // and continue with normal login
        console.warn("Setup check failed, proceeding with login:", err);
      }

      // Normal login process
      const { data } = await shutterClient.post("/api/login", {
        email,
        password,
      });
      console.log("Login response:", data);
      // Note: backend sends 'token' in response, not 'access_token'
      const { token, user } = data;
      localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Initialize WebSocket connection after successful login
      await initializeWebSocket(token);

      return Promise.resolve(data);
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Special case for setup redirect
      if (error instanceof HttpError && error.status === 307) {
        throw error; // Let the react-admin login page handle the redirect
      }
      
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
    
    // First check if setup is needed
    try {
      const setupState = await prismApi.getSetupStatus();
      
      // If setup is not complete, set flag and reject auth
      if (setupState.stage !== 'complete') {
        setupNeeded = true;
        return Promise.reject({ redirectTo: '/setup' });
      }
    } catch (err) {
      // If we can't connect to Prism, assume setup is complete
      console.warn("Setup check failed during auth check:", err);
    }
    
    // If no token, auth fails
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

// Helper function to check if setup is needed
export const isSetupNeeded = () => setupNeeded;

// Reset setup flag (e.g., after setup is complete)
export const resetSetupFlag = () => {
  setupNeeded = false;
};

export const getAuthToken = () => localStorage.getItem("access_token");
