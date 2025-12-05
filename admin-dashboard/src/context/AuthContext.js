// admin-dashboard/src/context/AuthContext.js - Authentication context
import React, { createContext, useContext, useState, useEffect } from 'react';
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
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        authService.setAuthToken(storedToken);
        
        // Verify token is still valid
        try {
          await authService.getProfile();
        } catch (error) {
          // Token is invalid, clear it
          logout();
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
        
        // Store in localStorage
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
        
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
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
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

  const updateUserProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      
      if (response.success) {
        // Update user in storage
        const updatedUser = { ...user, ...response.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
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

  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    return Array.isArray(roles) ? roles.includes(user.role) : user.role === roles;
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    const permissions = {
      admin: ['view_all', 'manage_users', 'manage_attendance', 'manage_leaves', 'view_reports', 'manage_settings'],
      manager: ['view_team', 'manage_team_attendance', 'approve_leaves', 'view_team_reports'],
      employee: ['view_own', 'manage_own_attendance', 'request_leaves']
    };
    
    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes(permission);
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    logout,
    updateUserProfile,
    hasRole,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};