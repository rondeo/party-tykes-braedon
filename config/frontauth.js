
const config = require('config');
const jwt = require('jsonwebtoken');

function auth(req, res, next) {

    const token = req.header('x-auth-token');

    if (!token)
        return res.status(401).json({ message: 'No token provided, auth failed!' });
    try {
        const decoded = jwt.verify(token, config.get('JWT_SECRET'));
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ message: 'Invalid Token!' })
    }
}

module.exports = auth;