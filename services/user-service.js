'use strict';

const bluebird = require('bluebird');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');

// Validation schema for creating a user
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  age: Joi.number().integer().min(18).max(120)
});

// Validation schema for updating a user
const updateUserSchema = Joi.object({
  name: Joi.string(),
  age: Joi.number().integer().min(18).max(120)
}).min(1);

// User Service with promise-based methods
const UserService = {
  /**
   * Create a new user
   * @param {Object} userData - User data to create
   * @returns {Promise<Object>} - Created user
   */
  createUser: (userData) => {
    return bluebird.try(() => {
      // Validate user data
      const { error, value } = createUserSchema.validate(userData);
      if (error) {
        throw new Error(`Validation error: ${error.message}`);
      }

      // Create user with validated data
      const user = {
        id: uuidv4(),
        email: value.email,
        name: value.name,
        age: value.age,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save user to DynamoDB
      const params = {
        TableName: 'User',
        Item: user
      };

      return dynamoDb.put(params).promise()
          .then(() => user);
    });
  },

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} - User object
   */
  getUserById: (id) => {
    const params = {
      TableName: 'User',
      Key: { id }
    };

    return dynamoDb.get(params).promise()
        .then(result => {
          if (!result.Item) {
            throw new Error('User not found');
          }

          return result.Item;
        });
  },

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} - User object
   */
  getUserByEmail: (email) => {
    const params = {
      TableName: 'User',
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };

    return dynamoDb.query(params).promise()
        .then(result => {
          if (!result.Items || result.Items.length === 0) {
            throw new Error('User not found');
          }

          return result.Items[0];
        });
  },

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated user
   */
  updateUser: (id, updateData) => {
    return bluebird.try(() => {
      // Validate update data
      const { error, value } = updateUserSchema.validate(updateData);
      if (error) {
        throw new Error(`Validation error: ${error.message}`);
      }

      // Check if user exists
      return UserService.getUserById(id)
          .then(existingUser => {
            // Prepare update expression
            let updateExpression = 'SET updatedAt = :updatedAt';
            let expressionAttributeValues = {
              ':updatedAt': new Date().toISOString()
            };

            // Add update fields
            Object.keys(value).forEach(key => {
              updateExpression += `, ${key} = :${key}`;
              expressionAttributeValues[`:${key}`] = value[key];
            });

            // Update user
            const params = {
              TableName: 'User',
              Key: { id },
              UpdateExpression: updateExpression,
              ExpressionAttributeValues: expressionAttributeValues,
              ReturnValues: 'ALL_NEW'
            };

            return dynamoDb.update(params).promise()
                .then(result => result.Attributes);
          });
    });
  },

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Success flag
   */
  deleteUser: (id) => {
    // Check if user exists
    return UserService.getUserById(id)
        .then(() => {
          const params = {
            TableName: 'User',
            Key: { id }
          };

          return dynamoDb.delete(params).promise()
              .then(() => true);
        });
  },

  /**
   * List all users
   * @returns {Promise<Array>} - List of users
   */
  listUsers: () => {
    const params = {
      TableName: 'User'
    };

    return dynamoDb.scan(params).promise()
        .then(result => result.Items || []);
  }
};

module.exports = UserService;