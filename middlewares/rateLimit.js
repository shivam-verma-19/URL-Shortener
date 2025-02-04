const axios = require("axios");

const REDIS_PROXY_URL = "https://nehehy80pg.execute-api.ap-south-1.amazonaws.com/prod"; // Replace with your API Gateway URL

const rateLimitMiddleware = async (req, res, next) => {
    try {
        const userId = req.user.id; // Assuming user is authenticated

        // Get the current request count from Redis
        const response = await axios.post(REDIS_PROXY_URL, { key: `rateLimit:${userId}` });
        let requestCount = response.data?.value ? parseInt(response.data.value) : 0;

        if (requestCount >= 10) {
            return res.status(429).json({ message: "Too many requests. Try again later." });
        }

        // Increment the request count and set expiry
        await axios.post(REDIS_PROXY_URL, { key: `rateLimit:${userId}`, value: requestCount + 1 });

        next();
    } catch (error) {
        console.error("Rate limiter error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = rateLimitMiddleware;
