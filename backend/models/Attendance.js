// backend/models/Attendance.js - Attendance model definition
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  clockIn: {
    type: DataTypes.DATE,
    allowNull: false
  },
  clockOut: {
    type: DataTypes.DATE,
    allowNull: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  locationIn: {
    type: DataTypes.JSON,
    allowNull: true
  },
  locationOut: {
    type: DataTypes.JSON,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late', 'early_leave', 'on_leave'),
    defaultValue: 'present'
  },
  totalHours: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  overtimeHours: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  isApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Attendance;