const { RateLimiterRedis } = require("rate-limiter-flexible");
const redis = require("redis");

// Configure Redis client
const redisClient = redis.createClient();
redisClient.on("error", (err) => console.error("Redis Error:", err));
redisClient.connect();

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
