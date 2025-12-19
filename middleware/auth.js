const jwt = require('jsonwebtoken');

//Authenticates JWT tokens from request headers
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];//get token from auth bearer token header
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    //Verify token and attach user data to request
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;//Contains userid, email, username
        next();
    });
}

module.exports = { authenticateToken };