import React, { createContext, useContext, useState, useCallback } from 'react';
import ApiService from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const authenticated = await ApiService.isAuthenticated();
      
      if (authenticated) {
        const currentUser = await ApiService.getCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      const result = await ApiService.login(email, password);
      
      if (result.token && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true, user: result.user };
      }
      
      return { success: false, error: 'Giriş başarısız' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Giriş yapılamadı' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      const result = await ApiService.register(userData);
      
      if (result.token && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
        return { success: true, user: result.user };
      }
      
      return { success: false, error: 'Kayıt başarısız' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message || 'Kayıt oluşturulamadı' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await ApiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Continue with logout even if API call fails
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    register,
    logout,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 