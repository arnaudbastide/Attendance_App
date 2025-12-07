const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function debugAttendancePage() {
    try {
        console.log('--- DEBUGGING ATTENDANCE PAGE API ---');

        console.log('Logging in Admin...');
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@roc4tech.com',
            password: 'admin123'
        });
        const token = adminLogin.data.token;

        // Simulate Frontend Request from AttendancePage.js
        console.log('\n[Test 1] Fetching Team Attendance (Default Params)...');
        try {
            const res1 = await axios.get(`${BASE_URL}/attendance/team`, {
                params: {
                    page: 1,
                    limit: 10,
                    startDate: '2020-01-01',
                    endDate: '2030-12-31'
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ PASS: Records:', res1.data.attendances.length);
        } catch (e) {
            console.log('❌ FAIL: Request failed!');
            if (e.response) {
                console.log('Status:', e.response.status);
                console.log('Data:', JSON.stringify(e.response.data, null, 2));
            } else {
                console.log('Error:', e.message);
            }
        }

    } catch (error) {
        console.error('FATAL:', error.message);
    }
}

debugAttendancePage();
