import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
};

export const adminAPI = {
  doctors: {
    list: () => api.get('/admin/doctors'),
    create: (data) => api.post('/admin/doctors', data),
    update: (id, data) => api.put(`/admin/doctors/${id}`, data),
    delete: (id) => api.delete(`/admin/doctors/${id}`),
  },
};

export default api;
