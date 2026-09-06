const Redis = require('ioredis');
const RedisMock = require('ioredis-mock');
const logger = require('../utils/logger');

let redisClient = null;
let isUsingMock = false;

/**
 * Initialize Redis connection with fallback to in-memory mock
 */
const getRedisConnection = () => {
  if (redisClient) {
    return redisClient;
  }

  const redisHost = process.env.REDIS_HOST || '127.0.0.1';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  const redisUrl = process.env.REDIS_URL;

  try {
    if (process.env.USE_REDIS_MOCK === 'true') {
      logger.info('[Redis] Initializing in-memory Redis Mock instance...');
      redisClient = new RedisMock({ maxRetriesPerRequest: null });
      isUsingMock = true;
      return redisClient;
    }

    logger.info(`[Redis] Connecting to Redis at ${redisUrl || `${redisHost}:${redisPort}`}...`);

    redisClient = redisUrl
      ? new Redis(redisUrl, {
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy: () => null,
        })
      : new Redis({
          host: redisHost,
          port: redisPort,
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
          retryStrategy: () => null,
        });

    redisClient.on('connect', () => {
      logger.info('[Redis] Successfully connected to live Redis server.');
      isUsingMock = false;
    });

    redisClient.on('error', (err) => {
      logger.warn(`[Redis] Live connection notice: ${err.message}.`);
    });

    return redisClient;
  } catch (err) {
    logger.warn(`[Redis] Falling back to Redis Mock: ${err.message}`);
    redisClient = new RedisMock({ maxRetriesPerRequest: null });
    isUsingMock = true;
    return redisClient;
  }
};

/**
 * Get Redis connection options object for BullMQ
 */
const getRedisOptions = () => {
  const client = getRedisConnection();
  return { connection: client };
};

module.exports = {
  getRedisConnection,
  getRedisOptions,
  isUsingMock: () => isUsingMock,
};
