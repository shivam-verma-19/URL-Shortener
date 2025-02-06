const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
    shortAlias: {
        type: String,
        required: true,
        unique: true,
    },
    totalClicks: {
        type: Number,
        default: 0,
    },
    uniqueUsers: {
        type: Number,
        default: 0,
    },
    clicksByDate: [
        {
            date: {
                type: Date,
                required: true,
            },
            count: {
                type: Number,
                required: true,
            },
        },
    ],
    osType: [
        {
            osName: {
                type: String,
                required: true,
            },
            uniqueClicks: {
                type: Number,
                required: true,
            },
            uniqueUsers: {
                type: Number,
                required: true,
            },
        },
    ],
    deviceType: [
        {
            deviceName: {
                type: String,
                required: true,
            },
            uniqueClicks: {
                type: Number,
                required: true,
            },
            uniqueUsers: {
                type: Number,
                required: true,
            },
        },
    ],
});

module.exports = mongoose.model("Analytics", analyticsSchema);