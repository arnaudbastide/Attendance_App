// admin-dashboard/src/services/authService.js - Authentication API service
import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const authService = {
  // Set auth token
  setAuthToken(token) {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  },

  // Authentication
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async getProfile() {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put('/auth/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // User Management
  async getUsers(params = {}) {
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  },

  async getUserById(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  },

  async updateUser(userId, userData) {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },

  async deactivateUser(userId) {
    try {
      const response = await api.put(`/users/${userId}/deactivate`);
      return response.data;
    } catch (error) {
      console.error('Deactivate user error:', error);
      throw error;
    }
  },

  async getDepartments() {
    try {
      const response = await api.get('/users/departments');
      return response.data;
    } catch (error) {
      console.error('Get departments error:', error);
      throw error;
    }
  },

  async getManagers() {
    try {
      const response = await api.get('/users/managers');
      return response.data;
    } catch (error) {
      console.error('Get managers error:', error);
      throw error;
    }
  },

  // Attendance Management
  async getMyAttendance(params = {}) {
    try {
      const response = await api.get('/attendance/my', { params });
      return response.data;
    } catch (error) {
      console.error('Get my attendance error:', error);
      throw error;
    }
  },

  async getTeamAttendance(params = {}) {
    try {
      const response = await api.get('/attendance/team', { params });
      return response.data;
    } catch (error) {
      console.error('Get team attendance error:', error);
      throw error;
    }
  },

  // Leave Management
  async getPendingLeaves(params = {}) {
    try {
      const response = await api.get('/leaves/pending', { params });
      return response.data;
    } catch (error) {
      console.error('Get pending leaves error:', error);
      throw error;
    }
  },

  async getMyLeaves(params = {}) {
    try {
      const response = await api.get('/leaves/my', { params });
      return response.data;
    } catch (error) {
      console.error('Get my leaves error:', error);
      throw error;
    }
  },

  async approveLeave(leaveId, status, comments = '') {
    try {
      const response = await api.put(`/leaves/${leaveId}/approve`, {
        status,
        comments
      });
      return response.data;
    } catch (error) {
      console.error('Approve leave error:', error);
      throw error;
    }
  },

  // Reports
  async getDashboardStats() {
    try {
      const response = await api.get('/reports/dashboard');
      return response.data;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  },

  async getAttendanceReport(params = {}) {
    try {
      const response = await api.get('/reports/attendance', { params });
      return response.data;
    } catch (error) {
      console.error('Get attendance report error:', error);
      throw error;
    }
  },

  async getLeaveReport(params = {}) {
    try {
      const response = await api.get('/reports/leaves', { params });
      return response.data;
    } catch (error) {
      console.error('Get leave report error:', error);
      throw error;
    }
  },

  // Export Reports
  async exportAttendanceReport(params = {}) {
    try {
      const response = await api.get('/reports/attendance', {
        params,
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Export attendance report error:', error);
      throw error;
    }
  },

  async exportLeaveReport(params = {}) {
    try {
      const response = await api.get('/reports/leaves', {
        params,
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      console.error('Export leave report error:', error);
      throw error;
    }
  }
};

export default api;