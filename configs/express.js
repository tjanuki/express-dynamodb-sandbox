'use strict';

const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');

module.exports = (app) => {
    // View engine setup
    app.set('views', path.join(__dirname, '..', 'views'));
    app.set('view engine', 'jade');

    // Middleware
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(express.static(path.join(__dirname, '..', 'public')));

    // CORS setup (if needed)
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        next();
    });

    return app;
};