
import React, { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { authService } from '@/services/authService'; 
import { User, AuthContextType as IAuthContextType, UserRole } from '@/types'; 
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext<IAuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // For initial auth check
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserLoggedIn = () => {
      setIsLoadingAuth(true);
      try {
        const storedUser = authService.getCurrentUser();
        if (storedUser && storedUser.token) {
          setUser(storedUser);
          setToken(storedUser.token);
        }
      } catch (error) {
        console.error("Error reading user from storage:", error);
        // Clear potentially corrupted storage
        authService.logout(); 
      } finally {
        setIsLoadingAuth(false);
      }
    };
    checkUserLoggedIn();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoadingAuth(true);
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      setToken(userData.token || null);
    } catch (error) {
      // Let the LoginPage handle displaying the error
      throw error; 
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role?: UserRole) => {
    setIsLoadingAuth(true);
    try {
      const userData = await authService.register(name, email, password, role);
      setUser(userData);
      setToken(userData.token || null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
    // No need to setIsLoadingAuth here unless logout involves async operations
  }, []);

  // Place this useEffect after logout and navigate are defined
  useEffect(() => {
    const handler = (event: any) => {
      if (event?.detail?.forceLogout) {
        logout();
        navigate('/login', { state: { message: event.detail.message || 'Session expired. Please log in again.' } });
      }
    };
    window.addEventListener('forceLogout', handler);
    return () => window.removeEventListener('forceLogout', handler);
  }, [logout, navigate]);

  const value = {
    user,
    token,
    isLoadingAuth,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): IAuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
