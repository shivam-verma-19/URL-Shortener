const Redis = require("ioredis");

const redis = new Redis({
    host: "demo-db5usa.serverless.aps1.cache.amazonaws.com",
    port: 6379,
    tls: {}  // Enable TLS for AWS ElastiCache Redis
});

redis.ping()
    .then(() => console.log("Connected to Redis"))
    .catch(err => console.error("Redis connection failed", err));
