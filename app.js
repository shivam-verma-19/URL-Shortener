const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const axios = require("axios");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cors = require("cors");
const shortenRoutes = require("./routes/shorten");
const analyticsRoutes = require("./routes/analytics");
const User = require("./models/user"); // Assuming you have a User model
const { setRedisKey, getRedisKey } = require("./config/redisClient"); // Use API Gateway for Redis

dotenv.config(); // Load environment variables

const app = express();
app.use(express.json());
app.use(helmet()); // Set security headers
app.use(mongoSanitize()); // Sanitize data
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP parameter pollution
app.use(cors()); // Enable CORS

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Custom session store using API Gateway
class APIGatewaySessionStore extends session.Store {
    constructor(apiGatewayUrl) {
        super();
        this.apiGatewayUrl = apiGatewayUrl;
    }

    async get(sid, callback) {
        try {
            const response = await axios.post(this.apiGatewayUrl, { key: `sess:${sid}` });
            callback(null, response.data ? JSON.parse(response.data.value) : null);
        } catch (error) {
            callback(error);
        }
    }

    async set(sid, session, callback) {
        try {
            await axios.post(this.apiGatewayUrl, { key: `sess:${sid}`, value: JSON.stringify(session) });
            callback(null);
        } catch (error) {
            callback(error);
        }
    }

    async destroy(sid, callback) {
        try {
            await axios.post(this.apiGatewayUrl, { key: `sess:${sid}`, value: null });
            callback(null);
        } catch (error) {
            callback(error);
        }
    }
}

const apiGatewayUrl = process.env.REDIS_PROXY_URL;
app.use(session({
    store: new APIGatewaySessionStore(apiGatewayUrl),
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" } // Set to true if using HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());

// ✅ Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    })
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
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ googleId: profile.id });
                if (!user) {
                    user = new User({
                        googleId: profile.id,
                        displayName: profile.displayName,
                        email: profile.emails[0].value,
                    });
                    await user.save();
                }
                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// ✅ Google Auth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => res.redirect("/dashboard") // Redirect after login
);

// ✅ Root Route
app.get("/", (req, res) => {
    res.send("Welcome to the URL Shortener Service");
});

// ✅ Debugging Missing Environment Variables
console.log("🔍 MongoDB URI:", process.env.MONGO_URI ? "✅ Set" : "❌ Not Set");
console.log("🔍 Redis API Gateway URL:", process.env.REDIS_PROXY_URL ? "✅ Set" : "❌ Not Set");
console.log("🔍 Google Client ID:", process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Not Set");
console.log("🔍 Google Callback URL:", process.env.GOOGLE_CALLBACK_URL ? "✅ Set" : "❌ Not Set");

// ✅ Use Routes
app.use(shortenRoutes); // Register the routes
app.use(analyticsRoutes); // Register analytics routes

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err.stack);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));