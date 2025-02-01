const redis = require('ioredis');

const client = redis.createClient({
    url: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
});

client.on('connect', () => {
    console.log('✅ Connected to Redis');
});

client.on('error', (err) => {
    console.error('❌ Redis error:', err);
});

client.connect();

module.exports = client;
