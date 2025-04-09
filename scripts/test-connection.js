'use strict';

require('dotenv').config();
const AWS = require('aws-sdk');

// Configure AWS
const config = {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'fakeMyKeyId',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'fakeSecretAccessKey'
};

// If using DynamoDB local
if (process.env.DYNAMODB_LOCAL === 'true') {
    console.log('Using DynamoDB Local at', process.env.DYNAMODB_LOCAL_ENDPOINT || 'http://localhost:8000');
    config.endpoint = process.env.DYNAMODB_LOCAL_ENDPOINT || 'http://localhost:8000';
}

// Update AWS config
AWS.config.update(config);

// Create a DynamoDB client
const dynamodb = new AWS.DynamoDB();

// List tables and check connection
const listTables = async () => {
    try {
        console.log('Connecting to DynamoDB...');
        const data = await dynamodb.listTables().promise();
        console.log('Connected successfully!');
        console.log('Available tables:', data.TableNames);

        if (data.TableNames.includes('User')) {
            console.log('\nDescribing User table:');
            const tableDesc = await dynamodb.describeTable({ TableName: 'User' }).promise();
            console.log(JSON.stringify(tableDesc.Table, null, 2));
        }
    } catch (error) {
        console.error('Error connecting to DynamoDB:', error);
        process.exit(1);
    }
};

// Run the test
listTables();