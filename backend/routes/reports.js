// backend/routes/reports.js - Report generation routes
const express = require('express');
const router = express.Router();
const { 
  getAttendanceReport, 
  getLeaveReport, 
  getDashboardStats 
} = require('../controllers/reportController');
const { authorize } = require('../middleware/auth');

// Common routes
router.get('/dashboard', getDashboardStats);
router.get('/attendance', getAttendanceReport);
router.get('/leaves', getLeaveReport);

module.exports = router;