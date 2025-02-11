const axios = require("axios");

const REDIS_PROXY_URL = "https://axptlo1c2i.execute-api.ap-south-1.amazonaws.com/prod";
const RATE_LIMIT = 10; // Maximum requests allowed
const EXPIRY_TIME = 60; // Rate limit expiry in seconds (1 minute)

const rateLimitMiddleware = async (req, res, next) => {
    try {
        const userId = req.user.id; // Assuming user is authenticated
        const redisKey = `rateLimit:${userId}`;

        // 🔍 Check the current request count from Redis
        const response = await axios.post(`${REDIS_PROXY_URL}/get`, {
            keyType: "rateLimit",
            key: redisKey,
        });

        let requestCount = response.data?.value ? parseInt(response.data.value) : 0;

        if (requestCount >= RATE_LIMIT) {
            return res.status(429).json({ message: "Too many requests. Try again later." });
        }

        // ✅ Increment the request count & set expiry (TTL = 1 min)
        await axios.post(`${REDIS_PROXY_URL}/set`, {
            keyType: "rateLimit",
            key: redisKey,
            value: requestCount + 1,
            ttl: EXPIRY_TIME, // Ensures the counter resets after 1 min
        });

        next();
    } catch (error) {
        console.error("❌ Rate limiter error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = rateLimitMiddleware;