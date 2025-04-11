// routes/users.js
'use strict';

const express = require('express');
const router = express.Router();
const passport = require('passport');
const UserService = require('../services/user-service');

// Middleware to require authentication
const requireAuth = passport.authenticate('jwt', { session: false });

// Public route - get user profile by ID
router.get('/:id', (req, res, next) => {
    UserService.getUserById(req.params.id)
        .then(user => {
            res.json(user);
        })
        .catch(err => {
            if (err.message === 'User not found') {
                return res.status(404).json({ error: 'User not found' });
            }
            next(err);
        });
});

// Protected routes - require authentication
router.get('/', requireAuth, (req, res, next) => {
    UserService.listUsers()
        .then(users => {
            res.json(users);
        })
        .catch(err => {
            next(err);
        });
});

router.post('/', requireAuth, (req, res, next) => {
    // Only admins can create users directly
    // Implement role-based check here if needed

    UserService.createUser(req.body)
        .then(user => {
            res.status(201).json(user);
        })
        .catch(err => {
            if (err.message.startsWith('Validation error')) {
                return res.status(400).json({ error: err.message });
            }
            next(err);
        });
});

router.put('/:id', requireAuth, (req, res, next) => {
    // Users should only be able to update their own profile
    // Add authorization check here
    if (req.params.id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    UserService.updateUser(req.params.id, req.body)
        .then(user => {
            res.json(user);
        })
        .catch(err => {
            if (err.message.startsWith('Validation error')) {
                return res.status(400).json({ error: err.message });
            }
            if (err.message === 'User not found') {
                return res.status(404).json({ error: 'User not found' });
            }
            next(err);
        });
});

router.delete('/:id', requireAuth, (req, res, next) => {
    // Users should only be able to delete their own account
    // Add authorization check here
    if (req.params.id !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    UserService.deleteUser(req.params.id)
        .then(() => {
            res.status(204).end();
        })
        .catch(err => {
            if (err.message === 'User not found') {
                return res.status(404).json({ error: 'User not found' });
            }
            next(err);
        });
});

module.exports = router;