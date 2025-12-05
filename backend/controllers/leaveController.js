// backend/controllers/leaveController.js - Leave management controller
const { Leave, User } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const createLeaveRequest = async (req, res, next) => {
  try {
    const { leaveType, startDate, endDate, reason, attachment } = req.body;
    const userId = req.user.id;

    // Validate dates
    if (moment(startDate).isAfter(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be after end date'
      });
    }

    // Calculate total days
    const totalDays = moment(endDate).diff(moment(startDate), 'days') + 1;

    // Check for overlapping leave requests
    const overlappingLeave = await Leave.findOne({
      where: {
        userId,
        status: { [Op.in]: ['pending', 'approved'] },
        [Op.or]: [
          {
            startDate: { [Op.between]: [startDate, endDate] }
          },
          {
            endDate: { [Op.between]: [startDate, endDate] }
          },
          {
            [Op.and]: [
              { startDate: { [Op.lte]: startDate } },
              { endDate: { [Op.gte]: endDate } }
            ]
          }
        ]
      }
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'Leave request overlaps with existing leave'
      });
    }

    const leave = await Leave.create({
      userId,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      attachment: attachment || null
    });

    // Populate with user data
    const leaveWithUser = await Leave.findByPk(leave.id, {
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
      message: 'Leave request created successfully',
      leave: leaveWithUser
    });
  } catch (error) {
    next(error);
  }
};

const getMyLeaves = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    const whereClause = { userId };
    if (status) {
      whereClause.status = status;
    }

    const leaves = await Leave.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'department', 'position']
        }
      ],
      order: [['requestedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      leaves: leaves.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: leaves.count,
        pages: Math.ceil(leaves.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getPendingLeaves = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { status: 'pending' };

    // Managers can only see their team's leaves
    if (req.user.role === 'manager') {
      whereClause.userId = {
        [Op.in]: sequelize.literal(`(SELECT id FROM "Users" WHERE "managerId" = '${req.user.id}')`)
      };
    }

    const leaves = await Leave.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'department', 'position']
        }
      ],
      order: [['requestedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      leaves: leaves.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: leaves.count,
        pages: Math.ceil(leaves.count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const approveLeave = async (req, res, next) => {
  try {
    const { leaveId } = req.params;
    const { status, comments } = req.body;
    const approvedBy = req.user.id;

    const leave = await Leave.findByPk(leaveId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'department', 'position', 'managerId']
        }
      ]
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Authorization check
    if (req.user.role === 'manager' && leave.user.managerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only approve leaves for your team members'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave request has already been processed'
      });
    }

    await leave.update({
      status,
      approvedBy,
      approvedAt: new Date(),
      comments: comments || null
    });

    res.json({
      success: true,
      message: `Leave request ${status} successfully`,
      leave
    });
  } catch (error) {
    next(error);
  }
};

const cancelLeave = async (req, res, next) => {
  try {
    const { leaveId } = req.params;
    const userId = req.user.id;

    const leave = await Leave.findByPk(leaveId);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only cancel your own leave requests'
      });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leave requests can be cancelled'
      });
    }

    await leave.update({
      status: 'cancelled'
    });

    res.json({
      success: true,
      message: 'Leave request cancelled successfully',
      leave
    });
  } catch (error) {
    next(error);
  }
};

const getLeaveBalance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const currentYear = moment().year();

    // Calculate used leave days
    const usedLeaves = await Leave.findAll({
      where: {
        userId,
        leaveType: 'annual',
        status: 'approved',
        startDate: {
          [Op.gte]: `${currentYear}-01-01`,
          [Op.lte]: `${currentYear}-12-31`
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalDays')), 'totalUsedDays']
      ]
    });

    const totalUsedDays = usedLeaves[0].dataValues.totalUsedDays || 0;
    const totalAnnualLeave = 21; // Standard annual leave
    const remainingDays = totalAnnualLeave - totalUsedDays;

    res.json({
      success: true,
      leaveBalance: {
        totalAnnualLeave,
        usedDays: parseInt(totalUsedDays),
        remainingDays,
        currentYear
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLeaveRequest,
  getMyLeaves,
  getPendingLeaves,
  approveLeave,
  cancelLeave,
  getLeaveBalance
};