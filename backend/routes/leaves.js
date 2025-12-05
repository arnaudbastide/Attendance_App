// backend/routes/leaves.js - Leave management routes
const express = require('express');
const router = express.Router();
const { 
  createLeaveRequest, 
  getMyLeaves, 
  getPendingLeaves, 
  approveLeave, 
  cancelLeave, 
  getLeaveBalance 
} = require('../controllers/leaveController');
const { authorize } = require('../middleware/auth');

// Employee routes
router.post('/', createLeaveRequest);
router.get('/my', getMyLeaves);
router.get('/balance', getLeaveBalance);
router.put('/:leaveId/cancel', cancelLeave);

// Manager/Admin routes
router.get('/pending', authorize('manager', 'admin'), getPendingLeaves);
router.put('/:leaveId/approve', authorize('manager', 'admin'), approveLeave);

module.exports = router;