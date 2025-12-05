// backend/routes/users.js - User management routes
const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserById, 
  updateUser, 
  deactivateUser, 
  getDepartments, 
  getManagers 
} = require('../controllers/userController');
const { authorize } = require('../middleware/auth');

// Common routes
router.get('/departments', getDepartments);
router.get('/managers', getManagers);
router.get('/profile/:userId', getUserById);
router.put('/profile/:userId', updateUser);

// Admin/Manager routes
router.get('/', getUsers);
router.put('/:userId/deactivate', authorize('admin'), deactivateUser);

module.exports = router;