import { AuthProvider, HttpError } from "react-admin";
import data from "./users.json";

export const getAuthToken = () => {
  const token = localStorage.getItem('access_token');
  console.log('getAuthToken called, token:', token ? 'exists' : 'missing');
  return token;
};

/**
 * This authProvider is only for test purposes. Don't use it in production.
 */
export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new HttpError("Unauthorized", 401, {
        message: "Invalid username or password",
      });
    }

    const user = await response.json();
    const { access_token } = user;
    localStorage.setItem("access_token", access_token);
    return Promise.resolve(user);
  },
  logout: () => {
    localStorage.removeItem("access_token");
    return Promise.resolve();
  },
  checkError: () => Promise.resolve(),
  checkAuth: () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      return Promise.reject();
    }
    return Promise.resolve();
  },
  getPermissions: () => {
    return Promise.resolve(undefined);
  },
  getIdentity: () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      return Promise.reject();
    }
    // TODO: get user from backend
    return Promise.resolve({
      id: 'user',
      fullName: 'User',
    });
  },
};

export default authProvider;
