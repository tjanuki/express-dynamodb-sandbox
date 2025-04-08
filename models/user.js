'use strict';

const vogels = require('vogels');
const Joi = require('joi');

// Define User schema with validation using Joi
const User = vogels.define('User', {
    hashKey: 'id',
    timestamps: true,
    schema: {
        id: Joi.string().required(),
        email: Joi.string().email().required(),
        name: Joi.string().required(),
        age: Joi.number().integer().min(18).max(120),
        createdAt: Joi.date(),
        updatedAt: Joi.date()
    },
    indexes: [
        {
            hashKey: 'email',
            name: 'EmailIndex',
            type: 'global'
        }
    ]
});

// Add methods to the User model
User.getByEmail = (email) => {
    return User.query(email)
        .usingIndex('EmailIndex')
        .exec();
};

module.exports = User;