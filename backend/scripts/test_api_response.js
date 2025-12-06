const { getTeamAttendance } = require('../controllers/attendanceController');
const { User } = require('../models');

// Mock Request and Response
const req = {
    query: {
        page: 1,
        limit: 10,
        startDate: new Date().toISOString().split('T')[0], // Today
        endDate: new Date().toISOString().split('T')[0]    // Today
    },
    user: {
        id: '9db54234-9552-4114-a187-4ced63602826', // John Manager
        role: 'manager'
    }
};

const res = {
    json: (data) => {
        console.log('--- API RESPONSE ---');
        console.log(`Success: ${data.success}`);
        console.log(`Total Records: ${data.pagination.total}`);

        console.log('\n--- ATTENDANCE RECORDS ---');
        data.attendances.forEach(r => {
            console.log(`User: ${r.user.name.padEnd(20)} | Status: ${r.status.padEnd(12)} | Date: ${r.date}`);
        });

        if (data.pagination.total === 6) {
            // Note: John sees his team + himself? 
            // Logic in controller: "Managers can only see their team". 
            // Our fix_managers assigned Bob and TestAdmin to John.
            // John also reports to John? Or John has null manager?
            // Let's check the output.
            // If John has managerId=null, he might NOT see himself if the filter is strict on managerId=John's ID.
            // But usually managers see themselves or we should check the logic.
            // Logic: userWhereClause.managerId = req.user.id;
            // John's managerId is usually null. So he won't see himself if he is not his own manager.
            // Wait, if John is the manager, he sees employees where managerId = John's ID.
            // Does John report to John? No.
            // So John might be invisible to himself in "Team Attendance"?
            // Admin sees all. Let's test as Admin too.
        }
    },
    status: (code) => ({
        json: (data) => console.log(`Error ${code}:`, data)
    })
};

const next = (err) => console.error('Error:', err);

async function test() {
    console.log('🧪 Testing getTeamAttendance as Manager (John)...');
    await getTeamAttendance(req, res, next);

    console.log('\n🧪 Testing getTeamAttendance as Admin...');
    req.user.role = 'admin';
    delete req.user.id; // Admin doesn't need ID for filter usually
    // Admin logic in controller: `if (req.user.role === 'manager')` check only.
    // So Admin should see EVERYONE (6 users).

    await getTeamAttendance(req, res, next);
}

test();
