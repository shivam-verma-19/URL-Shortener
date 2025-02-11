const axios = require("axios");

const REDIS_PROXY_URL = process.env.REDIS_PROXY_URL;

async function setRedisKey(key, value) {
    try {
        const response = await axios.post(`${REDIS_PROXY_URL}/RedisHandler/set`, { key, value });
        console.log(response.data);
    } catch (error) {
        console.error("Error setting Redis key:", error.response?.data || error.message);
    }
}

async function getRedisKey(key) {
    try {
        const response = await axios.get(`${REDIS_PROXY_URL}/RedisHandler/get`, { params: { key } });
        console.log(response.data);
        return response.data.value; // Ensure value is returned for further use
    } catch (error) {
        console.error("Error getting Redis key:", error.response?.data || error.message);
        return null; // Return null to avoid breaking the app
    }
}

module.exports = { setRedisKey, getRedisKey };
