// backend/controllers/attendanceController.js - Attendance management controller
const { Attendance, User, Break, Leave } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Clock In
const clockIn = async (req, res, next) => {
  try {
    console.log('[ClockIn Debug] Request received');
    if (!req.user) console.log('[ClockIn Debug] No user in request!');
    const userId = req.user.id;
    const today = moment().format('YYYY-MM-DD');
    console.log('[ClockIn Debug] Request Body:', JSON.stringify(req.body));
    console.log('[ClockIn Debug] Location:', req.body.location);

    // Check for approved leave
    const onLeave = await Leave.findOne({
      where: {
        userId,
        status: 'approved',
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today }
      }
    });

    if (onLeave) {
      return res.status(400).json({
        success: false,
        message: 'You cannot clock in while on approved leave.'
      });
      console.log(`[ClockIn Debug] Failed - User on leave`);
    }

    // Check if already clocked in (has an active session without clock out)
    // Check if already clocked in (has an active session without clock out)
    const activeAttendance = await Attendance.findOne({
      where: {
        userId,
        date: today,
        clockOut: null
      }
    });

    if (activeAttendance) {
      console.log(`[ClockIn Debug] Failed - Already clocked in`);
      return res.status(400).json({
        success: false,
        message: 'You are already clocked in'
      });
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      userId,
      clockIn: new Date(),
      date: today,
      status: 'present',
      isApproved: false,
      locationIn: req.body.location || null // Save locationIn
    });
    console.log(`[ClockIn Debug] Success - ID: ${attendance.id}`);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('new_attendance', {
        ...attendance.toJSON(),
        user: req.user
      });
    }

    res.json({
      success: true,
      message: 'Clocked in successfully',
      attendance
    });
  } catch (error) {
    next(error);
  }
};

// Clock Out
const clockOut = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = moment().format('YYYY-MM-DD');

    // Find active attendance (no clock out time)
    const attendance = await Attendance.findOne({
      where: {
        userId,
        date: today,
        clockOut: null
      }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No active clock-in record found to close'
      });
    }

    // Calculate total hours
    const clockOutTime = new Date();
    const totalHours = moment(clockOutTime).diff(moment(attendance.clockIn), 'hours', true);

    // Update attendance record
    await attendance.update({
      clockOut: clockOutTime,
      totalHours: totalHours.toFixed(2),
      locationOut: req.body.location || null // Save locationOut
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('new_attendance', {
        ...attendance.toJSON(),
        clockOut: clockOutTime,
        status: 'clocked_out', // Virtual status for UI
        user: req.user
      });
    }

    res.json({
      success: true,
      message: 'Clocked out successfully',
      attendance,
      totalHours: totalHours.toFixed(2)
    });
  } catch (error) {
    next(error);
  }
};

