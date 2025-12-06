// backend/scripts/add-today-attendance.js - Add attendance for today
const { User, Attendance } = require('../models');
const moment = require('moment');

const addTodayAttendance = async () => {
    try {
        console.log('Adding attendance records for today...');

        const today = moment().format('YYYY-MM-DD');

        // Get all active users
        const users = await User.findAll({
            where: { isActive: true }
        });

        console.log(`Found ${users.length} active users`);

        // Create attendance for each user
        for (const user of users) {
            // Check if attendance already exists for today
            const existingAttendance = await Attendance.findOne({
                where: {
                    userId: user.id,
                    date: today
                }
            });

            if (existingAttendance) {
                console.log(`Attendance already exists for ${user.name} today`);
                continue;
            }

            // 80% chance of being present
            if (Math.random() > 0.2) {
                const clockIn = moment().subtract(Math.floor(Math.random() * 4), 'hours').toDate();
                const clockOut = Math.random() > 0.5 ? moment(clockIn).add(8 + Math.random() * 2, 'hours').toDate() : null;
                const totalHours = clockOut ? moment(clockOut).diff(moment(clockIn), 'hours', true) : null;

                await Attendance.create({
                    userId: user.id,
                    clockIn,
                    clockOut,
                    date: today,
                    totalHours,
                    status: 'present',
                    isApproved: true
                });

                console.log(`✓ Added attendance for ${user.name} - ${totalHours ? totalHours.toFixed(2) + 'h' : 'Still clocked in'}`);
            } else {
                console.log(`✗ ${user.name} marked absent today`);
            }
        }

        console.log('\n=== Today\'s Attendance Added Successfully ===\n');

    } catch (error) {
        console.error('Error adding today\'s attendance:', error);
    } finally {
        process.exit();
    }
};

// Run if executed directly
if (require.main === module) {
    addTodayAttendance();
}

module.exports = addTodayAttendance;
