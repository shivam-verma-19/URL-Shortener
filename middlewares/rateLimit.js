const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");

// Configure Redis client
const redisClient = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

redisClient.on("error", (err) => console.error("Redis Error:", err));

// Configure rate limiter
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: 10, // 10 requests
    duration: 3600, // Per hour
});

// Middleware for rate limiting
const rateLimitMiddleware = async (req, res, next) => {
    try {
        const userId = req.user.id; // Assuming user is authenticated
        await rateLimiter.consume(userId);
        next();
    } catch {
        res.status(429).json({ message: "Too many requests. Try again later." });
    }
};

module.exports = rateLimitMiddleware;