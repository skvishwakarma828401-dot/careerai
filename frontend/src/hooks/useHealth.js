import { useState, useEffect, useCallback } from 'react';
import { fetchHealthStatus } from '../services/healthService';

export const useHealth = (pollInterval = 30000) => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchHealthStatus();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to reach API server');
      setHealth({
        status: 'offline',
        service: 'CareerAI API Platform',
        database: { state: 'disconnected' },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();

    if (pollInterval > 0) {
      const interval = setInterval(checkHealth, pollInterval);
      return () => clearInterval(interval);
    }
  }, [checkHealth, pollInterval]);

  return { health, loading, error, refetch: checkHealth };
};
