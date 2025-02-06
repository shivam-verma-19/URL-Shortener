const axios = require("axios");

const REDIS_PROXY_URL = process.env.REDIS_PROXY_URL; // Ensure this is set correctly in your environment variables;

async function setRedisKey(key, value) {
    try {
        const response = await axios.post(REDIS_PROXY_URL, { key, value });
        console.log(response.data);
    } catch (error) {
        console.error("Error setting Redis key:", error.response?.data || error.message);
    }
}

async function getRedisKey(key) {
    try {
        const response = await axios.post(REDIS_PROXY_URL, { key });
        console.log(response.data);
    } catch (error) {
        console.error("Error getting Redis key:", error.response?.data || error.message);
    }
}

module.exports = { setRedisKey, getRedisKey };
