const express = require("express");
const { param, validationResult } = require("express-validator");
const router = express.Router();
const authenticateUser = require("../middlewares/authenticateUser");
const ShortUrl = require("../models/shortUrl");
const Analytics = require("../models/analytics");

// GET /api/analytics/:alias - Get URL analytics
router.get("/api/analytics/:alias", authenticateUser, [
    param('alias').isAlphanumeric().withMessage('Alias must be alphanumeric')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { alias } = req.params;

    try {
        const analytics = await Analytics.findOne({ shortAlias: alias });
        if (!analytics) {
            return res.status(404).json({ message: "Analytics not found." });
        }

        res.json(analytics);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// GET /api/analytics/topic/:topic - Get topic-based analytics
router.get("/api/analytics/topic/:topic", authenticateUser, [
    param('topic').isAlphanumeric().withMessage('Topic must be alphanumeric')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { topic } = req.params;

    try {
        const urls = await ShortUrl.find({ topic, userId: req.user.id });
        if (!urls.length) {
            return res.status(404).json({ message: "No URLs found for this topic." });
        }

        const analytics = await Analytics.find({ shortAlias: { $in: urls.map(url => url.shortAlias) } });

        res.json({
            totalClicks: analytics.reduce((acc, a) => acc + a.totalClicks, 0),
            uniqueUsers: analytics.reduce((acc, a) => acc + a.uniqueUsers, 0),
            clicksByDate: analytics.flatMap(a => a.clicksByDate),
            urls: urls.map(url => ({
                shortUrl: `${req.protocol}://${req.get("host")}/${url.shortAlias}`,
                totalClicks: analytics.find(a => a.shortAlias === url.shortAlias)?.totalClicks || 0,
                uniqueUsers: analytics.find(a => a.shortAlias === url.shortAlias)?.uniqueUsers || 0,
            })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// GET /api/analytics/overall - Get overall analytics
router.get("/api/analytics/overall", authenticateUser, async (req, res) => {
    try {
        const urls = await ShortUrl.find({ userId: req.user.id });
        if (!urls.length) {
            return res.status(404).json({ message: "No URLs found for this user." });
        }

        const analytics = await Analytics.find({ shortAlias: { $in: urls.map(url => url.shortAlias) } });

        res.json({
            totalUrls: urls.length,
            totalClicks: analytics.reduce((acc, a) => acc + a.totalClicks, 0),
            uniqueUsers: analytics.reduce((acc, a) => acc + a.uniqueUsers, 0),
            clicksByDate: analytics.flatMap(a => a.clicksByDate),
            osType: analytics.flatMap(a => a.osType),
            deviceType: analytics.flatMap(a => a.deviceType),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error." });
    }
});

module.exports = router;