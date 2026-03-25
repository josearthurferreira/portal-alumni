import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001', // Testes locais
  // baseURL: '/api', // No Debian / produção com proxy
});

// Interceptor do Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Alumni
export const getAlumni = (filters = {}) => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v != null && v !== ''),
  );
  return api.get('/alumni', { params: cleanFilters });
};

export const getFilters = () => api.get('/alumni/filters');

// Auth
export const register = (payload) => api.post('/auth/register', payload);
export const login = (payload) => api.post('/auth/login', payload);
export const forgotPassword = (payload) =>
  api.post('/auth/forgot-password', payload);
export const resetPassword = (payload) =>
  api.post('/auth/reset-password', payload);

// Me
export const getMe = () => api.get('/me');
export const getMyProfile = () => api.get('/me/profile');

// Perfil
export const upsertMyProfile = (formData) => api.put('/me/profile', formData);

export default api;
