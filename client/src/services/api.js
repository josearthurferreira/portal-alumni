import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
    Object.entries(filters).filter(([_, v]) => v != null && v !== "")
  );
  return api.get('/alumni', { params: cleanFilters });
};

// Auth
export const register = (payload) => api.post('/auth/register', payload);
export const login = (payload) => api.post('/auth/login', payload);

// Me
export const getMe = () => api.get('/me');
export const getMyProfile = () => api.get('/me/profile');

// --- AQUI ESTÁ A CORREÇÃO ---
// Recebe o formData pronto do Modal e apenas envia.
// O Axios percebe que é FormData e configura o Content-Type sozinho.
export const upsertMyProfile = (formData) => api.put('/me/profile', formData);

export default api;
