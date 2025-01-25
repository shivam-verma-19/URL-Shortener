const express = require("express");
const ShortUrl = require("./models/ShortUrl"); // Import the schema
const shortid = require("shortid");
const validator = require("validator");

const router = express.Router();

router.post("/api/shorten", rateLimitMiddleware, async (req, res) => {
    const { longUrl, customAlias, topic } = req.body;
    const userId = req.user.id; // Assuming user is authenticated

    // Validate longUrl
    if (!validator.isURL(longUrl)) {
        return res.status(400).json({ message: "Invalid URL format." });
    }

    // Normalize the URL
    const normalizedUrl = validator.normalizeUrl(longUrl);

    try {
        // Check if customAlias is already taken
        if (customAlias) {
            const existingAlias = await ShortUrl.findOne({ shortAlias: customAlias });
            if (existingAlias) {
                return res.status(400).json({ message: "Custom alias already in use." });
            }
        }

        // Generate a short alias
        const shortAlias = customAlias || shortid.generate();

        // Save to the database
        const newShortUrl = new ShortUrl({
            longUrl: normalizedUrl,
            shortAlias,
            topic,
            userId,
        });

        await newShortUrl.save();

        // Cache in Redis
        const shortUrlData = {
            longUrl: normalizedUrl,
            topic,
            createdAt: newShortUrl.createdAt,
        };

        await redisClient.set(`shortUrl:${shortAlias}`, JSON.stringify(shortUrlData));

        // Return the short URL
        const shortUrl = `${req.protocol}://${req.get("host")}/${shortAlias}`;
        res.status(201).json({
            shortUrl,
            createdAt: newShortUrl.createdAt,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;
