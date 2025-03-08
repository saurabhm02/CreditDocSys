const redis = require('redis');
const logger = require('../utils/logger');

const createMockRedisClient = () => {
  logger.warn('Using mock Redis client');
  return {
    get: (key, callback) => callback(null, null),
    set: (key, value, callback) => callback(null, 'OK'),
    del: (key, callback) => callback(null, 1),
    expire: (key, seconds, callback) => callback(null, 1),
    quit: (callback) => callback && callback(null, 'OK')
  };
};

const initRedis = () => {
  try {
    logger.info('Initializing Redis client...');
    
    const redisUrl = process.env.REDIS_URL;
    
    const client = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnect failed too many times, giving up');
            return new Error('Redis reconnect failed too many times');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });
        client.on('error', (err) => {
      logger.error(`Redis Error: ${err.message}`);
    });
    
    client.on('connect', () => {
      logger.info('Connected to Redis');
    });
    
    client.on('ready', () => {
      logger.info('Redis client ready');
    });
    
    client.on('end', () => {
      logger.info('Redis connection ended');
    });
    
    client.connect().catch(err => {
      logger.error(`Redis connection error: ${err.message}`);
    });

    return {
      client,
      getAsync: async (key) => {
        try {
          return await client.get(key);
        } catch (error) {
          logger.error(`Redis get error: ${error.message}`);
          return null;
        }
      },
      setAsync: async (key, value) => {
        try {
          return await client.set(key, value);
        } catch (error) {
          logger.error(`Redis set error: ${error.message}`);
          return null;
        }
      },
      delAsync: async (key) => {
        try {
          return await client.del(key);
        } catch (error) {
          logger.error(`Redis del error: ${error.message}`);
          return 0;
        }
      },
      expireAsync: async (key, seconds) => {
        try {
          return await client.expire(key, seconds);
        } catch (error) {
          logger.error(`Redis expire error: ${error.message}`);
          return 0;
        }
      }
    };
  } catch (error) {
    logger.error(`Redis initialization error: ${error.message}`);
    logger.warn('Falling back to mock Redis client');
    
    // Return a mock Redis client
    const mockClient = createMockRedisClient();
    return {
      client: mockClient,
      getAsync: async (key) => null,
      setAsync: async (key, value) => 'OK',
      delAsync: async (key) => 1,
      expireAsync: async (key, seconds) => 1
    };
  }
};

let redisInstance;
try {
  redisInstance = initRedis();
  logger.info('Redis client initialized successfully');
} catch (error) {
  logger.error(`Failed to initialize Redis: ${error.message}`);
  logger.warn('Using mock Redis client as fallback');
  redisInstance = {
    client: createMockRedisClient(),
    getAsync: async (key) => null,
    setAsync: async (key, value) => 'OK',
    delAsync: async (key) => 1,
    expireAsync: async (key, seconds) => 1
  };
}

module.exports = redisInstance; 