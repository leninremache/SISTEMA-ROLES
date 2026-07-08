import axios from 'axios';

const API = axios.create({
  baseURL: 'https://web-production-65963.up.railway.app',
});

// Attach token if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
