'use strict';

// Load environment variables
require('dotenv').config();

const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const bluebird = require('bluebird');
const vogels = require('vogels');

// Configure vogels to use bluebird promises
vogels.Promise = bluebird;

// Configure AWS for DynamoDB
const AWS = require('aws-sdk');
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// If using DynamoDB local
if (process.env.DYNAMODB_LOCAL) {
    console.log('Using DynamoDB Local');
    AWS.config.update({
        endpoint: process.env.DYNAMODB_LOCAL_ENDPOINT || 'http://localhost:8000'
    });
}

vogels.AWS.config.update(AWS.config);

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