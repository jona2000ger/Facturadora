import { useState, useEffect, createContext, useContext } from 'react';
import authService from '../models/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const profile = await authService.getProfile();
        setUser(profile.user);
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const verifyOTP = async (userId, otp) => {
    try {
      const response = await authService.verifyOTP(userId, otp);
      setUser(response.user);
      localStorage.setItem('authToken', 'authenticated'); // Simplificado para este ejemplo
      return response;
    } catch (error) {
      throw error;
    }
  };

  const resendOTP = async (userId) => {
    try {
      const response = await authService.resendOTP(userId);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const value = {
    user,
    isLoading,
    login,
    verifyOTP,
    resendOTP,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 