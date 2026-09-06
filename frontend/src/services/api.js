import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  withCredentials: true, // Send HTTP-only cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for unified error handling
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred.',
      status: error.response?.status || 500,
      details: error.response?.data || null,
    };
    return Promise.reject(customError);
  }
);

export default api;
