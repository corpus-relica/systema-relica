import axios from "axios";
import { getAuthToken } from "./authProvider";

console.log("CONNECTING PORTAL CLIENT", import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:2204');

const PortalAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:2204',
});

// Add request interceptor to include auth token
PortalAxiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SetupStatus {
  setupRequired: boolean;
  state: {
    id: string;
    substate?: string;
    full_path: string[];
  };
  progress: number;
  status: string;  // Human-readable status message from backend
  error?: string;
  masterUser?: string;
}

export interface AdminUserData {
  username: string;
  password: string;
  email?: string;
}

export const getSetupStatus = async (retries = 3): Promise<SetupStatus> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await PortalAxiosInstance.get("/api/prism/setup/status");
      return response.data;
    } catch (error) {
      console.error(`Setup status check failed (attempt ${attempt}/${retries}):`, error);
      
      if (attempt === retries) {
        throw new Error(`Failed to get setup status after ${retries} attempts: ${error.message}`);
      }
      
      // Exponential backoff: 1s, 2s, 4s
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
    }
  }
};

export const startSetup = async (retries = 2): Promise<{ success: boolean; message?: string }> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await PortalAxiosInstance.post("/api/prism/setup/start");
      return response.data;
    } catch (error) {
      console.error(`Start setup failed (attempt ${attempt}/${retries}):`, error);
      
      if (attempt === retries) {
        throw new Error(`Failed to start setup after ${retries} attempts: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};

export const createAdminUser = async (userData: AdminUserData, retries = 2): Promise<{ success: boolean; user?: any; message?: string }> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await PortalAxiosInstance.post("/api/prism/setup/admin-user", userData);
      return response.data;
    } catch (error) {
      console.error(`Create admin user failed (attempt ${attempt}/${retries}):`, error);
      
      if (attempt === retries) {
        throw new Error(`Failed to create admin user after ${retries} attempts: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
};

export const getGuestToken = async (retries = 3): Promise<{ token: string }> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await PortalAxiosInstance.post("/api/auth/guest");
      return response.data;
    } catch (error) {
      console.error(`Get guest token failed (attempt ${attempt}/${retries}):`, error);
      
      if (attempt === retries) {
        throw new Error(`Failed to get guest token after ${retries} attempts: ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export const checkAuthenticationStatus = async (): Promise<{ authenticated: boolean; user?: any }> => {
  try {
    const response = await PortalAxiosInstance.get("/api/auth/status");
    return response.data;
  } catch (error) {
    return { authenticated: false };
  }
};

export const loadUserEnvironment = async (): Promise<any> => {
  const response = await PortalAxiosInstance.get("/api/environment/user");
  return response.data;
};