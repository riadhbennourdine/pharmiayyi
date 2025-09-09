import React, { useState, useCallback, createContext, useContext, useMemo } from 'react';
import { UserRole } from '../../types'; // Adjusted path for nesting

// --- AUTHENTICATION CONTEXT ---
interface AuthContextType {
  isAuthenticated: boolean;
  userRole: UserRole;
  login: (identifier: string, password: string) => void;
  logout: () => void;
  register: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.USER);

  const login = useCallback((identifier: string, password: string) => {
    if (identifier.toLowerCase() === 'admin' && password === 'admin') {
      setIsAuthenticated(true);
      setUserRole(UserRole.ADMIN);
    } else if (identifier && password) {
      setIsAuthenticated(true);
      setUserRole(UserRole.USER);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUserRole(UserRole.USER);
  }, []);

  const register = useCallback(() => {
    console.log("User registered (simulation)");
  }, []);

  const value = useMemo(() => ({ isAuthenticated, userRole, login, logout, register }), [isAuthenticated, userRole, login, logout, register]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
