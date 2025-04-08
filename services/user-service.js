'use strict';

const bluebird = require('bluebird');
const Joi = require('joi');
const { User } = require('../models');
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
        age: value.age
      };

      // Save user to DynamoDB
      return new Promise((resolve, reject) => {
        User.create(user, (err, data) => {
          if (err) {
            return reject(err);
          }
          resolve(data.attrs);
        });
      });
    });
  },

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise<Object>} - User object
   */
  getUserById: (id) => {
    return new Promise((resolve, reject) => {
      User.get(id, (err, data) => {
        if (err) {
          return reject(err);
        }

        if (!data) {
          return reject(new Error('User not found'));
        }

        resolve(data.attrs);
      });
    });
  },

  /**
   * Get user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} - User object
   */
  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      User.getByEmail(email)
        .then(data => {
          if (!data || data.Count === 0) {
            return reject(new Error('User not found'));
          }
          resolve(data.Items[0].attrs);
        })
        .catch(err => reject(err));
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

      // Update user
      return new Promise((resolve, reject) => {
        User.update({ id, ...value }, (err, data) => {
          if (err) {
            return reject(err);
          }

          resolve(data.attrs);
        });
      });
    });
  },

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise<boolean>} - Success flag
   */
  deleteUser: (id) => {
    return new Promise((resolve, reject) => {
      User.destroy(id, (err) => {
        if (err) {
          return reject(err);
        }

        resolve(true);
      });
    });
  },

  /**
   * List all users
   * @returns {Promise<Array>} - List of users
   */
  listUsers: () => {
    return new Promise((resolve, reject) => {
      User.scan().exec((err, data) => {
        if (err) {
          return reject(err);
        }

        resolve(data.Items.map(item => item.attrs));
      });
    });
  }
};

module.exports = UserService;