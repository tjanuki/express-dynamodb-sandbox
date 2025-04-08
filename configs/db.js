'use strict';

const vogels = require('vogels');
const AWS = require('aws-sdk');
const bluebird = require('bluebird');

// Use bluebird for promises
vogels.Promise = bluebird;

// Function to initialize DynamoDB with configuration
const initDynamoDB = () => {
    // Set AWS config from environment variables
    const config = {
        region: process.env.AWS_REGION || 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };

    // If using DynamoDB local
    if (process.env.DYNAMODB_LOCAL === 'true') {
        console.log('Using DynamoDB Local');
        config.endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT || 'http://localhost:8000';
    }

    // Update AWS config
    AWS.config.update(config);
    vogels.AWS.config.update(config);

    return vogels;
};

// Function to create tables if they don't exist
const createTables = () => {
    return new Promise((resolve, reject) => {
        vogels.createTables((err) => {
            if (err) {
                console.error('Error creating tables', err);
                return reject(err);
            }

            console.log('Tables have been created');
            resolve();
        });
    });
};

module.exports = {
    initDynamoDB,
    createTables,
    vogels
};