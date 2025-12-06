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
    console.log('getAttendanceReport called:', { startDate, endDate, department, format });

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

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

    // Calculate total days in the date range
    const start = moment(startDate);
    const end = moment(endDate);
    const totalDaysInRange = end.diff(start, 'days') + 1;

    // Process data for report
    const processedData = reportData.map(user => {
      const attendances = (user.attendances || []).filter(a => a);
      const totalDays = attendances.length;
      const presentDays = attendances.filter(a => a && a.status === 'present').length;
      const absentDays = attendances.filter(a => a && a.status === 'absent').length;
      const lateDays = attendances.filter(a => a && a.status === 'late').length;

      // If employee has no attendance records, count all days as absent
      const actualAbsentDays = totalDays === 0 ? totalDaysInRange : absentDays;

      const totalHours = attendances.reduce((sum, a) => sum + (a && a.totalHours || 0), 0);
      const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

      const totalBreakTime = attendances.reduce((sum, a) => {
        return sum + (a && a.breaks || []).reduce((breakSum, b) => breakSum + (b && b.totalBreakTime || 0), 0);
      }, 0);

      return {
        employee: user.name,
        email: user.email,
        department: user.department,
        position: user.position,
        totalDays: totalDays === 0 ? totalDaysInRange : totalDays,
        presentDays,
        absentDays: actualAbsentDays,
        lateDays,
        totalHours: totalHours.toFixed(2),
        averageHours: averageHours.toFixed(2),
        totalBreakTime: totalBreakTime.toFixed(2),
        attendanceRate: totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0
      };
    });

    if (format === 'csv') {
      console.log('Generating CSV report...');
      console.log('Generating CSV report...');
      const uploadDir = path.resolve(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const csvPath = path.join(uploadDir, `attendance_report_${Date.now()}.csv`);
      const ws = fs.createWriteStream(csvPath);

      csv.write(processedData, { headers: true })
        .pipe(ws)
        .on('finish', () => {
          res.download(csvPath, 'attendance_report.csv', (err) => {
            if (err) {
              console.error('Download error:', err);
              fs.unlinkSync(csvPath);
              next(err);
            } else {
              fs.unlinkSync(csvPath);
            }
          });
        });
    } else if (format === 'pdf') {
      const uploadDir = path.resolve(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const pdfPath = path.join(uploadDir, `attendance_report_${Date.now()}.pdf`);
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
      const uploadDir = path.resolve(__dirname, '../uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const csvPath = path.join(uploadDir, `leave_report_${Date.now()}.csv`);
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
    console.log('--- GET DASHBOARD STATS REQUEST ---');
    console.log('User:', req.user.id, req.user.role);

    const today = moment().format('YYYY-MM-DD');
    const thisMonth = moment().format('YYYY-MM');

    let userWhereClause = {};

    // Authorization check
    if (req.user.role === 'manager') {
      userWhereClause.managerId = req.user.id;
    } else if (req.user.role === 'employee') {
      userWhereClause.id = req.user.id;
    }
    console.log('UserWhereClause:', JSON.stringify(userWhereClause));

    // Get total employees
    const totalEmployees = await User.count({
      where: { ...userWhereClause, isActive: true }
    });
    console.log('Total Employees Found:', totalEmployees);

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

    const presentToday = todayAttendance.filter(a => ['present', 'late', 'early_leave'].includes(a.status)).length;
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

    const totalHoursThisMonth = monthAttendance.reduce((sum, a) => sum + (parseFloat(a.totalHours) || 0), 0);

    // Calculate average hours per day
    const distinctDays = [...new Set(monthAttendance.map(a => a.date))].length;
    const avgHoursPerDay = distinctDays > 0 ? totalHoursThisMonth / distinctDays : 0;

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
      where: userWhereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name']
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      stats: {
        totalEmployees,
        presentToday,
        absentToday,
        pendingLeaves,
        attendanceRate: totalEmployees > 0 ? ((presentToday / totalEmployees) * 100).toFixed(0) : 0,
        totalHoursThisMonth: Number(totalHoursThisMonth).toFixed(2),
        avgHoursPerDay: Number(avgHoursPerDay).toFixed(2)
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