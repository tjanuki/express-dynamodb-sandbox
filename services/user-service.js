'use strict';

const bluebird = require('bluebird');
const Joi = require('joi');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../configs/auth/jwt');

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
     * Register a new user with password
     * @param {Object} userData - User registration data
     * @returns {Promise<Object>} - Created user without password
     */
    registerUser: async (userData) => {
        return bluebird.try(async () => {
            // Add password validation to schema
            const registerSchema = createUserSchema.keys({
                password: Joi.string().min(8).required()
            });

            // Validate user data
            const { error, value } = registerSchema.validate(userData);
            if (error) {
                throw new Error(`Validation error: ${error.message}`);
            }

            // Check if email already exists
            try {
                await UserService.getUserByEmail(value.email);
                throw new Error('Email already in use');
            } catch (err) {
                // Continue if the error is 'User not found', otherwise throw
                if (err.message !== 'User not found') {
                    throw err;
                }
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(value.password, salt);

            // Create user with hashed password
            const user = {
                id: uuidv4(),
                email: value.email,
                name: value.name,
                password: hashedPassword,
                age: value.age,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save user to DynamoDB
            const params = {
                TableName: 'User',
                Item: user
            };

            await dynamoDb.put(params).promise();

            // Return user without password
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    },

    /**
     * Login user and generate JWT token
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object>} - Auth response with token and user
     */
    loginUser: async (email, password) => {
        return bluebird.try(async () => {
            // Get user by email
            const user = await UserService.getUserByEmail(email);

            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new Error('Invalid credentials');
            }

            // Generate JWT
            const payload = {
                sub: user.id,     // Subject (user ID)
                email: user.email,
                iat: Date.now()   // Issued at
            };

            const token = jwt.sign(payload, jwtConfig.secretOrKey, {
                expiresIn: jwtConfig.expiresIn,
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience
            });

            // Return authentication response
            return {
                token: `Bearer ${token}`,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name
                }
            };
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
     * Update user password
     * @param {string} id - User ID
     * @param {string} currentPassword - Current password for verification
     * @param {string} newPassword - New password to set
     * @returns {Promise<boolean>} - Success flag
     */
    updatePassword: async (id, currentPassword, newPassword) => {
        return bluebird.try(async () => {
            // Validate password
            if (!newPassword || newPassword.length < 8) {
                throw new Error('Validation error: Password must be at least 8 characters');
            }

            // Get user
            const user = await UserService.getUserById(id);

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                throw new Error('Current password is incorrect');
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update password in database
            const params = {
                TableName: 'User',
                Key: { id },
                UpdateExpression: 'SET password = :password, updatedAt = :updatedAt',
                ExpressionAttributeValues: {
                    ':password': hashedPassword,
                    ':updatedAt': new Date().toISOString()
                }
            };

            await dynamoDb.update(params).promise();
            return true;
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
            TableName: 'User',
            ProjectionExpression: 'id, email, #name, age, createdAt, updatedAt',
            ExpressionAttributeNames: {
                '#name': 'name' // 'name' is a reserved word in DynamoDB
            }
        };

        return dynamoDb.scan(params).promise()
            .then(result => result.Items || []);
    },

    /**
     * Verify a JWT token and get user
     * @param {string} token - JWT token
     * @returns {Promise<Object>} - User data
     */
    verifyToken: (token) => {
        return bluebird.try(() => {
            try {
                // Remove 'Bearer ' prefix if present
                const tokenString = token.startsWith('Bearer ')
                    ? token.slice(7, token.length)
                    : token;

                // Verify token
                const decoded = jwt.verify(tokenString, jwtConfig.secretOrKey, {
                    issuer: jwtConfig.issuer,
                    audience: jwtConfig.audience
                });

                // Return user ID from token subject
                return UserService.getUserById(decoded.sub);
            } catch (error) {
                throw new Error('Invalid token');
            }
        });
    },

    /**
     * Generate a password reset token
     * @param {string} email - User email
     * @returns {Promise<Object>} - Reset token info
     */
    generatePasswordResetToken: async (email) => {
        return bluebird.try(async () => {
            // Find user by email
            const user = await UserService.getUserByEmail(email);

            // Generate reset token with short expiry
            const payload = {
                sub: user.id,
                email: user.email,
                purpose: 'password_reset',
                iat: Date.now()
            };

            const resetToken = jwt.sign(payload, jwtConfig.secretOrKey, {
                expiresIn: '1h',  // Short expiry for security
                issuer: jwtConfig.issuer,
                audience: jwtConfig.audience
            });

            // Store token hash in user record for verification
            const tokenHash = await bcrypt.hash(resetToken, 10);

            const params = {
                TableName: 'User',
                Key: { id: user.id },
                UpdateExpression: 'SET resetTokenHash = :tokenHash, resetTokenExpires = :expires, updatedAt = :updatedAt',
                ExpressionAttributeValues: {
                    ':tokenHash': tokenHash,
                    ':expires': new Date(Date.now() + 3600000).toISOString(), // 1 hour
                    ':updatedAt': new Date().toISOString()
                }
            };

            await dynamoDb.update(params).promise();

            return {
                userId: user.id,
                resetToken,
                email: user.email
            };
        });
    },

    /**
     * Reset password with token
     * @param {string} token - Reset token
     * @param {string} newPassword - New password
     * @returns {Promise<boolean>} - Success flag
     */
    resetPassword: async (token, newPassword) => {
        return bluebird.try(async () => {
            // Validate password
            if (!newPassword || newPassword.length < 8) {
                throw new Error('Validation error: Password must be at least 8 characters');
            }

            try {
                // Verify token
                const decoded = jwt.verify(token, jwtConfig.secretOrKey, {
                    issuer: jwtConfig.issuer,
                    audience: jwtConfig.audience
                });

                if (decoded.purpose !== 'password_reset') {
                    throw new Error('Invalid token purpose');
                }

                // Get user
                const user = await UserService.getUserById(decoded.sub);

                // Check if token is expired in our DB record
                if (!user.resetTokenExpires || new Date(user.resetTokenExpires) < new Date()) {
                    throw new Error('Reset token has expired');
                }

                // Hash new password
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(newPassword, salt);

                // Update password and clear reset token
                const params = {
                    TableName: 'User',
                    Key: { id: user.id },
                    UpdateExpression: 'SET password = :password, resetTokenHash = :resetTokenHash, resetTokenExpires = :resetTokenExpires, updatedAt = :updatedAt',
                    ExpressionAttributeValues: {
                        ':password': hashedPassword,
                        ':resetTokenHash': null,
                        ':resetTokenExpires': null,
                        ':updatedAt': new Date().toISOString()
                    }
                };

                await dynamoDb.update(params).promise();
                return true;
            } catch (error) {
                throw new Error('Invalid or expired token');
            }
        });
    }
};

module.exports = UserService;