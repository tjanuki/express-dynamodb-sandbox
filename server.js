'use strict';

// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const passport = require('./configs/auth/passport');

// Configure AWS for DynamoDB
const config = {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fakeMyKeyId',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fakeSecretAccessKey'
};

// If using DynamoDB local
if (process.env.DYNAMODB_LOCAL === 'true') {
    console.log('Using DynamoDB Local');
    config.endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT || 'http://localhost:8000';
}

// Update AWS config
AWS.config.update(config);

// Make AWS SDK available globally
global.AWS = AWS;
global.dynamoDb = new AWS.DynamoDB.DocumentClient();

// Initialize Express app
const app = express();

// Configure view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

// Routes
const routes = require('./routes');
app.use('/', routes);

// Error handler - 404
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Error handler - general
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: app.get('env') === 'development' ? err : {}
    });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;