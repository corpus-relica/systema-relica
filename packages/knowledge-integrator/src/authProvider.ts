import { AuthProvider, HttpError } from "react-admin";
import { checkAuthenticationStatus } from "./PortalClient";

export const getAuthToken = () => {
  const token = localStorage.getItem('access_token');
  console.log(token)
  console.log('getAuthToken called, token:', token ? 'exists' : 'missing');
  return token;
};

/**
 * Enhanced authProvider with setup wizard integration
 */
export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const portalUrl = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:2204';
    const response = await fetch(`${portalUrl}/auth/login`, {
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

    const result = await response.json();

    const { token, user } = result;

    console.log("🔐 Login successful, token:", token, "user:", user);

    localStorage.setItem("access_token", token);
    localStorage.setItem("user", JSON.stringify(user));
    return Promise.resolve(result);
  },
  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    return Promise.resolve();
  },
  checkError: () => Promise.resolve(),
  checkAuth: async () => {
    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      return Promise.reject();
    }else{
      console.log("🔑 Auth check passed, access token exists");
      return Promise.resolve();
    }
    
    // try {
    //   const authStatus = await checkAuthenticationStatus();
    //   if (!authStatus.authenticated) {
    //     localStorage.removeItem("access_token");
    //     localStorage.removeItem("user");
    //     return Promise.reject();
    //   }
    //   return Promise.resolve();
    // } catch (error) {
    //   // If we can't verify, assume token is invalid
    //   localStorage.removeItem("access_token");
    //   localStorage.removeItem("user");
    //   return Promise.reject();
    // }
  },
  getPermissions: () => {
    return Promise.resolve(undefined);
  },
  getIdentity: () => {
    const accessToken = localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");
    
    if (!accessToken || !userStr) {
      return Promise.reject();
    }
    
    try {
      const user = JSON.parse(userStr);
      return Promise.resolve({
        id: user.id || user.username,
        fullName: user.fullName || user.username,
        avatar: user.avatar,
      });
    } catch (error) {
      return Promise.reject();
    }
  },
};

export default authProvider;
