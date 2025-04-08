'use strict';

const express = require('express');
const router = express.Router();
const userRoutes = require('./users');

// Home route
router.get('/', (req, res) => {
    res.render('index', { title: 'Express DynamoDB Sandbox' });
});

// Health check route
router.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Mount user routes
router.use('/api/users', userRoutes);

module.exports = router;