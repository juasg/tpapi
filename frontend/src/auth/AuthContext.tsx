import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  loginWithCredentials,
  logout as oauthLogout,
  isAuthenticated,
  getCustomerInfo,
  type CustomerInfo,
} from './oauth';

interface AuthContextValue {
  customer:      CustomerInfo | null;
  authenticated: boolean;
  login:         (clientId: string, clientSecret: string) => Promise<void>;
  logout:        () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      setCustomer(getCustomerInfo());
    }
  }, []);

  const login = useCallback(async (clientId: string, clientSecret: string) => {
    const info = await loginWithCredentials(clientId, clientSecret);
    setCustomer(info);
  }, []);

  const logout = useCallback(() => {
    setCustomer(null);
    oauthLogout();
  }, []);

  return (
    <AuthContext.Provider value={{ customer, authenticated: !!customer, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
