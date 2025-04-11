'use strict';

module.exports = {
    secretOrKey: process.env.JWT_SECRET || 'your-secret-key',  // Use env variable in production
    expiresIn: '1d',  // Token expiration time
    issuer: 'your-app-name',
    audience: 'your-app-clients'
};