// backend/models/Break.js - Break model definition
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Break = sequelize.define('Break', {
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
  attendanceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Attendances',
      key: 'id'
    }
  },
  breakStart: {
    type: DataTypes.DATE,
    allowNull: false
  },
  breakEnd: {
    type: DataTypes.DATE,
    allowNull: true
  },
  breakType: {
    type: DataTypes.ENUM('lunch', 'coffee', 'personal', 'meeting'),
    defaultValue: 'lunch'
  },
  totalBreakTime: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Break;