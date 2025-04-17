'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const bcrypt = require('bcrypt');
const jwtConfig = require('./jwt');
const UserService = require('../../services/user-service');

// Setup local strategy (username/password login)
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        // Find user by email
        const user = await UserService.getUserByEmail(email).catch(err => {
            if (err.message === 'User not found') {
                return null;
            }
            throw err;
        });

        // No user found with that email
        if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
        }

        // Check if password field exists in the user record
        if (!user.password) {
            console.log(`User ${email} found but has no password field`);
            return done(null, false, { message: 'Invalid email or password' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return done(null, false, { message: 'Invalid email or password' });
        }

        // Success - return user without password
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
    } catch (error) {
        return done(error);
    }
}));

// Setup JWT strategy (token-based authentication)
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtConfig.secretOrKey,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
        // Find user by ID from JWT payload
        const user = await UserService.getUserById(payload.sub).catch(err => {
            if (err.message === 'User not found') {
                return null;
            }
            throw err;
        });

        if (!user) {
            return done(null, false);
        }

        // Return user object (without sensitive info)
        const { password: _, ...userWithoutPassword } = user;
        return done(null, userWithoutPassword);
    } catch (error) {
        return done(error);
    }
}));

module.exports = passport;