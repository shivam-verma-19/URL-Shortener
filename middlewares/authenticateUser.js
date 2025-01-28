// Middleware to check if the user is authenticated
const authenticateUser = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required." });
    }
    next(); // User is authenticated, proceed to the next middleware/handler
};

module.exports = authenticateUser;
