const axios = require("axios");

const REDIS_PROXY_URL = "https://nehehy80pg.execute-api.ap-south-1.amazonaws.com/prod"; // Replace with your API Gateway URL

async function setRedisKey(key, value) {
    try {
        await axios.post(REDIS_PROXY_URL, { key, value });
    } catch (error) {
        console.error("Error setting Redis key:", error.response?.data || error.message);
    }
}

async function getRedisKey(key) {
    try {
        const response = await axios.post(REDIS_PROXY_URL, { key });
        return response.data.value;
    } catch (error) {
        console.error("Error getting Redis key:", error.response?.data || error.message);
        return null;
    }
}

module.exports = { setRedisKey, getRedisKey };
