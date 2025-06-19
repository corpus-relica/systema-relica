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

// Import canonical types from contracts
export type { SetupStatus } from '@relica/websocket-contracts';

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
      
      // If 401/403 and no token, try to get guest token first
      if ((error.response?.status === 401 || error.response?.status === 403) && !getAuthToken()) {
        try {
          const { token } = await getGuestToken();
          localStorage.setItem('access_token', token);
          // Retry the request with the guest token
          const response = await PortalAxiosInstance.get("/api/prism/setup/status");
          return response.data;
        } catch (guestError) {
          console.error('Failed to get guest token:', guestError);
          // Continue with normal retry logic
        }
      }
      
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
      const response = await PortalAxiosInstance.post("/api/prism/setup/create-admin-user", userData);
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
  // Create a fresh axios instance without auth interceptor for guest token
  const guestAxios = axios.create({
    baseURL: import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:2204',
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await guestAxios.post("/auth/guest");
      if(response.data.success === false) {
        throw new Error(`Guest token request failed: ${response.data.error}`);
      }
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

export const loadUserEnvironment = async (userId:number): Promise<any> => {
  const response = await PortalAxiosInstance.get("/environment/retrieve?userId=" + userId);
  return response.data;
};

export const resolveUIDs = async (uids: number[]): Promise <any> => {
  try {
    const response = await PortalAxiosInstance.get("/concept/entities", {
      params: { uids: "[" + uids.join(",") + "]" },
    });

    return response.data;
  }catch (error) {
    console.error('Failed to resolve UIDs:', error);
    throw new Error(`Failed to resolve UIDs: ${error.message}`);
  }
}

// DEBUG: Reset entire system (databases, setup state, etc.) via Prism
export const resetSystemState = async (): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await PortalAxiosInstance.post("/api/prism/debug/reset-system");
    return response.data;
  } catch (error) {
    console.error('System reset failed:', error);
    throw new Error(`Failed to reset system: ${error.message}`);
  }
};
