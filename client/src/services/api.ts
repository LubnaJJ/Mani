import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach admin credentials when present
api.interceptors.request.use((config) => {
  const credentials = localStorage.getItem('admin_credentials');
  if (credentials) {
    config.headers.Authorization = `Basic ${credentials}`;
  }
  return config;
});

export default api;
