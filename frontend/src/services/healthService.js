import api from './api';

/**
 * Fetch health status of backend and MongoDB database
 */
export const fetchHealthStatus = async () => {
  const response = await api.get('/health');
  return response.data;
};
