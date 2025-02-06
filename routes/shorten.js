const express = require("express");
const router = express.Router();
const authenticateUser = require("../middlewares/authenticateUser");
const rateLimitMiddleware = require("../middlewares/rateLimit");
const ShortUrl = require("../models/shortUrl"); // Import the schema
const { generateShortAlias } = require("../utils/generateShortAlias"); // Utility for generating aliases
const redisClient = require("../config/redisClient"); // Use ioredis client

// POST /api/shorten - Create a new short URL
router.post("/api/shorten", authenticateUser, rateLimitMiddleware, async (req, res) => {
    const { longUrl, customAlias, topic } = req.body;

    if (!longUrl) {
        return res.status(400).json({ message: "Long URL is required." });
    }

    try {
        // Validate and normalize the URL (optional, use a library like validator)
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

        // Cache the short URL in Redis for 1 hour
        await redisClient.set(shortAlias, normalizedUrl, 'EX', 3600);

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
        // Check Redis cache first
        const cachedUrl = await redisClient.get(alias);
        if (cachedUrl) {
            return res.redirect(cachedUrl);
        }

        // If not in cache, check the database
        const shortUrl = await ShortUrl.findOne({ shortAlias: alias });
        if (!shortUrl) {
            return res.status(404).json({ message: "Short URL not found." });
        }

        // Cache the URL in Redis for future requests
        await redisClient.set(alias, shortUrl.longUrl, 'EX', 3600);

        res.redirect(shortUrl.longUrl);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error." });
    }
});

module.exports = router;