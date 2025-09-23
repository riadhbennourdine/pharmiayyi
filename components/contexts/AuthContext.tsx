import React, { useState, useCallback, createContext, useContext, useMemo, useEffect } from 'react';
import { UserRole, User } from '../../types'; // Adjusted path for nesting

// --- AUTHENTICATION CONTEXT ---
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, username: string, password: string, role: UserRole, pharmacistId?: string, firstName?: string, lastName?: string, city?: string) => Promise<boolean>;
  refreshUser: () => void; // Add refreshUser function
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => { 
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  // On mount, check for existing token in localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setIsAuthenticated(true);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user data", e);
        logout(); // Clear invalid data
      }
    }
  }, [logout]);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) return;

    try {
        const parsedUser: User = JSON.parse(storedUser);
        const response = await fetch(`/api/users/${parsedUser._id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            const updatedUser = await response.json();
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
        } else {
            logout();
        }
    } catch (error) {
        console.error("Failed to refresh user:", error);
        logout();
    }
  }, [logout]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsAuthenticated(true);
        setUser(data.user);
        return true;
      } else {
        console.error('Login failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Network error during login:', error);
      return false;
    }
  }, []);

  const register = useCallback(async (email: string, username: string, password: string, role: UserRole, pharmacistId?: string, firstName?: string, lastName?: string, city?: string): Promise<boolean> => {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password, role, pharmacistId, firstName, lastName, city }),
    });

    const data = await response.json();

    if (response.ok) {
        console.log('Registration successful:', data.message);
        return true;
    } else {
        // Throw an error with the message from the backend
        throw new Error(data.message || 'L\'inscription a échoué.');
    }
}, []);

  const value = useMemo(() => ({ isAuthenticated, user, login, logout, register, refreshUser }), [isAuthenticated, user, login, logout, register, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};