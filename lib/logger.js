'use strict';

/**
 * Simple logger utility
 * In a real application, you might want to use a more robust logging library like Winston
 */
const Logger = {
    /**
     * Log an info message
     * @param {string} message - Message to log
     * @param {Object} [data] - Optional data to log
     */
    info: (message, data) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
    },

    /**
     * Log a warning message
     * @param {string} message - Message to log
     * @param {Object} [data] - Optional data to log
     */
    warn: (message, data) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
    },

    /**
     * Log an error message
     * @param {string} message - Message to log
     * @param {Object|Error} [error] - Optional error to log
     */
    error: (message, error) => {
        console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
    },

    /**
     * Log a debug message (only in development)
     * @param {string} message - Message to log
     * @param {Object} [data] - Optional data to log
     */
    debug: (message, data) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
        }
    },

    /**
     * Create a middleware for logging HTTP requests
     * @returns {Function} - Express middleware
     */
    requestLogger: () => {
        return (req, res, next) => {
            const start = Date.now();

            // Log when the request completes
            res.on('finish', () => {
                const duration = Date.now() - start;
                const log = {
                    method: req.method,
                    path: req.originalUrl || req.url,
                    statusCode: res.statusCode,
                    duration: `${duration}ms`,
                    userAgent: req.get('user-agent') || '-',
                    ip: req.ip || req.connection.remoteAddress
                };

                // Log at different levels based on status code
                if (res.statusCode >= 500) {
                    Logger.error(`Request failed with ${res.statusCode}`, log);
                } else if (res.statusCode >= 400) {
                    Logger.warn(`Request resulted in ${res.statusCode}`, log);
                } else {
                    Logger.info(`Request completed with ${res.statusCode}`, log);
                }
            });

            next();
        };
    }
};

module.exports = Logger;