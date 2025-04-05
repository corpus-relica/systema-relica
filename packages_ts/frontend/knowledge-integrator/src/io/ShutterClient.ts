import axios from "axios";

export const shutterClient = axios.create({
  baseURL: import.meta.env.VITE_SHUTTER_API_URL || "http://localhost:9999",
});

shutterClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
