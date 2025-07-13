
const JWT = require('jsonwebtoken');
const dotenv = require('dotenv'); 
dotenv.config();
const secret = process.env.JWT_SECRET
function generateToken(user) {
    const payload = {
        id: user.id,
        name: user.name,
    };
    const token = JWT.sign(payload, secret, { expiresIn: '1h' });
    return token;
}  

function verifyToken(token) {
    if (!token) throw new Error('No token provided');
    try {
        const decoded = JWT.verify(token, secret);
        return decoded;
    } catch (err) {
        throw new Error('Invalid token');
    }
}

module.exports = {
    generateToken,
    verifyToken
};