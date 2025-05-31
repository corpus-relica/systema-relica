// Mock AuthContext for testing
export const useAuth = jest.fn(() => ({
  user: {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com'
  },
  isAuthenticated: true,
  isAdmin: true,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false,
  error: null
}));

export const AuthProvider = ({ children }: { children: React.ReactNode }) => children;

export default {
  useAuth,
  AuthProvider
};