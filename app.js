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
const User = require("./models/user");
const { setSessionKey } = require("./utils/redisProxy"); // Updated function imports

dotenv.config();

const app = express();
app.use(express.json());
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(cors());

const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
});
app.use(limiter);

// ✅ Updated API Gateway URL
const apiGatewaySessionUrl = "https://axptlo1c2i.execute-api.ap-south-1.amazonaws.com/prod";

class APIGatewaySessionStore extends session.Store {
    constructor(apiGatewayUrl) {
        super();
        this.apiGatewayUrl = apiGatewayUrl;
    }

    async get(sid, callback) {
        try {
            const response = await axios.get(`${this.apiGatewayUrl}/RedisHandler/get`, { keyType: "session", key: sid });
            callback(null, response.data ? JSON.parse(response.data.value) : null);
        } catch (error) {
            console.error("Error getting session:", error.message);
            callback(error);
        }
    }

    async set(sid, session, callback) {
        try {
            await axios.post(`${this.apiGatewayUrl}/RedisHandler/set`, { keyType: "session", key: sid, value: JSON.stringify(session) });
            callback(null);
        } catch (error) {
            console.error("Error setting session:", error.message);
            callback(error);
        }
    }

    async destroy(sid, callback) {
        try {
            await axios.post(`${this.apiGatewayUrl}/RedisHandler/destroy`, { keyType: "session", key: sid });
            callback(null);
        } catch (error) {
            console.error("Error destroying session:", error.message);
            callback(error);
        }
    }
}


// ✅ Now using the correct API Gateway URL
app.use(session({
    store: new APIGatewaySessionStore(apiGatewaySessionUrl),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === "production" ? true : false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
    },
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Using new Redis session functions instead of old `setRedisKey`
(async () => {
    try {
        await setSessionKey("connection-test", "OK");
        console.log("✅ Redis session connection via API Gateway successful");
    } catch (error) {
        console.error("❌ Redis session connection error:", error.message);
    }
})();

passport.use(new GoogleStrategy(
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
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => res.redirect("/dashboard")
);

app.get("/", (req, res) => {
    res.send("Welcome to the URL Shortener Service");
});

console.log("🔍 MongoDB URI:", process.env.MONGO_URI ? "✅ Set" : "❌ Not Set");
console.log("🔍 Redis API Gateway URL:", apiGatewaySessionUrl);
console.log("🔍 Google Client ID:", process.env.GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Not Set");
console.log("🔍 Google Callback URL:", process.env.GOOGLE_CALLBACK_URL ? "✅ Set" : "❌ Not Set");

app.use(shortenRoutes);
app.use(analyticsRoutes);

app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    console.error("❌ Server Error:", err.stack);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
