const { OAuth2Client } = require("google-auth-library");

const googleClientId = process.env.GOOGLE_CLIENT_ID;  // Access the environment variable

const googleClient = new OAuth2Client(googleClientId);

const verifyToken = async (token) => {
    const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: googleClientId,
    });
    const payload = ticket.getPayload();
    return payload;
};

module.exports = verifyToken;
