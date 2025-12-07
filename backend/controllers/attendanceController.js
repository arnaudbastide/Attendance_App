// backend/controllers/attendanceController.js - Attendance management controller
const { Attendance, User, Break } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Clock In
const clockIn = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = moment().format('YYYY-MM-DD');

    // Check if already clocked in (has an active session without clock out)
    const activeAttendance = await Attendance.findOne({
      where: {
        userId,
        date: today,
        clockOut: null
      }
    });

    if (activeAttendance) {
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
      isApproved: false
    });

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
      totalHours: totalHours.toFixed(2)
    });

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

    const attendance = await Attendance.findOne({
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

    let status = 'not_clocked_in';
    let currentHours = 0;

    if (attendance) {
      if (attendance.clockOut) {
        status = 'clocked_out';
        currentHours = parseFloat(attendance.totalHours) || 0;
      } else {
        status = 'clocked_in';
        currentHours = moment().diff(moment(attendance.clockIn), 'hours', true);
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
      attendance: attendance.rows,
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
    const { page = 1, limit = 10, startDate, endDate, department, status } = req.query;
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

    // For simplicity in a daily view (which this usually is), we iterate users.
    // If date range > 1 day, we might need to explode rows (Users x Days), 
    // but the UI typically shows a list of records. 
    // If the UI expects a list of attendance records, we should synthesize "Absent" records for each day.
    // However, if the date range is large, this could be huge. 
    // Let's assume the UI mostly queries for a single day or small range, or expects one row per user per day.

    const daysDiff = qEnd.diff(qStart, 'days') + 1;
    console.log(`[DEBUG] Date Range: ${daysDiff} days. Users: ${allUsers.length}`);

    for (let i = 0; i < daysDiff; i++) {
      const currentDate = moment(qStart).add(i, 'days').format('YYYY-MM-DD');

      for (const user of allUsers) {
        // Check for existing attendance
        const attRecord = attendances.find(a => a.userId === user.id && a.date === currentDate);

        // Check for leave
        const leaveRecord = leaves.find(l =>
          moment(currentDate).isBetween(l.startDate, l.endDate, null, '[]') && l.userId === user.id
        );

        if (attRecord) {
          // Real attendance record
          combinedRecords.push({
            ...attRecord.toJSON(),
            user: user.toJSON() // Ensure user data is attached
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
            id: `absent-${user.id}-${currentDate}`, // Virtual ID
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