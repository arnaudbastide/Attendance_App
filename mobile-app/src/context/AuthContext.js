// mobile-app/src/context/AuthContext.js - Authentication context
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('authToken');
      const storedUser = await SecureStore.getItemAsync('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Set default authorization header
        authService.setAuthToken(storedToken);

        // Fetch fresh profile data
        try {
          const response = await authService.getProfile();
          if (response.success) {
            setUser(response.user);
            await SecureStore.setItemAsync('user', JSON.stringify(response.user));
          } else {
            // Fallback to stored user if fetch fails
            setUser(JSON.parse(storedUser));
          }
        } catch (error) {
          console.log('Failed to refresh profile, using stored data');
          setUser(JSON.parse(storedUser));
        }
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      if (response.success) {
        const { token, user } = response;

        // Store in secure storage
        await SecureStore.setItemAsync('authToken', token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));

        // Update state
        setToken(token);
        setUser(user);
        authService.setAuthToken(token);

        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      // Clear secure storage
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('user');

      // Clear state
      setToken(null);
      setUser(null);
      authService.setAuthToken(null);

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);

      if (response.success) {
        // Update user in storage
        const updatedUser = { ...user, ...response.user };
        await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
        setUser(updatedUser);

        return { success: true, user: updatedUser };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: 'Profile update failed' };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};