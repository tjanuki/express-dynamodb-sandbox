'use strict';

const express = require('express');
const router = express.Router();
const userRoutes = require('./users');
const authRoutes = require('./auth');

// Home route
router.get('/', (req, res) => {
    res.render('index', { title: 'Express DynamoDB Sandbox' });
});

// Health check route
router.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Mount auth routes
router.use('/api/auth', authRoutes);

// Mount user routes
router.use('/api/users', userRoutes);

module.exports = router;