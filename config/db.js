const mongoose = require("mongoose");

const mongoUri = process.env.MONGO_URI; // Access the MongoDB URI from .env

mongoose.connect(mongoUri)
    .then(() => {
        console.log("MongoDB connected successfully");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });
