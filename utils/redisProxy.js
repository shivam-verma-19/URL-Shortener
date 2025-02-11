const axios = require("axios");

const REDIS_PROXY_URL = "https://axptlo1c2i.execute-api.ap-south-1.amazonaws.com/prod";

/**
 * Set a key in Redis.
 */
async function setRedisKey(keyType, key, value) {
    try {
        const response = await axios.post(`${REDIS_PROXY_URL}/RedisHandler/set`, { keyType, key, value });
        return response.data;
    } catch (error) {
        console.error(`Error setting Redis ${keyType} key:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Get a key from Redis.
 */
async function getRedisKey(keyType, key) {
    try {
        const response = await axios.post(`${REDIS_PROXY_URL}/RedisHandler/get`, { keyType, key });
        return response.data.value;
    } catch (error) {
        console.error(`Error getting Redis ${keyType} key:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Destroy a key in Redis.
 */
async function destroyRedisKey(keyType, key) {
    try {
        const response = await axios.post(`${REDIS_PROXY_URL}/RedisHandler/destroy`, { keyType, key });
        return response.data;
    } catch (error) {
        console.error(`Error deleting Redis ${keyType} key:`, error.response?.data || error.message);
        return null;
    }
}

// Expose functions
module.exports = {
    setSessionKey: (key, value) => setRedisKey("session", key, value),
    getSessionKey: (key) => getRedisKey("session", key),
    destroySessionKey: (key) => destroyRedisKey("session", key),

    setShortKey: (key, value) => setRedisKey("short", key, value),
    getShortKey: (key) => getRedisKey("short", key),
    destroyShortKey: (key) => destroyRedisKey("short", key),

    setRateLimitKey: (key, value, ttl) => setRedisKey("rateLimit", key, value, ttl),
    getRateLimitKey: (key) => getRedisKey("rateLimit", key),
    destroyRateLimitKey: (key) => destroyRedisKey("rateLimit", key),
};
