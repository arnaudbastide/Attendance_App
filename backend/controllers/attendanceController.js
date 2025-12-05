// backend/controllers/attendanceController.js - Attendance controller
const { Attendance, Break, User } = require('../models');
const moment = require('moment');
const { Op } = require('sequelize');

const clockIn = async (req, res, next) => {
  try {
    const { location, notes } = req.body;
    const userId = req.user.id;
    const today = moment().format('YYYY-MM-DD');

    // Check if already clocked in today
    const existingAttendance = await Attendance.findOne({
      where: {
        userId,
        date: today,
        clockOut: null
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked in today'
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      userId,
      clockIn: new Date(),
      date: today,
      locationIn: location || null,
      notes: notes || null,
      status: 'present'
    });

    // Populate with user data
    const attendanceWithUser = await Attendance.findByPk(attendance.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'department', 'position']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Clocked in successfully',
      attendance: attendanceWithUser
    });
  } catch (error) {
    next(error);
  }
};

const clockOut = async (req, res, next) => {
  try {
    const { location, notes } = req.body;
    const userId = req.user.id;
    const today = moment().format('YYYY-MM-DD');

    // Find today's attendance
    const attendance = await Attendance.findOne({
      where: {
        userId,
        date: today,
        clockOut: null
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No active attendance record found'
      });
    }

    // Calculate total hours
    const clockInTime = moment(attendance.clockIn);
    const clockOutTime = moment();
    const totalHours = clockOutTime.diff(clockInTime, 'hours', true);

    // Update attendance
    await attendance.update({
      clockOut: clockOutTime.toDate(),
      locationOut: location || null,
      notes: notes ? `${attendance.notes || ''} ${notes}` : attendance.notes,
      totalHours: totalHours
    });

    // Populate with user data
    const attendanceWithUser = await Attendance.findByPk(attendance.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'department', 'position']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Clocked out successfully',
      attendance: attendanceWithUser
    });
  } catch (error) {
    next(error);
  }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    const whereClause = { userId };
    
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    const attendances = await Attendance.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'department', 'position']
        },
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

const getTeamAttendance = async (req, res, next) => {
  try {
    const { startDate, endDate, department, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
    // Managers can only see their team's attendance
    if (req.user.role === 'manager') {
      whereClause.managerId = req.user.id;
    }

    if (department) {
      whereClause.department = department;
    }

    if (status) {
      whereClause.status = status;
    }

    const attendances = await Attendance.findAndCountAll({
      where: {
        ...whereClause,
        date: {
          [Op.between]: [startDate || '2020-01-01', endDate || '2030-12-31']
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'department', 'position'],
          where: whereClause
        }
      ],
      order: [['date', 'DESC']],
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

const startBreak = async (req, res, next) => {
  try {
    const { breakType, notes } = req.body;
    const userId = req.user.id;
    const today = moment().format('YYYY-MM-DD');

    // Find today's active attendance
    const attendance = await Attendance.findOne({
      where: {
        userId,
        date: today,
        clockOut: null
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No active attendance record found'
      });
    }

    // Check if there's an ongoing break
    const ongoingBreak = await Break.findOne({
      where: {
        userId,
        attendanceId: attendance.id,
        breakEnd: null
      }
    });

    if (ongoingBreak) {
      return res.status(400).json({
        success: false,
        message: 'Break already in progress'
      });
    }

    const breakRecord = await Break.create({
      userId,
      attendanceId: attendance.id,
      breakStart: new Date(),
      breakType: breakType || 'lunch',
      notes: notes || null
    });

    res.status(201).json({
      success: true,
      message: 'Break started successfully',
      break: breakRecord
    });
  } catch (error) {
    next(error);
  }
};

const endBreak = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = moment().format('YYYY-MM-DD');

    // Find ongoing break
    const ongoingBreak = await Break.findOne({
      where: {
        userId,
        breakEnd: null
      },
      include: [
        {
          model: Attendance,
          as: 'attendance',
          where: { date: today }
        }
      ]
    });

    if (!ongoingBreak) {
      return res.status(400).json({
        success: false,
        message: 'No active break found'
      });
    }

    // Calculate break duration
    const breakStartTime = moment(ongoingBreak.breakStart);
    const breakEndTime = moment();
    const totalBreakTime = breakEndTime.diff(breakStartTime, 'hours', true);

    await ongoingBreak.update({
      breakEnd: breakEndTime.toDate(),
      totalBreakTime: totalBreakTime
    });

    res.json({
      success: true,
      message: 'Break ended successfully',
      break: ongoingBreak
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  clockIn,
  clockOut,
  getMyAttendance,
  getTeamAttendance,
  startBreak,
  endBreak
};