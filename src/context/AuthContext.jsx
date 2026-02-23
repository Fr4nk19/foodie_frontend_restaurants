import { createContext, useContext, useState, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout } from '../api/auth';
import { getToken, setToken, removeToken, getUser, setUser, removeUser } from '../utils/token';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken);
  const [user, setUserState] = useState(getUser);

  const isAuthenticated = Boolean(token);

  const signIn = useCallback(async ({ email, password }) => {
    const res = await apiLogin({ email, password });
    const { token: newToken, user: newUser } = res.data;
    setToken(newToken);
    setUser(newUser);
    setTokenState(newToken);
    setUserState(newUser);
    // Inject token immediately for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    return newUser;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // ignore errors on logout
    } finally {
      removeToken();
      removeUser();
      setTokenState(null);
      setUserState(null);
    }
  }, []);

  // Role helpers
  const isAdmin = user?.role === 'company_admin' || user?.role === 'branch_manager';
  const isKitchen = user?.role === 'employee' && user?.job_type === 'kitchen';
  const isWaiter = user?.role === 'employee' && user?.job_type === 'waiter';
  // If no job_type set, treat all employees as able to see both kitchen and waiter
  const isEmployee = user?.role === 'employee';

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, signIn, signOut, isAdmin, isKitchen, isWaiter, isEmployee }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
