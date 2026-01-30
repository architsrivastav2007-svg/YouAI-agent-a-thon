import axios from 'axios';

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://backend.ronitrox.xyz',
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  // Simple auth: Add x-user-id header if available in localStorage
  if (typeof window !== 'undefined') {
    const userId = localStorage.getItem('user-id');
    if (userId) {
      config.headers['x-user-id'] = userId;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // No special 401 handling needed
    return Promise.reject(error);
  }
);

export default api;
