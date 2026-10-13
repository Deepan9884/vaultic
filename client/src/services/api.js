import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

function storedToken() {
  return localStorage.getItem('vaultic_token') || sessionStorage.getItem('vaultic_token');
}

api.interceptors.request.use((config) => {
  const token = storedToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Expired/revoked token anywhere -> drop session, bounce to login once.
let bouncing = false;
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !bouncing && !err.config?.url?.includes('/auth/')) {
      bouncing = true;
      localStorage.removeItem('vaultic_token');
      sessionStorage.removeItem('vaultic_token');
      delete axios.defaults.headers.common.Authorization;
      if (!window.location.pathname.startsWith('/login')) window.location.assign('/login');
      setTimeout(() => { bouncing = false; }, 3000);
    }
    return Promise.reject(err);
  }
);

export default api;
