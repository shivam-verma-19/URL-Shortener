const express = require("express");
const router = express.Router();
const authenticateUser = require("../middlewares/authenticateUser");
const rateLimitMiddleware = require("../middlewares/rateLimit");
const ShortUrl = require("../models/shortUrl"); // Import the schema
const { generateShortAlias } = require("../utils/generateShortAlias"); // Utility for generating aliases
const { setRedisKey } = require("../utils/redisProxy");

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

        await setRedisKey(shortAlias, normalizedUrl);
        // Cache for 1 hour

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

module.exports = router;
