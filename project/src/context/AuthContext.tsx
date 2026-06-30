import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiService } from '../lib/api';
import { User, Customer, AuthState } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    customer: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchUserData = useCallback(async () => {
    try {
      const token = apiService.getToken();
      if (!token) {
        setState({ user: null, customer: null, isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await apiService.getMe();

      if (response.data?.user) {
        setState({
          user: response.data.user as User,
          customer: response.data.customer as Customer | null,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({ user: null, customer: null, isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      apiService.setToken(null);
      setState({ user: null, customer: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = apiService.getToken();
    if (token) {
      await fetchUserData();
    }
  }, [fetchUserData]);

  useEffect(() => {
    const initAuth = async () => {
      const token = apiService.getToken();
      if (token) {
        await fetchUserData();
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, [fetchUserData]);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const response = await apiService.login(email, password);

      if (response.data?.user) {
        setState({
          user: response.data.user as User,
          customer: response.data.customer as Customer | null,
          isLoading: false,
          isAuthenticated: true,
        });
        return { error: null };
      }

      return { error: 'Login failed' };
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      return { error: err.message || 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiService.setToken(null);
      setState({ user: null, customer: null, isLoading: false, isAuthenticated: false });
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
