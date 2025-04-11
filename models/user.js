'use strict';

const vogels = require('vogels');
const Joi = require('joi');

// Use the vogels Joi instance to avoid compatibility issues
const joiVogels = vogels.Joi;

// Define User schema with validation using Vogels' Joi
const User = vogels.define('User', {
    hashKey: 'id',
    timestamps: true,
    schema: {
        id: joiVogels.string().required(),
        email: joiVogels.string().email().required(),
        name: joiVogels.string().required(),
        password: joiVogels.string().required(),
        age: joiVogels.number().integer().min(18).max(120)
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