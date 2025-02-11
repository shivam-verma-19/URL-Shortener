const axios = require("axios");

const REDIS_HANDLER_URL = "https://axptlo1c2i.execute-api.ap-south-1.amazonaws.com/prod";

/**
 * Set a key in Redis.
 * @param {string} keyType - The type of key ("session" or "short").
 * @param {string} key - The Redis key.
 * @param {string} value - The value to store.
 */
async function setRedisKey(keyType, key, value) {
    try {
        const response = await axios.post(`${REDIS_HANDLER_URL}/set`, { keyType, key, value });
        return response.data;
    } catch (error) {
        console.error(`Error setting Redis ${keyType} key:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Get a key from Redis.
 * @param {string} keyType - The type of key ("session" or "short").
 * @param {string} key - The Redis key.
 */
async function getRedisKey(keyType, key) {
    try {
        const response = await axios.post(`${REDIS_HANDLER_URL}/get`, { keyType, key });
        return response.data.value;
    } catch (error) {
        console.error(`Error getting Redis ${keyType} key:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Destroy a key in Redis.
 * @param {string} keyType - The type of key ("session" or "short").
 * @param {string} key - The Redis key.
 */
async function destroyRedisKey(keyType, key) {
    try {
        const response = await axios.post(`${REDIS_HANDLER_URL}/destroy`, { keyType, key });
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
};
