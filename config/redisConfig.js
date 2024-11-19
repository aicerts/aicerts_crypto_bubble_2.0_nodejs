const redis = require("redis");
const config = require("./config");

const client = redis.createClient({
  // Use the default Redis URL (localhost:6379) for local Redis server
  url: config.redis.url || 'redis://localhost:6378'  // Fallback to local Redis if not configured in config
});

client.on('error', (err) => {
  console.error("Error while connecting to Redis server", err);
});

client.connect();

module.exports = client;
