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
      ]
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

    let whereClause = {};

    // Date range filter
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Status filter
    if (status) {
      whereClause.status = status;
    }

    // User filter for department
    let userWhereClause = {};
    if (department) {
      userWhereClause.department = department;
    }

    // Managers can only see their team's attendance
    if (req.user.role === 'manager') {
      userWhereClause.managerId = req.user.id;
    }
    // Admin sees all

    // Build the User include object conditionally
    const userInclude = {
      model: User,
      as: 'user',
      attributes: ['id', 'name', 'email', 'department', 'position']
    };

    // Only add where clause if there are conditions
    if (Object.keys(userWhereClause).length > 0) {
      userInclude.where = userWhereClause;
    }

    // Special handling for 'absent' status
    if (status === 'absent') {
      // 1. Get all users matching the user filters
      const users = await User.findAll({
        where: {
          ...userWhereClause,
          isActive: true
        },
        attributes: ['id', 'name', 'email', 'department', 'position']
      });

      // 2. Find which users have attendance for the date range
      const presentUserIds = await Attendance.findAll({
        where: {
          date: {
            [Op.between]: [startDate || moment().format('YYYY-MM-DD'), endDate || moment().format('YYYY-MM-DD')]
          }
        },
        attributes: ['userId']
      }).then(recs => recs.map(r => r.userId));

      // 3. Filter users who are NOT present (i.e., are absent)
      const absentUsers = users.filter(user => !presentUserIds.includes(user.id));

      // 4. Create "virtual" attendance records for absent users
      const absentRecords = absentUsers.map(user => ({
        id: `absent-${user.id}-${startDate}`, // Virtual ID
        userId: user.id,
        date: startDate || moment().format('YYYY-MM-DD'),
        status: 'absent',
        clockIn: null,
        clockOut: null,
        totalHours: 0,
        user: user,
        breaks: []
      }));

      // Pagination for manual list
      const total = absentRecords.length;
      const paginatedRecords = absentRecords.slice(offset, offset + parseInt(limit));

      return res.json({
        success: true,
        attendances: paginatedRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      });
    }

    // Standard behavior for other statuses
    const attendances = await Attendance.findAndCountAll({
      where: whereClause,
      include: [
        userInclude,
        {
          model: Break,
          as: 'breaks',
          required: false
        }
      ],
      order: [['date', 'DESC'], ['clockIn', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      attendances: attendances.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: attendances.count,
        pages: Math.ceil(attendances.count / limit)
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