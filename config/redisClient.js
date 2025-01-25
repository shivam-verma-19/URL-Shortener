const redis = require("redis");
const redisClient = redis.createClient();

redisClient.on("error", (err) => console.error("Redis Error:", err));
redisClient.connect();
