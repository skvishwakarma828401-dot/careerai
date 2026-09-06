import api from './api';

/**
 * Register a new user
 * @param {Object} userData - name, email, password, role, targetRole, experienceLevel
 */
export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response;
};

/**
 * Login user
 * @param {Object} credentials - email, password
 */
export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response;
};

/**
 * Logout user
 */
export const logoutUser = async () => {
  const response = await api.post('/auth/logout');
  return response;
};

/**
 * Get current authenticated user profile
 */
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response;
};
