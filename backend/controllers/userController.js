// backend/controllers/userController.js - User management controller
const { User } = require('../models');
const { Op } = require('sequelize');
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

    const users = await User.findAndCountAll({
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

    res.json({
      success: true,
      users: users.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.count,
        pages: Math.ceil(users.count / limit)
      }
    });
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
    const departments = await User.findAll({
      attributes: [
        [Sequelize.fn('DISTINCT', Sequelize.col('department')), 'department']
      ],
      where: {
        department: { [Op.not]: null }
      },
      order: [['department', 'ASC']]
    });

    const departmentList = departments.map(d => d.department).filter(Boolean);

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