// Get current status
const getCurrentStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = moment().format('YYYY-MM-DD');

    // Get ALL attendance records for today, not just one
    const attendanceRecords = await Attendance.findAll({
      where: {
        userId,
        date: today
      },
      include: [
        {
          model: Break,
          as: 'breaks'
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Check for leave
    const leaveRecord = await Leave.findOne({
      where: {
        userId,
        status: 'approved',
        startDate: { [Op.lte]: today },
        endDate: { [Op.gte]: today }
      }
    });

    console.log(`[Status Debug] User: ${userId}, Date: ${today}`);
    console.log(`[Status Debug] Leave Query Result:`, leaveRecord ? `Found (Status: ${leaveRecord.status})` : 'Not Found');
    console.log(`[Status Debug] Attendance Records Found:`, attendanceRecords.length);

    let status = 'not_clocked_in';
    let currentHours = 0;
    let attendance = null;

    if (leaveRecord) {
      status = 'on_leave';
    } else if (attendanceRecords.length > 0) {
      // Get the most recent record for status
      attendance = attendanceRecords[0];

      // Calculate total hours from ALL sessions today
      let totalDayHours = 0;
      let hasActiveSession = false;

      for (const record of attendanceRecords) {
        if (record.clockOut) {
          // Completed session - add its hours
          const sessionHours = moment(record.clockOut).diff(moment(record.clockIn), 'hours', true);
          totalDayHours += sessionHours;
        } else {
          // Active session - this is the current one
          hasActiveSession = true;
          const activeHours = moment().diff(moment(record.clockIn), 'hours', true);
          totalDayHours += activeHours;
        }
      }

      currentHours = totalDayHours;

      // Set status based on most recent record
      if (attendance.clockOut) {
        status = 'clocked_out';
      } else {
        status = 'clocked_in';
      }
    }

    res.json({
      success: true,
      status,
      attendance,
      currentHours: Number(currentHours).toFixed(2)
    });
  } catch (error) {
    next(error);
  }
};

// Get user's attendance records
const getMyAttendance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { userId };

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const attendance = await Attendance.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Break,
          as: 'breaks'
        }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      attendances: attendance.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: attendance.count,
        pages: Math.ceil(attendance.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Team Attendance (for managers and admins)
const getTeamAttendance = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, department, status, search } = req.query;
    const offset = (page - 1) * limit;

    // Default to today if no date range provided
    const qStart = startDate ? moment(startDate).startOf('day') : moment().startOf('day');
    const qEnd = endDate ? moment(endDate).endOf('day') : moment().endOf('day');

    console.log('qStart:', qStart.format(), 'qEnd:', qEnd.format(), 'Raw Start:', startDate, 'Raw End:', endDate);
    // 1. Build User Filters
    let userWhereClause = { isActive: true };
    if (department) {
      userWhereClause.department = department;
    }

    if (search) {
      userWhereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Managers can only see their team
    if (req.user.role === 'manager') {
      userWhereClause.managerId = req.user.id;
    }

    // 2. Fetch ALL matching users first (filtering later for pagination)
    // We need all users to correctly determine "Absent" vs "Present" for the full set
    const allUsers = await User.findAll({
      where: userWhereClause,
      attributes: ['id', 'name', 'email', 'department', 'position', 'managerId'],
      order: [['name', 'ASC']]
    });

    console.log(`Found ${allUsers.length} active users matching criteria.`);

    // 3. Fetch Attendance for these users in date range
    const userIds = allUsers.map(u => u.id);
    const attendances = await Attendance.findAll({
      where: {
        userId: { [Op.in]: userIds },
        date: {
          [Op.between]: [qStart.format('YYYY-MM-DD'), qEnd.format('YYYY-MM-DD')]
        }
      },
      include: [{ model: Break, as: 'breaks' }]
    });

    // 4. Fetch Approved Leaves for these users in date range
    const leaves = await require('../models').Leave.findAll({
      where: {
        userId: { [Op.in]: userIds },
        status: 'approved',
        [Op.or]: [
          {
            startDate: { [Op.between]: [qStart.format('YYYY-MM-DD'), qEnd.format('YYYY-MM-DD')] }
          },
          {
            endDate: { [Op.between]: [qStart.format('YYYY-MM-DD'), qEnd.format('YYYY-MM-DD')] }
          },
          {
            startDate: { [Op.lte]: qStart.format('YYYY-MM-DD') },
            endDate: { [Op.gte]: qEnd.format('YYYY-MM-DD') }
          }
        ]
      }
    });

    // 5. Construct the Combined List
    let combinedRecords = [];

    // Create Maps for O(1) lookup
    const attendanceMap = new Map();
    attendances.forEach(att => {
      const key = `${att.userId}-${att.date}`;
      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, []);
      }
      attendanceMap.get(key).push(att);
    });

    const daysDiff = qEnd.diff(qStart, 'days') + 1;
    console.log(`[DEBUG] Date Range: ${daysDiff} days. Users: ${allUsers.length}`);

    for (let i = 0; i < daysDiff; i++) {
      const currentDate = moment(qStart).add(i, 'days').format('YYYY-MM-DD');

      for (const user of allUsers) {
        const attKey = `${user.id}-${currentDate}`;
        const attRecords = attendanceMap.get(attKey);

        // Check for leave with correct date logic
        const leaveRecord = leaves.find(l =>
          moment(currentDate).isBetween(l.startDate, l.endDate, null, '[]') && l.userId === user.id
        );

        if (attRecords && attRecords.length > 0) {
          // Real attendance records - Push ALL of them
          attRecords.forEach(attRecord => {
            let recordData = attRecord.toJSON();

            // Calculate live hours for active sessions
            if (!recordData.clockOut) {
              const activeHours = moment().diff(moment(recordData.clockIn), 'hours', true);
              recordData.totalHours = activeHours.toFixed(2);
              // Ensure we don't send null/zero if it's just started
            }

            combinedRecords.push({
              ...recordData,
              user: user.toJSON()
            });
          });
        } else if (leaveRecord) {
          // User is ON LEAVE
          combinedRecords.push({
            id: `leave-${user.id}-${currentDate}`,
            userId: user.id,
            date: currentDate,
            status: 'on_leave',
            clockIn: null,
            clockOut: null,
            totalHours: 0,
            user: user.toJSON(),
            breaks: [],
            notes: `On Leave: ${leaveRecord.leaveType}`
          });
        } else {
          // User is ABSENT
          combinedRecords.push({
            id: `absent-${user.id}-${currentDate}`,
            userId: user.id,
            date: currentDate,
            status: 'absent',
            clockIn: null,
            clockOut: null,
            totalHours: 0,
            user: user.toJSON(),
            breaks: []
          });
        }
      }
    }

    // 6. Apply Status Filter (if requested)
    if (status) {
      combinedRecords = combinedRecords.filter(r => r.status === status);
    }

    // 7. Pagination
    const total = combinedRecords.length;
    const paginatedRecords = combinedRecords.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      attendances: paginatedRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  clockIn,
  clockOut,
  getCurrentStatus,
  getMyAttendance,
  getTeamAttendance
};