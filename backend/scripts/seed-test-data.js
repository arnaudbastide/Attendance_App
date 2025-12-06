// backend/scripts/seed-test-data.js - Create test data with all attendance statuses for TODAY
const { User, Attendance, Break } = require('../models');
const moment = require('moment');
const sequelize = require('../config/database');

const seedTestData = async () => {
    try {
        console.log('Creating test attendance data for TODAY with all statuses...');

        // Get all existing users
        const users = await User.findAll({ where: { isActive: true } });

        if (users.length === 0) {
            console.log('No users found. Please run the main seed script first: node scripts/seed.js');
            return;
        }

        const today = moment().format('YYYY-MM-DD');
        const statuses = ['present', 'late', 'early_leave', 'on_leave']; // 'absent' = no record

        console.log(`Found ${users.length} users. Creating attendance for ${today}...`);

        // Delete existing attendance for today to avoid duplicates
        await Attendance.destroy({ where: { date: today } });

        // Assign each user a different status
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const statusIndex = i % 5; // Cycle through 5 scenarios (4 statuses + 1 absent)

            console.log(`${user.name}: ${statusIndex === 4 ? 'ABSENT (no record)' : statuses[statusIndex].toUpperCase()}`);

            if (statusIndex === 0) {
                // PRESENT - normal hours with break
                const clockIn = moment(today).add(8, 'hours').toDate();
                const clockOut = moment(clockIn).add(8.5, 'hours').toDate();

                const attendance = await Attendance.create({
                    userId: user.id,
                    clockIn,
                    clockOut,
                    date: today,
                    totalHours: 8.5,
                    status: 'present',
                    isApproved: true
                });

                await Break.create({
                    userId: user.id,
                    attendanceId: attendance.id,
                    breakStart: moment(clockIn).add(4, 'hours').toDate(),
                    breakEnd: moment(clockIn).add(5, 'hours').toDate(),
                    breakType: 'lunch',
                    totalBreakTime: 1
                });
            } else if (statusIndex === 1) {
                // LATE - clock in at 10:30 AM
                const clockIn = moment(today).add(10.5, 'hours').toDate();
                const clockOut = moment(clockIn).add(8, 'hours').toDate();

                await Attendance.create({
                    userId: user.id,
                    clockIn,
                    clockOut,
                    date: today,
                    totalHours: 8,
                    status: 'late',
                    isApproved: true
                });
            } else if (statusIndex === 2) {
                // EARLY LEAVE - clock out at 2 PM
                const clockIn = moment(today).add(8, 'hours').toDate();
                const clockOut = moment(clockIn).add(6, 'hours').toDate();

                await Attendance.create({
                    userId: user.id,
                    clockIn,
                    clockOut,
                    date: today,
                    totalHours: 6,
                    status: 'early_leave',
                    isApproved: true
                });
            } else if (statusIndex === 3) {
                // ON LEAVE
                await Attendance.create({
                    userId: user.id,
                    clockIn: moment(today).add(8, 'hours').toDate(),
                    clockOut: null,
                    date: today,
                    totalHours: 0,
                    status: 'on_leave',
                    isApproved: true
                });
            }
            // statusIndex === 4: ABSENT - no record created
        }

        console.log('\n=== TEST DATA CREATED ===');
        console.log(`Date: ${today}`);
        console.log('All attendance statuses are now represented!');
        console.log('Reload the dashboard to see: Present, Late, Early Leave, On Leave, Absent');
        console.log('========================\n');

    } catch (error) {
        console.error('Error creating test data:', error);
    } finally {
        await sequelize.close();
    }
};

// Run if executed directly
if (require.main === module) {
    seedTestData();
}

module.exports = seedTestData;
