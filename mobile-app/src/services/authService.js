// mobile-app/src/services/authService.js - Authentication API service
import axios from 'axios';

// Replace with your machine's LAN IP for physical device testing
// const API_BASE_URL = 'http://localhost:5000/api'; 
// const API_BASE_URL = 'http://192.168.1.10:5000/api';
// const API_BASE_URL = 'https://busy-crabs-clap.loca.lt/api'; // Tunnel URL
const API_BASE_URL = 'https://busy-crabs-clap.loca.lt/api';

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
    const token = getAuthToken();
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
    if (error.response && error.response.status === 401) {
      // Clear auth token and redirect to login
      clearAuthToken();
      // You might want to navigate to login screen here
    }
    return Promise.reject(error);
  }
);

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const getAuthToken = () => {
  return authToken;
};

export const clearAuthToken = () => {
  authToken = null;
};

export const authService = {
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

  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
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

  // Attendance
  async clockIn(location = null, notes = null) {
    try {
      const data = {};
      if (location) data.location = location;
      if (notes) data.notes = notes;

      const response = await api.post('/attendance/clock-in', data);
      return response.data;
    } catch (error) {
      console.error('Clock in error:', error);
      throw error;
    }
  },

  async clockOut(location = null, notes = null) {
    try {
      const data = {};
      if (location) data.location = location;
      if (notes) data.notes = notes;

      const response = await api.post('/attendance/clock-out', data);
      return response.data;
    } catch (error) {
      console.error('Clock out error:', error);
      throw error;
    }
  },

  async getMyAttendance(params = {}) {
    try {
      const response = await api.get('/attendance/my', { params });
      return response.data;
    } catch (error) {
      console.error('Get attendance error:', error);
      throw error;
    }
  },

  async startBreak(breakType = 'lunch', notes = null) {
    try {
      const data = { breakType };
      if (notes) data.notes = notes;

      const response = await api.post('/attendance/break/start', data);
      return response.data;
    } catch (error) {
      console.error('Start break error:', error);
      throw error;
    }
  },

  async endBreak() {
    try {
      const response = await api.post('/attendance/break/end');
      return response.data;
    } catch (error) {
      console.error('End break error:', error);
      throw error;
    }
  },

  // Leaves
  async createLeaveRequest(leaveData) {
    try {
      const response = await api.post('/leaves', leaveData);
      return response.data;
    } catch (error) {
      console.error('Create leave request error:', error);
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

  async getLeaveBalance() {
    try {
      const response = await api.get('/leaves/balance');
      return response.data;
    } catch (error) {
      console.error('Get leave balance error:', error);
      throw error;
    }
  },

  async cancelLeave(leaveId) {
    try {
      const response = await api.put(`/leaves/${leaveId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Cancel leave error:', error);
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

  // Users
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
};

export default api;