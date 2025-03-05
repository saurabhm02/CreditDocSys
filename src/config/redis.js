const redis = require('redis');
const { promisify } = require('util');

const client = redis.createClient(process.env.REDIS_URL || 'redis://localhost:6379');

client.on('error', (err) => {
  console.error('Redis Error:', err);
});

client.on('connect', () => {
  console.log('Connected to Redis');
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync = promisify(client.del).bind(client);
const expireAsync = promisify(client.expire).bind(client);

module.exports = {
  client,
  getAsync,
  setAsync,
  delAsync,
  expireAsync
}; 