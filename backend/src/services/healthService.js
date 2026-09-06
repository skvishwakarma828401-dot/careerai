const os = require('os');
const { getDBStatus } = require('../config/db');

/**
 * Service to aggregate system and database health status
 */
const getSystemHealth = () => {
  const dbStatus = getDBStatus();
  const uptimeSeconds = process.uptime();

  return {
    status: dbStatus.statusCode === 1 ? 'healthy' : 'degraded',
    service: 'CareerAI API Platform',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptimeSeconds),
      formatted: formatUptime(uptimeSeconds),
    },
    database: {
      provider: 'MongoDB',
      ...dbStatus,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        totalMB: Math.round(os.totalmem() / 1024 / 1024),
        freeMB: Math.round(os.freemem() / 1024 / 1024),
        processUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
    },
  };
};

const formatUptime = (seconds) => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d > 0 ? `${d}d ` : ''}${h > 0 ? `${h}h ` : ''}${m > 0 ? `${m}m ` : ''}${s}s`;
};

module.exports = {
  getSystemHealth,
};
