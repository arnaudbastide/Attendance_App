// backend/routes/attendance.js - Attendance routes
const express = require('express');
const router = express.Router();
const {
  clockIn,
  clockOut,
  getCurrentStatus,
  getMyAttendance,
  getTeamAttendance
} = require('../controllers/attendanceController');
const { authorize } = require('../middleware/auth');

// Employee routes - authMiddleware is already applied at server level
// All authenticated users can access these routes
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/status', getCurrentStatus);
router.get('/my', getMyAttendance);

// Manager/Admin routes
router.get('/team', authorize('manager', 'admin'), getTeamAttendance);

module.exports = router;