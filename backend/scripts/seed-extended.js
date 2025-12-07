// backend/scripts/seed-extended.js - Extended database seeding script
const { User, Attendance, Leave, Break } = require('../models');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const sequelize = require('../config/database');

const departments = ['Engineering', 'Design', 'Marketing', 'HR', 'Finance', 'Operations'];
const positions = {
    admin: ['CTO', 'VP Engineering', 'VP Operations'],
    manager: ['Engineering Manager', 'Design Manager', 'Marketing Manager', 'HR Manager', 'Finance Manager'],
    employee: ['Senior Developer', 'Junior Developer', 'UI/UX Designer', 'Graphic Designer', 'Marketing Specialist',
        'Content Writer', 'HR Specialist', 'Recruiter', 'Accountant', 'Financial Analyst', 'Operations Coordinator']
};

const leaveTypes = ['annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'unpaid'];

const seedExtendedDatabase = async () => {
    try {
        console.log('Starting extended database seeding...');

        // Create admin user
        const admin = await User.create({
            name: 'System Administrator',
            email: 'admin@roc4tech.com',
            password: 'admin123',
            role: 'admin',
            department: 'IT',
            position: 'CTO',
            isActive: true
        });

        console.log('✓ Admin created');

        // Create multiple managers (one per department)
        const managers = [];
        for (let i = 0; i < departments.length; i++) {
            const dept = departments[i];
            const manager = await User.create({
                name: `${dept} Manager`,
                email: `manager.${dept.toLowerCase()}@roc4tech.com`,
                password: 'manager123',
                role: 'manager',
                department: dept,
                position: `${dept} Manager`,
                isActive: true
            });
            managers.push(manager);
        }

        console.log(`✓ Created ${managers.length} managers`);

        // Create 20 employees across different departments
        const employees = [];
        const employeeNames = [
            'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Eve Adams',
            'Frank Miller', 'Grace Lee', 'Henry Ford', 'Iris West', 'Jack Ryan',
            'Kelly Green', 'Leo King', 'Mary Jane', 'Nathan Drake', 'Olivia Pope',
            'Peter Parker', 'Quinn Fabray', 'Rachel Berry', 'Sam Wilson', 'Tina Turner'
        ];

        for (let i = 0; i < 20; i++) {
            const dept = departments[i % departments.length];
            const manager = managers.find(m => m.department === dept);

            const employee = await User.create({
                name: employeeNames[i],
                email: `employee${i + 1}@roc4tech.com`,
                password: 'employee123',
                role: 'employee',
                department: dept,
                position: positions.employee[i % positions.employee.length],
                managerId: manager.id,
                isActive: i < 18 // 2 inactive employees
            });
            employees.push(employee);
        }

        console.log(`✓ Created ${employees.length} employees`);

        // Create diverse attendance records for the past 60 days
        const allUsers = [admin, ...managers, ...employees];
        let attendanceCount = 0;
        let breakCount = 0;

        for (let i = 0; i < 60; i++) {
            const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
            const isWeekend = moment(date).day() === 0 || moment(date).day() === 6;

            for (const user of allUsers) {
                if (!user.isActive && i < 10) continue; // Inactive users have no recent records

                // Skip weekends for most users (90% skip weekends)
                if (isWeekend && Math.random() < 0.9) continue;

                const rand = Math.random();

                // 85% present, 5% late, 3% early_leave, 2% on_leave, 2% half_day, ~3% absent
                if (rand < 0.85) {
                    // Present - normal hours (7-10 hours)
                    const clockIn = moment(date).add(7 + Math.random() * 2, 'hours').toDate();
                    const workHours = 7 + Math.random() * 3;
                    const clockOut = moment(clockIn).add(workHours, 'hours').toDate();
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

                    attendanceCount++;

                    // Add lunch break (80% chance)
                    if (Math.random() > 0.2) {
                        await Break.create({
                            userId: user.id,
                            attendanceId: attendance.id,
                            breakStart: moment(clockIn).add(4, 'hours').toDate(),
                            breakEnd: moment(clockIn).add(4.5 + Math.random() * 0.5, 'hours').toDate(),
                            breakType: 'lunch',
                            totalBreakTime: 0.5 + Math.random() * 0.5
                        });
                        breakCount++;
                    }

                    // Add coffee break (30% chance)
                    if (Math.random() > 0.7) {
                        await Break.create({
                            userId: user.id,
                            attendanceId: attendance.id,
                            breakStart: moment(clockIn).add(2, 'hours').toDate(),
                            breakEnd: moment(clockIn).add(2.25, 'hours').toDate(),
                            breakType: 'coffee',
                            totalBreakTime: 0.25
                        });
                        breakCount++;
                    }

                } else if (rand < 0.90) {
                    // Late - clock in after 9:30 AM
                    const clockIn = moment(date).add(9.5 + Math.random() * 2, 'hours').toDate();
                    const clockOut = moment(clockIn).add(7 + Math.random() * 2, 'hours').toDate();
                    const totalHours = moment(clockOut).diff(moment(clockIn), 'hours', true);

                    await Attendance.create({
                        userId: user.id,
                        clockIn,
                        clockOut,
                        date,
                        totalHours,
                        status: 'late',
                        isApproved: true
                    });
                    attendanceCount++;

                } else if (rand < 0.93) {
                    // Early leave - clock out before completing full hours
                    const clockIn = moment(date).add(8, 'hours').toDate();
                    const clockOut = moment(clockIn).add(4 + Math.random() * 2, 'hours').toDate();
                    const totalHours = moment(clockOut).diff(moment(clockIn), 'hours', true);

                    await Attendance.create({
                        userId: user.id,
                        clockIn,
                        clockOut,
                        date,
                        totalHours,
                        status: 'early_leave',
                        isApproved: true
                    });
                    attendanceCount++;

                } else if (rand < 0.95) {
                    // On leave - create attendance record with on_leave status
                    // Note: clockIn cannot be null per schema, so we set it to start of day
                    await Attendance.create({
                        userId: user.id,
                        clockIn: moment(date).add(9, 'hours').toDate(), // Set to 9 AM
                        clockOut: moment(date).add(9, 'hours').toDate(), // Set to 9 AM (0 hours)
                        date,
                        totalHours: 0,
                        status: 'on_leave',
                        isApproved: true
                    });
                    attendanceCount++;

                } else if (rand < 0.97) {
                    // Half day - 4 hours
                    const clockIn = moment(date).add(8, 'hours').toDate();
                    const clockOut = moment(clockIn).add(4, 'hours').toDate();
                    const totalHours = 4;

                    await Attendance.create({
                        userId: user.id,
                        clockIn,
                        clockOut,
                        date,
                        totalHours,
                        status: 'present',
                        isApproved: true,
                        notes: 'Half day'
                    });
                    attendanceCount++;
                }
                // else: absent - no record
            }
        }

        console.log(`✓ Created ${attendanceCount} attendance records with ${breakCount} breaks`);

        // Create diverse leave requests covering all types
        const leaveRequests = [];

        // Pending leaves (future)
        for (let i = 0; i < 10; i++) {
            const employee = employees[i];
            const leaveType = leaveTypes[i % leaveTypes.length];
            const startDay = 7 + Math.floor(Math.random() * 30);
            const duration = leaveType === 'maternity' ? 90 :
                leaveType === 'paternity' ? 10 :
                    leaveType === 'sick' ? Math.floor(Math.random() * 3) + 1 :
                        Math.floor(Math.random() * 5) + 1;

            leaveRequests.push({
                userId: employee.id,
                leaveType,
                startDate: moment().add(startDay, 'days').format('YYYY-MM-DD'),
                endDate: moment().add(startDay + duration - 1, 'days').format('YYYY-MM-DD'),
                totalDays: duration,
                reason: `${leaveType.charAt(0).toUpperCase() + leaveType.slice(1)} leave request`,
                status: 'pending',
                requestedAt: new Date()
            });
        }

        // Approved leaves (past and present)
        for (let i = 10; i < 20; i++) {
            const employee = employees[i];
            const leaveType = leaveTypes[i % leaveTypes.length];
            const manager = managers.find(m => m.department === employee.department);
            const startDay = -Math.floor(Math.random() * 30);
            const duration = leaveType === 'maternity' ? 90 :
                leaveType === 'sick' ? Math.floor(Math.random() * 3) + 1 :
                    Math.floor(Math.random() * 5) + 1;

            leaveRequests.push({
                userId: employee.id,
                leaveType,
                startDate: moment().add(startDay, 'days').format('YYYY-MM-DD'),
                endDate: moment().add(startDay + duration - 1, 'days').format('YYYY-MM-DD'),
                totalDays: duration,
                reason: `${leaveType.charAt(0).toUpperCase() + leaveType.slice(1)} leave - approved`,
                status: 'approved',
                approvedBy: manager.id,
                approvedAt: moment().add(startDay - 2, 'days').toDate(),
                requestedAt: moment().add(startDay - 3, 'days').toDate()
            });
        }

        // Rejected leaves
        for (let i = 0; i < 5; i++) {
            const employee = employees[i];
            const manager = managers.find(m => m.department === employee.department);

            leaveRequests.push({
                userId: employee.id,
                leaveType: 'personal',
                startDate: moment().add(60 + i, 'days').format('YYYY-MM-DD'),
                endDate: moment().add(62 + i, 'days').format('YYYY-MM-DD'),
                totalDays: 3,
                reason: 'Personal reasons',
                status: 'rejected',
                approvedBy: manager.id,
                approvedAt: new Date(),
                comments: 'Insufficient staffing during this period',
                requestedAt: moment().subtract(5, 'days').toDate()
            });
        }

        await Promise.all(leaveRequests.map(leave => Leave.create(leave)));

        console.log(`✓ Created ${leaveRequests.length} leave requests (all types)`);

        console.log('\n=== EXTENDED SEEDING COMPLETED ===');
        console.log(`Total Users: ${allUsers.length}`);
        console.log(`  - Admins: 1`);
        console.log(`  - Managers: ${managers.length}`);
        console.log(`  - Employees: ${employees.length}`);
        console.log(`Total Attendance Records: ${attendanceCount}`);
        console.log(`Total Break Records: ${breakCount}`);
        console.log(`Total Leave Requests: ${leaveRequests.length}`);
        console.log('\n--- Login Credentials ---');
        console.log('Admin: admin@roc4tech.com / admin123');
        console.log('Managers: manager.<department>@roc4tech.com / manager123');
        console.log('Employees: employee1-20@roc4tech.com / employee123');
        console.log('==============================\n');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        await sequelize.close();
    }
};

// Run seeding if this script is executed directly
if (require.main === module) {
    seedExtendedDatabase();
}

module.exports = seedExtendedDatabase;
