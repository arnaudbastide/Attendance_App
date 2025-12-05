// backend/controllers/reportController.js - Report generation controller
const { Attendance, Leave, User, Break } = require('../models');
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const PDFDocument = require('pdfkit');

const getAttendanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department, format = 'json' } = req.query;

    let whereClause = {};
    
    if (department) {
      whereClause.department = department;
    }

    const attendanceWhere = {
      date: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Authorization check
    if (req.user.role === 'manager') {
      whereClause.managerId = req.user.id;
    } else if (req.user.role === 'employee') {
      whereClause.id = req.user.id;
    }

    const reportData = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'department', 'position'],
      include: [
        {
          model: Attendance,
          as: 'attendances',
          where: attendanceWhere,
          required: false,
          include: [
            {
              model: Break,
              as: 'breaks'
            }
          ]
        }
      ],
      order: [['name', 'ASC']]
    });

    // Process data for report
    const processedData = reportData.map(user => {
      const totalDays = user.attendances.length;
      const presentDays = user.attendances.filter(a => a.status === 'present').length;
      const absentDays = user.attendances.filter(a => a.status === 'absent').length;
      const lateDays = user.attendances.filter(a => a.status === 'late').length;
      
      const totalHours = user.attendances.reduce((sum, a) => sum + (a.totalHours || 0), 0);
      const averageHours = totalDays > 0 ? totalHours / totalDays : 0;
      
      const totalBreakTime = user.attendances.reduce((sum, a) => {
        return sum + a.breaks.reduce((breakSum, b) => breakSum + (b.totalBreakTime || 0), 0);
      }, 0);

      return {
        employee: user.name,
        email: user.email,
        department: user.department,
        position: user.position,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        totalHours: totalHours.toFixed(2),
        averageHours: averageHours.toFixed(2),
        totalBreakTime: totalBreakTime.toFixed(2),
        attendanceRate: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0
      };
    });

    if (format === 'csv') {
      const csvPath = path.join(__dirname, '..', 'uploads', `attendance_report_${Date.now()}.csv`);
      const ws = fs.createWriteStream(csvPath);
      
      csv.write(processedData, { headers: true })
        .pipe(ws)
        .on('finish', () => {
          res.download(csvPath, 'attendance_report.csv', (err) => {
            if (err) {
              fs.unlinkSync(csvPath);
              next(err);
            } else {
              fs.unlinkSync(csvPath);
            }
          });
        });
    } else if (format === 'pdf') {
      const pdfPath = path.join(__dirname, '..', 'uploads', `attendance_report_${Date.now()}.pdf`);
      const doc = new PDFDocument();
      
      doc.pipe(fs.createWriteStream(pdfPath));
      
      doc.fontSize(20).text('Attendance Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`);
      doc.moveDown();
      
      processedData.forEach((row, index) => {
        doc.fontSize(10);
        doc.text(`Employee: ${row.employee}`);
        doc.text(`Department: ${row.department}`);
        doc.text(`Total Days: ${row.totalDays}`);
        doc.text(`Present Days: ${row.presentDays}`);
        doc.text(`Attendance Rate: ${row.attendanceRate}%`);
        doc.moveDown();
        
        if (index % 3 === 2) {
          doc.addPage();
        }
      });
      
      doc.end();
      
      doc.on('finish', () => {
        res.download(pdfPath, 'attendance_report.pdf', (err) => {
          if (err) {
            fs.unlinkSync(pdfPath);
            next(err);
          } else {
            fs.unlinkSync(pdfPath);
          }
        });
      });
    } else {
      res.json({
        success: true,
        report: processedData,
        period: { startDate, endDate }
      });
    }
  } catch (error) {
    next(error);
  }
};

const getLeaveReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    let whereClause = {
      status: 'approved'
    };

    if (startDate && endDate) {
      whereClause.startDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Authorization check
    if (req.user.role === 'manager') {
      whereClause.userId = {
        [Op.in]: Sequelize.literal(`(SELECT id FROM "Users" WHERE "managerId" = '${req.user.id}')`)
      };
    } else if (req.user.role === 'employee') {
      whereClause.userId = req.user.id;
    }

    const leaves = await Leave.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'department', 'position']
        }
      ],
      order: [['startDate', 'ASC']]
    });

    // Process data for report
    const processedData = leaves.map(leave => ({
      employee: leave.user.name,
      email: leave.user.email,
      department: leave.user.department,
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays: leave.totalDays,
      reason: leave.reason,
      approvedAt: leave.approvedAt
    }));

    // Group by department
    const departmentStats = {};
    processedData.forEach(leave => {
      if (!departmentStats[leave.department]) {
        departmentStats[leave.department] = {
          totalLeaves: 0,
          totalDays: 0,
          leaveTypes: {}
        };
      }
      
      departmentStats[leave.department].totalLeaves++;
      departmentStats[leave.department].totalDays += leave.totalDays;
      
      if (!departmentStats[leave.department].leaveTypes[leave.leaveType]) {
        departmentStats[leave.department].leaveTypes[leave.leaveType] = 0;
      }
      departmentStats[leave.department].leaveTypes[leave.leaveType]++;
    });

    if (format === 'csv') {
      const csvPath = path.join(__dirname, '..', 'uploads', `leave_report_${Date.now()}.csv`);
      const ws = fs.createWriteStream(csvPath);
      
      csv.write(processedData, { headers: true })
        .pipe(ws)
        .on('finish', () => {
          res.download(csvPath, 'leave_report.csv', (err) => {
            if (err) {
              fs.unlinkSync(csvPath);
              next(err);
            } else {
              fs.unlinkSync(csvPath);
            }
          });
        });
    } else {
      res.json({
        success: true,
        report: processedData,
        departmentStats,
        period: { startDate, endDate }
      });
    }
  } catch (error) {
    next(error);
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const thisMonth = moment().format('YYYY-MM');

    let userWhereClause = {};
    
    // Authorization check
    if (req.user.role === 'manager') {
      userWhereClause.managerId = req.user.id;
    } else if (req.user.role === 'employee') {
      userWhereClause.id = req.user.id;
    }

    // Get total employees
    const totalEmployees = await User.count({
      where: { ...userWhereClause, isActive: true }
    });

    // Get today's attendance
    const todayAttendance = await Attendance.findAll({
      where: { date: today },
      include: [
        {
          model: User,
          as: 'user',
          where: userWhereClause,
          attributes: ['id', 'name', 'department']
        }
      ]
    });

    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const absentToday = totalEmployees - presentToday;

    // Get this month's stats
    const monthStart = moment().startOf('month').format('YYYY-MM-DD');
    const monthEnd = moment().endOf('month').format('YYYY-MM-DD');

    const monthAttendance = await Attendance.findAll({
      where: {
        date: {
          [Op.between]: [monthStart, monthEnd]
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          where: userWhereClause,
          attributes: ['id', 'name', 'department']
        }
      ]
    });

    const totalHoursThisMonth = monthAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0);
    const avgHoursPerDay = monthAttendance.length > 0 ? totalHoursThisMonth / monthAttendance.length : 0;

    // Get pending leave requests
    const pendingLeaves = await Leave.count({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'user',
          where: userWhereClause,
          attributes: ['id']
        }
      ]
    });

    // Get recent activities (last 5)
    const recentActivities = await Attendance.findAll({
      where: {
        date: {
          [Op.gte]: moment().subtract(7, 'days').format('YYYY-MM-DD')
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          where: userWhereClause,
          attributes: ['id', 'name', 'department']
        }
      ],
      order: [['clockIn', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      stats: {
        totalEmployees,
        presentToday,
        absentToday,
        totalHoursThisMonth: totalHoursThisMonth.toFixed(2),
        avgHoursPerDay: avgHoursPerDay.toFixed(2),
        pendingLeaves,
        attendanceRate: totalEmployees > 0 ? ((presentToday / totalEmployees) * 100).toFixed(2) : 0
      },
      recentActivities
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendanceReport,
  getLeaveReport,
  getDashboardStats
};