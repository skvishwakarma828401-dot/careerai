import api from './api';

/**
 * Fetch unified career analytics overview
 */
export const fetchAnalyticsOverview = async () => {
  const response = await api.get('/analytics');
  return response.data;
};
