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

    // Format dates to YYYY-MM-DD to avoid SQL/Sequelize issues
    const formattedStartDate = moment(startDate, ['YYYY-MM-DD', 'MM/DD/YYYY']).format('YYYY-MM-DD');
    const formattedEndDate = moment(endDate, ['YYYY-MM-DD', 'MM/DD/YYYY']).format('YYYY-MM-DD');

    console.log(`[Report Debug] Formatted Date Range: ${formattedStartDate} to ${formattedEndDate}`);

    const attendanceWhere = {
      date: {
        [Op.between]: [formattedStartDate, formattedEndDate]
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
    const start = moment(formattedStartDate);
    const end = moment(formattedEndDate);
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

      const totalHours = attendances.reduce((sum, a) => sum + (parseFloat(a.totalHours) || 0), 0);
      const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

      const totalBreakTime = attendances.reduce((sum, a) => {
        return sum + (a && a.breaks || []).reduce((breakSum, b) => breakSum + (parseFloat(b.totalBreakTime) || 0), 0);
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

    // Calculate Daily Trend Data for Chart
    const trendMap = new Map();
    const dateIterator = moment(formattedStartDate);
    const endDateObj = moment(formattedEndDate);

    // Initialize map with all dates in range
    while (dateIterator.isSameOrBefore(endDateObj)) {
      trendMap.set(dateIterator.format('YYYY-MM-DD'), {
        name: dateIterator.format('MMM DD'),
        date: dateIterator.format('YYYY-MM-DD'),
        present: 0,
        absent: 0
      });
      dateIterator.add(1, 'days');
    }

    // Populate trend data
    reportData.forEach(user => {
      const attendances = user.attendances || [];
      attendances.forEach(a => {
        const dateStr = a.date; // already YYYY-MM-DD from DB or likely matches
        if (trendMap.has(dateStr)) {
          const entry = trendMap.get(dateStr);
          if (a.status === 'present' || a.status === 'late' || a.status === 'early_leave') {
            entry.present++;
          } else {
            entry.absent++; // Simplified absent count
          }
        }
      });
    });

    const chartData = Array.from(trendMap.values());

    // Calculate Department Distribution for Pie Chart
    const deptMap = {};
    reportData.forEach(user => {
      if (user.department) {
        if (!deptMap[user.department]) {
          deptMap[user.department] = 0;
        }
        // Count total present days contributed by this department
        const presentCount = (user.attendances || []).filter(a => ['present', 'late', 'early_leave'].includes(a.status)).length;
        deptMap[user.department] += presentCount;
      }
    });

    const departmentStats = Object.keys(deptMap).map((dept, index) => ({
      name: dept,
      value: deptMap[dept],
      color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88'][index % 5]
    })).filter(d => d.value > 0);

    if (format === 'csv') {
      // ... (CSV generation logic remains same, mostly)
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

      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

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

      stream.on('finish', () => {
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
        chartData,
        departmentStats,
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
    const deptMap = {};
    processedData.forEach(leave => {
      const dept = leave.department || 'Unknown';
      if (!deptMap[dept]) {
        deptMap[dept] = 0;
      }
      deptMap[dept]++;
    });

    const departmentStats = Object.keys(deptMap).map((dept, index) => ({
      name: dept,
      value: deptMap[dept],
      color: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88'][index % 5]
    })).filter(d => d.value > 0);

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

    const presentRecords = todayAttendance.filter(a => ['present', 'late', 'early_leave'].includes(a.status));
    const presentToday = new Set(presentRecords.map(a => a.userId)).size;

    // Also consider users on leave as NOT absent if logic requires, but typically Absent = Total - Present - OnLeave?
    // Current logic: Absent = Total - Present.
    // If someone is On Leave, they are NOT Present. So they are counted as Absent.
    // Ideally, Dashboard Stats should break down: Present, Absent, On Leave.
    // But sticking to the existing variable 'absentToday', let's fix the negative number first.
    // If user is On Leave, should they be 'Absent'? Techncially yes, they are absent from work.
    // But if we want accurate 'Unplanned Absent', we should subtract On Leave.
    // However, the critical fix is preventing > Total count.

    const absentToday = Math.max(0, totalEmployees - presentToday);

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
      include: [
        {
          model: User,
          as: 'user',
          where: userWhereClause,
          attributes: ['name']
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 5
    });

    // Calculate weekly data for chart
    const monthlyChartData = [
      { name: 'Week 1', hours: 0 },
      { name: 'Week 2', hours: 0 },
      { name: 'Week 3', hours: 0 },
      { name: 'Week 4', hours: 0 },
      { name: 'Week 5', hours: 0 }
    ];

    monthAttendance.forEach(record => {
      const day = moment(record.date).date();
      const weekIndex = Math.floor((day - 1) / 7);
      if (monthlyChartData[weekIndex]) {
        monthlyChartData[weekIndex].hours += parseFloat(record.totalHours) || 0;
      }
    });

    // Round hours for cleaner JSON
    monthlyChartData.forEach(d => d.hours = Number(d.hours.toFixed(1)));

    // Remove Week 5 if empty (often empty for 28-day months or just depending on start)
    const finalChartData = monthlyChartData.filter(d => d.hours > 0 || d.name !== 'Week 5');

    // Calculate monthly totals
    const presentMonthRecords = monthAttendance.filter(a => ['present', 'late', 'early_leave'].includes(a.status));
    const presentMonth = presentMonthRecords.length;
    // Absent month estimate: (Total Employees * Work Days So Far) - Present Records
    // Using distinct days in DB as proxy for "Work Days So Far".
    const absentMonth = Math.max(0, (totalEmployees * distinctDays) - presentMonth);

    res.json({
      success: true,
      stats: {
        totalEmployees,
        presentToday,
        absentToday,
        presentMonth,
        absentMonth,
        pendingLeaves,
        attendanceRate: totalEmployees > 0 ? ((presentToday / totalEmployees) * 100).toFixed(0) : 0,
        totalHoursThisMonth: Number(totalHoursThisMonth).toFixed(2),
        avgHoursPerDay: Number(avgHoursPerDay).toFixed(2),
        monthlyChartData: finalChartData
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