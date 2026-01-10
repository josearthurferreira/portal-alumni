import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
});

// Toda request manda o token (se existir)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Alumni (público)
export const getAlumni = (filters = {}) => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v != null && v !== "")
  );
  return api.get('/alumni', { params: cleanFilters });
};

// Auth
export const register = (payload) => api.post('/auth/register', payload);
export const login = (payload) => api.post('/auth/login', payload);

// Me
export const getMe = () => api.get('/me');
export const upsertMyProfile = (payload) => api.put('/me/profile', payload);
export const getMyProfile = () => api.get('/me/profile');

export default api;
