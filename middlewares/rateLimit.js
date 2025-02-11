const { setRateLimitKey, getRateLimitKey } = require("./redisProxy");

const RATE_LIMIT = 10; // Maximum requests allowed
const EXPIRY_TIME = 60; // Rate limit expiry in seconds (1 minute)

const rateLimitMiddleware = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const redisKey = `rateLimit:${userId}`;

        // 🔍 Check the current request count
        let requestCount = await getRateLimitKey(redisKey);
        requestCount = requestCount ? parseInt(requestCount) : 0;

        if (requestCount >= RATE_LIMIT) {
            return res.status(429).json({ message: "Too many requests. Try again later." });
        }

        // ✅ Increment the request count & set expiry
        await setRateLimitKey(redisKey, requestCount + 1, EXPIRY_TIME);

        next();
    } catch (error) {
        console.error("❌ Rate limiter error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports = rateLimitMiddleware;
