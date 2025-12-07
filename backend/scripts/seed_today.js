// backend/scripts/seed_today.js
const { User, Attendance, Leave, Break } = require('../models');
const moment = require('moment');
const sequelize = require('../config/database');

const seedToday = async () => {
    try {
        console.log('🌱 Seeding data for TODAY...');

        // Get users
        const users = await User.findAll();
        console.log(`Found ${users.length} users.`);

        const today = moment().format('YYYY-MM-DD');
        console.log(`Target Date: ${today}`);

        // Clear existing for today to avoid duplicates
        await Attendance.destroy({ where: { date: today } });
        console.log('Cleared existing attendance for today.');

        for (const user of users) {
            let status = 'present';
            let clockIn = moment().hours(8).minutes(30).toDate();
            let clockOut = moment().hours(17).minutes(30).toDate();
            let totalHours = 9;

            // Custom Logic per User Name/Email
            if (user.email.includes('admin') && user.email !== 'testadmin@roc4tech.com') {
                // System Admin: Present, Long hours
                clockIn = moment().hours(7).minutes(55).toDate();
                clockOut = moment().hours(19).minutes(10).toDate();
                totalHours = 11.25;
                status = 'present';
            }
            else if (user.email.includes('john')) {
                // Manager: Present
                clockIn = moment().hours(8).minutes(50).toDate();
                clockOut = moment().hours(18).minutes(0).toDate();
                status = 'present';
            }
            else if (user.email.includes('alice')) {
                // Alice: Late
                clockIn = moment().hours(10).minutes(15).toDate(); // Late (after 9:30)
                clockOut = moment().hours(18).minutes(30).toDate();
                status = 'late';
                totalHours = 8.25;
            }
            else if (user.email.includes('bob')) {
                // Bob: Early Leave
                clockIn = moment().hours(9).minutes(0).toDate();
                clockOut = moment().hours(15).minutes(30).toDate(); // Left early
                status = 'early_leave';
                totalHours = 6.5;
            }
            else if (user.email.includes('charlie')) {
                // Charlie: Absent (Create NO record)
                console.log(`Skipping record for ${user.name} (Absent)`);
                continue;
            }
            else if (user.email.includes('test')) { // Test Admin implies 'test' 
                // Test Admin: On Leave
                status = 'on_leave'; // Or skip attendance and ensure leave record exists
                // Let's create an approved leave record for today instead of attendance
                await Leave.create({
                    userId: user.id,
                    leaveType: 'sick',
                    startDate: today,
                    endDate: today,
                    totalDays: 1,
                    reason: 'Not feeling well',
                    status: 'approved',
                    approvedBy: users[0].id, // Admin approved
                    approvedAt: new Date()
                });
                console.log(`Created Leave for ${user.name}`);
                continue;
            }

            // Create Attendance Record
            await Attendance.create({
                userId: user.id,
                clockIn,
                clockOut,
                date: today,
                totalHours,
                status,
                isApproved: true
            });
            console.log(`Created ${status} record for ${user.name}`);
        }

        console.log('✅ Seeding for today complete.');

    } catch (error) {
        console.error('Error seeding today:', error);
    } finally {
        await sequelize.close();
    }
};

seedToday();
