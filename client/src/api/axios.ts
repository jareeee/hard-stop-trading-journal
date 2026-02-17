import axios from 'axios';

// Base URL configuration
const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token updates (if any) and errors
api.interceptors.response.use(
  (response) => {
    // If the server sends a new authorization token in the header, update it
    const authHeader = response.headers['authorization'];
    if (authHeader) {
      localStorage.setItem('token', authHeader);
    }
    return response;
  },
  (error) => {
    // Handle global errors, e.g., 401 Unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
