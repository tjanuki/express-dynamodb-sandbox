'use strict';

const express = require('express');
const router = express.Router();
const UserService = require('../services/user-service');

/**
 * GET /users
 * List all users
 */
router.get('/', (req, res, next) => {
  UserService.listUsers()
      .then(users => {
        res.json(users);
      })
      .catch(err => {
        next(err);
      });
});

/**
 * GET /users/:id
 * Get user by ID
 */
router.get('/:id', (req, res, next) => {
  UserService.getUserById(req.params.id)
      .then(user => {
        res.json(user);
      })
      .catch(err => {
        if (err.message === 'User not found') {
          return res.status(404).json({ error: 'User not found' });
        }
        next(err);
      });
});

/**
 * POST /users
 * Create a new user
 */
router.post('/', (req, res, next) => {
  UserService.createUser(req.body)
      .then(user => {
        res.status(201).json(user);
      })
      .catch(err => {
        if (err.message.startsWith('Validation error')) {
          return res.status(400).json({ error: err.message });
        }
        next(err);
      });
});

/**
 * PUT /users/:id
 * Update a user
 */
router.put('/:id', (req, res, next) => {
  UserService.updateUser(req.params.id, req.body)
      .then(user => {
        res.json(user);
      })
      .catch(err => {
        if (err.message.startsWith('Validation error')) {
          return res.status(400).json({ error: err.message });
        }
        if (err.message === 'User not found') {
          return res.status(404).json({ error: 'User not found' });
        }
        next(err);
      });
});

/**
 * DELETE /users/:id
 * Delete a user
 */
router.delete('/:id', (req, res, next) => {
  UserService.deleteUser(req.params.id)
      .then(() => {
        res.status(204).end();
      })
      .catch(err => {
        if (err.message === 'User not found') {
          return res.status(404).json({ error: 'User not found' });
        }
        next(err);
      });
});

module.exports = router;