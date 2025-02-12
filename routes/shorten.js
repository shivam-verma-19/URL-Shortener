const express = require("express");
const router = express.Router();
const authenticateUser = require("../middlewares/authenticateUser");
const rateLimitMiddleware = require("../middlewares/rateLimit");
const ShortUrl = require("../models/shortUrl"); // Import the schema
const { generateShortAlias } = require("../utils/generateShortAlias"); // Utility for generating aliases
const axios = require("axios");


const apiGatewayUrl = "https://axptlo1c2i.execute-api.ap-south-1.amazonaws.com/prod";

// Function to interact with API Gateway for Redis operations
async function setRedisKey(key, value, ttl = 3600) { // Default TTL = 1 hour
    try {
        await axios.post(`${apiGatewayUrl}/RedisHandler/set`, {
            keyType: "url",
            key,
            value,
            ttl,
        });
    } catch (error) {
        console.error("❌ Error setting Redis key:", error.message);
    }
}

async function getRedisKey(key) {
    try {
        const response = await axios.get(`${apiGatewayUrl}/RedisHandler/get`, {
            keyType: "url",
            key,
        });
        return response.data ? response.data.value : null;
    } catch (error) {
        console.error("❌ Error getting Redis key:", error.message);
        return null;
    }
}

// POST /api/shorten - Create a new short URL
router.post("/api/shorten", authenticateUser, rateLimitMiddleware, async (req, res) => {
    const { longUrl, customAlias, topic } = req.body;

    if (!longUrl) {
        return res.status(400).json({ message: "Long URL is required." });
    }

    try {
        // Validate and normalize the URL
        const normalizedUrl = new URL(longUrl).toString();

        // Generate a unique alias
        const shortAlias = customAlias || generateShortAlias();

        // Save to the database
        const shortUrl = new ShortUrl({
            longUrl: normalizedUrl,
            shortAlias,
            topic,
            userId: req.user.id, // Assuming `req.user` contains the authenticated user's ID
        });

        await shortUrl.save();

        // ✅ Cache the short URL in Redis via API Gateway
        await setRedisKey(shortAlias, normalizedUrl);

        res.status(201).json({
            shortUrl: `${req.protocol}://${req.get("host")}/${shortAlias}`,
            createdAt: shortUrl.createdAt,
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Custom alias already exists." });
        }
        console.error(err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// GET /:alias - Redirect to the original URL
router.get("/:alias", async (req, res) => {
    const { alias } = req.params;

    try {
        // ✅ Check Redis cache first via API Gateway
        const cachedUrl = await getRedisKey(alias);
        if (cachedUrl) {
            console.log("✅ Cache hit - Redirecting from Redis");
            return res.redirect(cachedUrl);
        }

        // If not in cache, check the database
        const shortUrl = await ShortUrl.findOne({ shortAlias: alias });
        if (!shortUrl) {
            return res.status(404).json({ message: "Short URL not found." });
        }

        // ✅ Cache the URL in Redis via API Gateway
        await setRedisKey(alias, shortUrl.longUrl);

        res.redirect(shortUrl.longUrl);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error." });
    }
});

module.exports = router;
