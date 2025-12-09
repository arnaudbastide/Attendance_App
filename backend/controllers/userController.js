// backend/controllers/userController.js - User management controller
const { User } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { validateUserUpdate } = require('../utils/validators');

const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, department, role } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // Authorization check
    if (req.user.role === 'manager') {
      whereClause.managerId = req.user.id;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (department) {
      whereClause.department = department;
    }

    if (role) {
      whereClause.role = role;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // --- Inject Real-Time Status & Location ---
    try {
      const today = new Date().toISOString().split('T')[0];
      const userIds = users.map(u => u.id);

      // Models might need to be required if not available in scope
      const { Attendance, Leave } = require('../models');

      // 1. Fetch Today's Attendance
      const attendances = await Attendance.findAll({
        where: {
          userId: { [Op.in]: userIds },
          date: today
        },
        order: [['clockIn', 'DESC']]
      });

      // 2. Fetch Active Leaves
      const leaves = await Leave.findAll({
        where: {
          userId: { [Op.in]: userIds },
          status: 'approved',
          [Op.and]: [
            { startDate: { [Op.lte]: today } },
            { endDate: { [Op.gte]: today } }
          ]
        }
      });

      // 3. Map Data
      const usersWithStatus = users.map(user => {
        const userJson = user.toJSON();

        // Default Status
        let status = user.isActive ? 'absent' : 'inactive';
        let lastLocation = null;

        // Leave Check
        const userLeave = leaves.find(l => l.userId === user.id);
        if (userLeave && user.isActive) {
          status = 'on_leave';
        }

        // Attendance Check (Latest record)
        const userAttendances = attendances.filter(a => a.userId === user.id);

        let totalDurationMs = 0; // Duration in milliseconds

        if (userAttendances.length > 0) {
          const latest = userAttendances[0];

          if (!latest.clockOut) {
            status = 'present';
          } else {
            // Clocked out but was present today. logic says 'absent' if not currently in.
            status = 'absent';
          }

          // Location Priority: Out > In (Shows where they left or where they are)
          if (latest.clockOut && latest.locationOut) {
            lastLocation = latest.locationOut;
          } else if (latest.locationIn) {
            lastLocation = latest.locationIn;
          }

          // Calculate Total Hours for today
          userAttendances.forEach(att => {
            const start = new Date(att.clockIn).getTime();
            const end = att.clockOut ? new Date(att.clockOut).getTime() : new Date().getTime();

            if (!isNaN(start) && !isNaN(end) && end > start) {
              totalDurationMs += (end - start);
            }
          });
        }

        // Format duration to "Xh Ym"
        const totalMinutes = Math.floor(totalDurationMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const totalHoursFormatted = `${hours}h ${minutes}m`;

        userJson.currentStatus = status;
        userJson.lastLocation = lastLocation;
        userJson.totalHoursToday = totalHoursFormatted;

        return userJson;
      });

      return res.json({
        success: true,
        users: usersWithStatus,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });

    } catch (innerError) {
      console.error('Error injecting status:', innerError);
      // Fallback if something fails in injection
      return res.json({
        success: true,
        users: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      });
    }

  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    let whereClause = { id: userId };

    // Authorization check
    if (req.user.role === 'manager') {
      whereClause.managerId = req.user.id;
    } else if (req.user.role === 'employee' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own profile'
      });
    }

    const user = await User.findOne({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { error } = validateUserUpdate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    let whereClause = { id: userId };

    // Authorization check
    if (req.user.role === 'manager') {
      whereClause.managerId = req.user.id;
    } else if (req.user.role === 'employee' && userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    const user = await User.findOne({
      where: whereClause
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, email, department, position, phone, role, managerId, isActive } = req.body;

    // Only admins can update role and isActive
    if (req.user.role !== 'admin') {
      delete req.body.role;
      delete req.body.isActive;
    }

    // Only admins and managers can update managerId
    if (req.user.role === 'employee') {
      delete req.body.managerId;
    }

    await user.update({
      name: name || user.name,
      email: email || user.email,
      department: department || user.department,
      position: position || user.position,
      phone: phone || user.phone,
      role: role || user.role,
      managerId: managerId !== undefined ? managerId : user.managerId,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    // Exclude password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User updated successfully',
      user: userResponse
    });
  } catch (error) {
    next(error);
  }
};

const deactivateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Only admins can deactivate users
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can deactivate users'
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ isActive: false });

    res.json({
      success: true,
      message: 'User deactivated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

const getDepartments = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: ['department'],
      where: {
        department: { [Op.not]: null }
      },
      group: ['department'],
      order: [['department', 'ASC']]
    });

    const departmentList = users.map(u => u.department).filter(Boolean);

    res.json({
      success: true,
      departments: departmentList
    });
  } catch (error) {
    next(error);
  }
};

const getManagers = async (req, res, next) => {
  try {
    const managers = await User.findAll({
      where: {
        role: 'manager',
        isActive: true
      },
      attributes: ['id', 'name', 'email', 'department'],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      managers
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deactivateUser,
  getDepartments,
  getManagers
};