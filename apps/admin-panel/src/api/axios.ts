import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('raddigo_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login only for session expiry,
// NOT for login failures (those should show an error toast in the component).
const LOGIN_ENDPOINTS = ['/auth/api/v1/admin-login', '/auth/api/v1/login'];

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url: string = err.config?.url ?? '';
    const isLoginEndpoint = LOGIN_ENDPOINTS.some((ep) => url.includes(ep));

    if (err.response?.status === 401 && !isLoginEndpoint) {
      // Session expired — clear credentials and redirect
      localStorage.removeItem('raddigo_admin_token');
      localStorage.removeItem('raddigo_admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
