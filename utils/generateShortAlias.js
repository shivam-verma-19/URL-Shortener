const crypto = require('crypto');

function generateShortAlias() {
    return crypto.randomBytes(6).toString('hex'); // Generates a random 12-character hexadecimal string
}

module.exports = generateShortAlias;
