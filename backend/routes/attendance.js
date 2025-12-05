// backend/routes/attendance.js - Attendance routes
const express = require('express');
const router = express.Router();
const { 
  clockIn, 
  clockOut, 
  getMyAttendance, 
  getTeamAttendance, 
  startBreak, 
  endBreak 
} = require('../controllers/attendanceController');
const { authorize } = require('../middleware/auth');

// Employee routes
router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/my', getMyAttendance);
router.post('/break/start', startBreak);
router.post('/break/end', endBreak);

// Manager/Admin routes
router.get('/team', authorize('manager', 'admin'), getTeamAttendance);

module.exports = router;