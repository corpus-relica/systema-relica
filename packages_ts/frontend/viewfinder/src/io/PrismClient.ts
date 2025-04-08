import axios from "axios";

// Create a client for communicating with the Prism setup API
export const prismClient = axios.create({
  baseURL: import.meta.env.VITE_PRISM_API_URL || "http://localhost:3333",
});

// Types for Prism setup API responses
export interface SetupState {
  stage: "not-started" | "db-check" | "user-setup" | "db-seed" | "cache-build" | "complete";
  masterUser: string | null; // Changed from master-user to match camelCase
  status: string;
  progress: number;
  error: string | null;
}

export interface AdminUserCredentials {
  username: string;
  password: string;
  confirmPassword: string;
}

// API functions for Prism setup
export const prismApi = {
  // Get the current setup state
  getSetupStatus: async (): Promise<SetupState> => {
    const response = await prismClient.get("/api/setup/status");
    return response.data;
  },

  // Start the setup sequence
  startSetup: async (): Promise<{ success: boolean; message: string }> => {
    const response = await prismClient.post("/api/setup/start");
    return response.data;
  },

  // Create admin user
  createAdminUser: async (credentials: AdminUserCredentials): Promise<{ success: boolean; message: string }> => {
    const response = await prismClient.post("/api/setup/user", credentials);
    return response.data;
  },

  // Process the current setup stage
  processStage: async (): Promise<{ success: boolean; message: string; state: SetupState }> => {
    const response = await prismClient.post("/api/setup/process-stage");
    return response.data;
  }
};