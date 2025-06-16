import { makeAutoObservable, runInAction } from "mobx";

interface User {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  avatar?: string;
}

class AuthStore {
  isAuthenticated = false;
  user: User | null = null;
  token: string | null = null;
  isLoading = false;
  error = '';

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        runInAction(() => {
          this.token = token;
          this.user = user;
          this.isAuthenticated = true;
        });
      } catch (error) {
        console.error('Failed to parse user from storage:', error);
        this.clearAuth();
      }
    }
  }

  setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  setError(error: string) {
    this.error = error;
  }

  clearError() {
    this.error = '';
  }

  setAuthenticated(authenticated: boolean, user?: User, token?: string) {
    runInAction(() => {
      this.isAuthenticated = authenticated;
      if (user) this.user = user;
      if (token) this.token = token;
      
      if (authenticated && user && token) {
        localStorage.setItem('access_token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    });
  }

  clearAuth() {
    runInAction(() => {
      this.isAuthenticated = false;
      this.user = null;
      this.token = null;
      this.error = '';
    });
    
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  logout() {
    this.clearAuth();
  }

  get hasValidAuth() {
    return this.isAuthenticated && this.user && this.token;
  }

  get userDisplayName() {
    return this.user?.fullName || this.user?.username || 'Unknown User';
  }
}

export default AuthStore;