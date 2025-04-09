'use strict';

require('dotenv').config();
const AWS = require('aws-sdk');
const bluebird = require('bluebird');

// Configure AWS
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

// Create a DynamoDB client
const dynamodb = new AWS.DynamoDB();

// Create User table
const createUserTable = () => {
    const params = {
        TableName: 'User',
        KeySchema: [
            { AttributeName: 'id', KeyType: 'HASH' } // Partition key
        ],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },    // String
            { AttributeName: 'email', AttributeType: 'S' }  // String for GSI
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'EmailIndex',
                KeySchema: [
                    { AttributeName: 'email', KeyType: 'HASH' }  // Partition key for GSI
                ],
                Projection: {
                    ProjectionType: 'ALL'  // All attributes
                },
                ProvisionedThroughput: {
                    ReadCapacityUnits: 5,
                    WriteCapacityUnits: 5
                }
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        }
    };

    return dynamodb.createTable(params).promise()
        .then(data => {
            console.log('Created User table:', data);
            return data;
        })
        .catch(err => {
            if (err.code === 'ResourceInUseException') {
                console.log('User table already exists');
                return { TableDescription: { TableName: 'User' } };
            }
            throw err;
        });
};

// Create all tables
const createAllTables = async () => {
    try {
        console.log('Creating DynamoDB tables...');

        // Create User table
        await createUserTable();

        // Add more table creation functions here if needed

        console.log('All tables have been created successfully');

    } catch (error) {
        console.error('Error creating tables:', error);
        process.exit(1);
    }
};

// Run the table creation
createAllTables();