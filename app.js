const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const shortenRoutes = require("./routes/shorten");
const { setRedisKey, getRedisKey } = require("./config/redisClient"); // Use API Gateway for Redis

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());

// ✅ Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Test Redis Connection via API Gateway
(async () => {
    try {
        await setRedisKey("connection-test", "OK");
        console.log("✅ Redis connection via API Gateway successful");
    } catch (error) {
        console.error("❌ Redis connection error:", error.message);
    }
})();

// ✅ Configure Google OAuth Authentication
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        (accessToken, refreshToken, profile, done) => {
            console.log("✅ Google OAuth Connected:", profile.displayName);
            return done(null, profile);
        }
    )
);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use(passport.initialize());

// ✅ Google Auth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => res.redirect("/dashboard") // Redirect after login
);

// ✅ Debugging Missing Environment Variables
console.log("🔍 MongoDB URI:", process.env.MONGO_URI ? "✅ Set" : "❌ Not Set");
console.log("🔍 Redis API Gateway URL:", process.env.REDIS_PROXY_URL ? "✅ Set" : "❌ Not Set");
console.log("🔍 Google Client ID:", process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Not Set");
console.log("🔍 Google Callback URL:", process.env.GOOGLE_CALLBACK_URL ? "✅ Set" : "❌ Not Set");

// ✅ Use Routes
app.use(shortenRoutes); // Register the routes

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err.stack);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
