import axios from 'axios';

// Get API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject({
      message: error.response?.data?.error || error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// User API functions
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

// Product API functions
export const productAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/products/categories'),
};

// General API functions
export const generalAPI = {
  testConnection: () => api.get('/db-test'),
  healthCheck: () => axios.get(`${API_BASE_URL}/health`),
};

export default api;