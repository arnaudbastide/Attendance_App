// backend/utils/validators.js - Input validation utilities
const Joi = require('joi');

const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  });
  return schema.validate(data);
};

const validateRegister = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.forbidden(),
    department: Joi.string().max(50).optional(),
    position: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).optional(),
    managerId: Joi.forbidden()
  }).options({
    stripUnknown: true,
    abortEarly: false
  });
  return schema.validate(data);
};

const validateUserUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    department: Joi.string().max(50).optional(),
    position: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).optional(),
    role: Joi.string().valid('admin', 'manager', 'employee').optional(),
    managerId: Joi.string().uuid().optional(),
    isActive: Joi.boolean().optional()
  });
  return schema.validate(data);
};

const validateAttendance = (data) => {
  const schema = Joi.object({
    location: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
      address: Joi.string().optional()
    }).optional(),
    notes: Joi.string().max(500).optional()
  });
  return schema.validate(data);
};

const validateLeaveRequest = (data) => {
  const schema = Joi.object({
    leaveType: Joi.string().valid('annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'unpaid').required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    reason: Joi.string().min(10).max(1000).required(),
    attachment: Joi.string().optional()
  });
  return schema.validate(data);
};

const validateLeaveApproval = (data) => {
  const schema = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required(),
    comments: Joi.string().max(500).optional()
  });
  return schema.validate(data);
};

const validateBreak = (data) => {
  const schema = Joi.object({
    breakType: Joi.string().valid('lunch', 'coffee', 'personal', 'meeting').optional(),
    notes: Joi.string().max(200).optional()
  });
  return schema.validate(data);
};

module.exports = {
  validateLogin,
  validateRegister,
  validateUserUpdate,
  validateAttendance,
  validateLeaveRequest,
  validateLeaveApproval,
  validateBreak
};