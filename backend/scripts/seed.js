// backend/scripts/seed.js - Database seeding script
const { User, Attendance, Leave, Break } = require('../models');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const sequelize = require('../config/database');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Create admin user
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@roc4tech.com',
      password: 'admin123',
      role: 'admin',
      department: 'IT',
      position: 'System Administrator',
      isActive: true
    });

    // Create manager
    const manager = await User.create({
      name: 'John Manager',
      email: 'john.manager@roc4tech.com',
      password: 'manager123',
      role: 'manager',
      department: 'Engineering',
      position: 'Engineering Manager',
      isActive: true
    });

    // Create employees
    const employees = await Promise.all([
      User.create({
        name: 'Alice Developer',
        email: 'alice@roc4tech.com',
        password: 'employee123',
        role: 'employee',
        department: 'Engineering',
        position: 'Senior Developer',
        managerId: manager.id,
        isActive: true
      }),
      User.create({
        name: 'Bob Designer',
        email: 'bob@roc4tech.com',
        password: 'employee123',
        role: 'employee',
        department: 'Design',
        position: 'UI/UX Designer',
        isActive: true
      }),
      User.create({
        name: 'Charlie Analyst',
        email: 'charlie@roc4tech.com',
        password: 'employee123',
        role: 'employee',
        department: 'Engineering',
        position: 'Data Analyst',
        managerId: manager.id,
        isActive: true
      })
    ]);

    console.log('Users created successfully');

    // Create attendance records for the past 30 days
    const allUsers = [admin, manager, ...employees];
    const attendanceRecords = [];

    for (let i = 0; i < 30; i++) {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');

      for (const user of allUsers) {
        const rand = Math.random();

        // 70% present, 10% late, 10% early_leave, 5% on_leave, 5% absent
        if (rand < 0.70) {
          // Present - normal hours
          const clockIn = moment(date).add(8 + Math.random() * 0.5, 'hours').toDate();
          const clockOut = moment(clockIn).add(8 + Math.random() * 2, 'hours').toDate();
          const totalHours = moment(clockOut).diff(moment(clockIn), 'hours', true);

          const attendance = await Attendance.create({
            userId: user.id,
            clockIn,
            clockOut,
            date,
            totalHours,
            status: 'present',
            isApproved: true
          });

          attendanceRecords.push(attendance);

          // Add some breaks
          if (Math.random() > 0.5) {
            await Break.create({
              userId: user.id,
              attendanceId: attendance.id,
              breakStart: moment(clockIn).add(4, 'hours').toDate(),
              breakEnd: moment(clockIn).add(5, 'hours').toDate(),
              breakType: 'lunch',
              totalBreakTime: 1
            });
          }
        } else if (rand < 0.80) {
          // Late - clock in after 9:30 AM
          const clockIn = moment(date).add(9.5 + Math.random() * 2, 'hours').toDate();
          const clockOut = moment(clockIn).add(8, 'hours').toDate();
          const totalHours = moment(clockOut).diff(moment(clockIn), 'hours', true);

          const attendance = await Attendance.create({
            userId: user.id,
            clockIn,
            clockOut,
            date,
            totalHours,
            status: 'late',
            isApproved: true
          });

          attendanceRecords.push(attendance);
        } else if (rand < 0.90) {
          // Early leave - clock out before 5 PM
          const clockIn = moment(date).add(8, 'hours').toDate();
          const clockOut = moment(clockIn).add(4 + Math.random() * 2, 'hours').toDate();
          const totalHours = moment(clockOut).diff(moment(clockIn), 'hours', true);

          const attendance = await Attendance.create({
            userId: user.id,
            clockIn,
            clockOut,
            date,
            totalHours,
            status: 'early_leave',
            isApproved: true
          });

          attendanceRecords.push(attendance);
        } else if (rand < 0.95) {
          // On leave - create attendance record with on_leave status
          const attendance = await Attendance.create({
            userId: user.id,
            clockIn: moment(date).add(8, 'hours').toDate(),
            clockOut: null,
            date,
            totalHours: 0,
            status: 'on_leave',
            isApproved: true
          });

          attendanceRecords.push(attendance);
        }
        // else: 5% chance of no record (absent - no attendance record created)
      }
    }

    console.log('Attendance records created successfully');

    // Create some leave requests
    const leaveRequests = [
      {
        userId: employees[0].id,
        leaveType: 'annual',
        startDate: moment().add(7, 'days').format('YYYY-MM-DD'),
        endDate: moment().add(11, 'days').format('YYYY-MM-DD'),
        totalDays: 5,
        reason: 'Family vacation planned for long time',
        status: 'pending'
      },
      {
        userId: employees[1].id,
        leaveType: 'sick',
        startDate: moment().subtract(3, 'days').format('YYYY-MM-DD'),
        endDate: moment().subtract(1, 'days').format('YYYY-MM-DD'),
        totalDays: 3,
        reason: 'Flu and fever, needed rest',
        status: 'approved',
        approvedBy: manager.id,
        approvedAt: new Date()
      },
      {
        userId: employees[2].id,
        leaveType: 'personal',
        startDate: moment().add(14, 'days').format('YYYY-MM-DD'),
        endDate: moment().add(14, 'days').format('YYYY-MM-DD'),
        totalDays: 1,
        reason: 'Personal appointment',
        status: 'pending'
      }
    ];

    await Promise.all(leaveRequests.map(leave => Leave.create(leave)));

    console.log('Leave requests created successfully');

    console.log('\n=== SEEDING COMPLETED ===');
    console.log('Admin login: admin@roc4tech.com / admin123');
    console.log('Manager login: john.manager@roc4tech.com / manager123');
    console.log('Employee login: alice@roc4tech.com / employee123');
    console.log('========================\n');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await sequelize.close();
  }
};

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;