const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_HOST,  // Ensure your .env file contains the correct Redis URL
});

client.on('connect', () => {
    console.log('✅ Connected to Redis');
});

client.on('error', (err) => {
    console.error('❌ Redis error:', err);
});

client.connect();  // Important: Connect to Redis before using it

module.exports = client;
