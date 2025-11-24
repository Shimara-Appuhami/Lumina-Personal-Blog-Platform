import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL,
  withCredentials: false
});

apiClient.interceptors.request.use((config) => {
  const stored = localStorage.getItem('pbp_auth');
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      localStorage.removeItem('pbp_auth');
    }
  }
  return config;
});

export default apiClient;
