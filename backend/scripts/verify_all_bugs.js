const axios = require('axios');
const moment = require('moment');

const BASE_URL = 'http://localhost:8080/api';

async function verifyAllBugs() {
    try {
        console.log('--- STARTING COMPREHENSIVE BUG VERIFICATION ---');

        console.log('Logging in Admin...');
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@roc4tech.com',
            password: 'admin123'
        });
        const adminToken = adminLogin.data.token;

        console.log('Logging in Alice...');
        const aliceLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'alice@roc4tech.com',
            password: 'employee123'
        });
        const aliceToken = aliceLogin.data.token;

        // 1. Setup: Ensure Alice has Approved Leave
        console.log('\n[Setup] Ensuring Approved Leave for Alice...');
        const today = moment().format('YYYY-MM-DD');
        let leaveId;

        // Check existing leaves
        const myLeaves = await axios.get(`${BASE_URL}/leaves/my`, {
            headers: { Authorization: `Bearer ${aliceToken}` }
        });
        const existingLeave = myLeaves.data.leaves.find(l => l.startDate === today);

        if (existingLeave) {
            console.log(`Found existing leave (Status: ${existingLeave.status})`);
            leaveId = existingLeave.id;
            if (existingLeave.status !== 'approved') {
                // Approve it
                console.log('Approving existing leave...');
                await axios.put(`${BASE_URL}/leaves/${leaveId}/approve`, {
                    status: 'approved'
                }, { headers: { Authorization: `Bearer ${adminToken}` } });
            }
        } else {
            console.log('Creating new leave request...');
            const leaveReq = await axios.post(`${BASE_URL}/leaves`, {
                leaveType: 'sick',
                startDate: today,
                endDate: today,
                reason: 'Verification Test'
            }, { headers: { Authorization: `Bearer ${aliceToken}` } });
            leaveId = leaveReq.data.leave.id;

            console.log('Approving new leave...');
            await axios.put(`${BASE_URL}/leaves/${leaveId}/approve`, {
                status: 'approved'
            }, { headers: { Authorization: `Bearer ${adminToken}` } });
        }

        console.log('✅ Setup Complete: Alice is now on Approved Leave.');

        // 2. Verify Bug #6: Employee Leave Status
        console.log('\n[Bug #6] Verifying Leave Status Blocking (Alice)...');

        // Check Status
        const statusRes = await axios.get(`${BASE_URL}/attendance/status`, {
            headers: { Authorization: `Bearer ${aliceToken}` }
        });
        console.log('Alice Status:', statusRes.data.status);

        if (statusRes.data.status === 'on_leave') {
            console.log('✅ PASS: Status correctly shows "on_leave".');
        } else {
            console.log('❌ FAIL: Status should be "on_leave". Got:', statusRes.data.status);
        }

        // Attempt Clock In (Should fail)
        try {
            await axios.post(`${BASE_URL}/attendance/clock-in`, {}, {
                headers: { Authorization: `Bearer ${aliceToken}` }
            });
            console.log('❌ FAIL: Clock-In succeeded but should have been blocked.');
        } catch (err) {
            if (err.response && err.response.status === 400 && (
                err.response.data.message.includes('leave') ||
                err.response.data.message.includes('Leave')
            )) {
                console.log('✅ PASS: Clock-In correctly blocked with message:', err.response.data.message);
            } else {
                console.log('❌ FAIL: Error received but not the expected blocking message.', err.message);
                if (err.response) console.log(err.response.data);
            }
        }

        // 3. Verify Bug #1 & #2 (Absent/Team)
        console.log('\n[Bug #1 & #2] Verifying Team View...');
        const usersRes = await axios.get(`${BASE_URL}/attendance/team`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const users = usersRes.data.attendances;
        console.log(`Total Records: ${users.length}`);

        // Check Alice status in Team View
        const aliceRecord = users.find(u => u.user.email === 'alice@roc4tech.com');
        // Note: Alice has attendance AND Leave now. Status priority in getTeamAttendance?
        // The previous run showed "late".

        console.log('Alice Team View Status:', aliceRecord ? aliceRecord.status : 'undefined');

        // Check Absent
        const absentRes = await axios.get(`${BASE_URL}/attendance/team?status=absent`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const absentNames = absentRes.data.attendances.map(a => a.user.name);
        console.log('Absent Names:', absentNames);

        if (!absentNames.includes('Alice Developer')) {
            console.log('✅ PASS: Alice excluded from Absent list.');
        } else {
            console.log('❌ FAIL: Alice is in Absent list (Should be present or on_leave).');
        }

        // 4. Verify Bug #5: Dashboard Stats (Negative Absent fix)
        console.log('\n[Bug #5] Verifying Dashboard Stats (No Negative Inputs)...');
        const statsRes = await axios.get(`${BASE_URL}/reports/dashboard`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const stats = statsRes.data.stats;
        console.log('Dashboard Stats:', stats);
        if (stats.absentToday >= 0) {
            console.log(`✅ PASS: Absent Count is valid (${stats.absentToday}).`);
        } else {
            console.log(`❌ FAIL: Absent Count is NEGATIVE (${stats.absentToday}).`);
        }

        console.log('\n--- VERIFICATION COMPLETE ---');

    } catch (error) {
        console.error('FATAL SYSTEM ERROR:', error.message);
        if (error.response) console.log(error.response.data);
    }
}

verifyAllBugs();
