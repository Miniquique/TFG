import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 120000,
});

// Adjuntar token JWT automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Manejar errores globalmente
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ───────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// ── Users ──────────────────────────────────────────────────
export const usersAPI = {
  getAll: () => api.get('/users'),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.patch('/users/password', data),
};

// ── Foods ──────────────────────────────────────────────────
export const foodsAPI = {
  search: (params) => api.get('/foods', { params }),
  searchOpenFoodFacts: (search) => api.get('/foods/search-openfoodfacts', { params: { search } }),
  getById: (id) => api.get(`/foods/${id}`),
  create: (data) => api.post('/foods', data),
};

// ── Pantry ─────────────────────────────────────────────────
export const pantryAPI = {
  get: () => api.get('/pantry'),
  add: (data) => api.post('/pantry', data),
  update: (id, data) => api.put(`/pantry/${id}`, data),
  remove: (id) => api.delete(`/pantry/${id}`),
};

// ── Scanner ────────────────────────────────────────────────
export const scannerAPI = {
  scan: (imageBase64, mediaType) => api.post('/scanner/scan', { imageBase64, mediaType }),
  addToPantry: (items) => api.post('/scanner/add-to-pantry', { items }),
};

// ── Daily log ──────────────────────────────────────────────
export const dailyLogAPI = {
  get: (date) => api.get('/daily-log', { params: { date } }),
  getStats: (days) => api.get('/daily-log/stats', { params: { days } }),
  add: (data) => api.post('/daily-log', data),
  remove: (id) => api.delete(`/daily-log/${id}`),
};

// ── Menus ──────────────────────────────────────────────────
export const menusAPI = {
  getAll: () => api.get('/menus'),
  getById: (id) => api.get(`/menus/${id}`),
  generate: (data) => api.post('/menus/generate', data),
  getTemplates: () => api.get('/menus/templates'),
  selectTemplate: (templateId, days) => api.post('/menus/select-template', { templateId, days }),
  remove: (id) => api.delete(`/menus/${id}`),
};




export default api;
