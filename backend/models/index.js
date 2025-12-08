// backend/models/index.js - Model associations
const User = require('./User');
const Attendance = require('./Attendance');
const Leave = require('./Leave');
const Break = require('./Break');
const sequelize = require('../config/database');

// Define associations
User.hasMany(Attendance, { foreignKey: 'userId', as: 'attendances' });
Attendance.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Leave, { foreignKey: 'userId', as: 'leaves' });
Leave.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Break, { foreignKey: 'userId', as: 'breaks' });
Break.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Attendance.hasMany(Break, { foreignKey: 'attendanceId', as: 'breaks' });
Break.belongsTo(Attendance, { foreignKey: 'attendanceId', as: 'attendance' });

// Manager-Employee relationship
User.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });
User.hasMany(User, { foreignKey: 'managerId', as: 'subordinates' });

module.exports = {
  sequelize,
  User,
  Attendance,
  Leave,
  Break
};