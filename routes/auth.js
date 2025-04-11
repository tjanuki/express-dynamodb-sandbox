// routes/auth.js
'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const UserService = require('../services/user-service');

/**
 * POST /auth/register
 * Register a new user
 */
router.post('/register', (req, res, next) => {
    UserService.registerUser(req.body)
        .then(user => {
            res.status(201).json(user);
        })
        .catch(err => {
            if (err.message.startsWith('Validation error') || err.message === 'Email already in use') {
                return res.status(400).json({ error: err.message });
            }
            next(err);
        });
});

/**
 * POST /auth/login
 * Login a user
 */
router.post('/login', (req, res, next) => {
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(401).json({ error: info.message });
        }

        UserService.loginUser(req.body.email, req.body.password)
            .then(authResponse => {
                res.json(authResponse);
            })
            .catch(err => {
                next(err);
            });
    })(req, res, next);
});

module.exports = router;