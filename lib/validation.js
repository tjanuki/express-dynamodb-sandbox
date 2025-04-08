'use strict';

const Joi = require('joi');

/**
 * Validate request data against schema
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);

        if (error) {
            return res.status(400).json({
                error: `Validation error: ${error.details.map(x => x.message).join(', ')}`
            });
        }

        // Replace request body with validated values
        req.body = value;
        next();
    };
};

/**
 * Validate params against schema
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params);

        if (error) {
            return res.status(400).json({
                error: `Validation error: ${error.details.map(x => x.message).join(', ')}`
            });
        }

        // Replace request params with validated values
        req.params = value;
        next();
    };
};

/**
 * Validate query against schema
 * @param {Object} schema - Joi schema
 * @returns {Function} - Express middleware
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query);

        if (error) {
            return res.status(400).json({
                error: `Validation error: ${error.details.map(x => x.message).join(', ')}`
            });
        }

        // Replace request query with validated values
        req.query = value;
        next();
    };
};

module.exports = {
    validateRequest,
    validateParams,
    validateQuery
};