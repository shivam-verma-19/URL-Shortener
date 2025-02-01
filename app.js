const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const shortenRoutes = require("./routes/shorten");

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());
app.use(shortenRoutes); // Register the routes

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Error handling middleware
app.use((err, res) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});