const mongoose = require("mongoose");

const shortUrlSchema = new mongoose.Schema({
    longUrl: { type: String, required: true },
    shortAlias: { type: String, unique: true, required: true },
    topic: { type: String },
    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ShortUrl", shortUrlSchema);
