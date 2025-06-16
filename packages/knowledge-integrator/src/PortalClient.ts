import axios from "axios";
import { getAuthToken } from "./authProvider";

console.log("CONNECTING PORTAL CLIENT", import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:3001');

const PortalAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:3001',
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
  stage: 'idle' | 'checking_db' | 'awaiting_user_credentials' | 'creating_admin_user' | 'seeding_db' | 'building_caches' | 'setup_complete';
  progress: number;
  message?: string;
  error?: string;
}

export interface AdminUserData {
  username: string;
  password: string;
  email?: string;
}

export const getSetupStatus = async (): Promise<SetupStatus> => {
  const response = await PortalAxiosInstance.get("/api/prism/setup/status");
  return response.data;
};

export const startSetup = async (): Promise<{ success: boolean; message?: string }> => {
  const response = await PortalAxiosInstance.post("/api/prism/setup/start");
  return response.data;
};

export const createAdminUser = async (userData: AdminUserData): Promise<{ success: boolean; user?: any; message?: string }> => {
  const response = await PortalAxiosInstance.post("/api/prism/setup/admin-user", userData);
  return response.data;
};

export const getGuestToken = async (): Promise<{ token: string }> => {
  const response = await PortalAxiosInstance.post("/api/auth/guest");
  return response.data;
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