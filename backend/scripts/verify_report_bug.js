const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function verifyReportBug() {
    try {
        console.log('--- VERIFYING REPORT GENERATION BUG ---');

        console.log('Logging in Admin...');
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@roc4tech.com',
            password: 'admin123'
        });
        const token = adminLogin.data.token;

        // Test Case 1: Standard ISO Date (Should work)
        console.log('\n[Test 1] Requesting Report (YYYY-MM-DD)...');
        try {
            const res1 = await axios.get(`${BASE_URL}/reports/attendance`, {
                params: { startDate: '2025-12-01', endDate: '2025-12-31' },
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ PASS: ISO Date Report loaded. Items:', res1.data.length);
        } catch (e) {
            console.log('❌ FAIL: ISO Date Report failed:', e.response ? e.response.data : e.message);
        }

        // Test Case 2: Frontend format (MM/DD/YYYY) - As seen in screenshot
        console.log('\n[Test 2] Requesting Report (MM/DD/YYYY)...');
        try {
            const res2 = await axios.get(`${BASE_URL}/reports/attendance`, {
                params: { startDate: '12/01/2025', endDate: '12/31/2025' },
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ PASS: MM/DD/YYYY Report loaded. Items:', res2.data.length);
        } catch (e) {
            console.log('❌ FAIL: MM/DD/YYYY Report failed:', e.response ? e.response.data : e.message);
        }

    } catch (error) {
        console.error('FATAL ERROR:', error.message);
    }
}

verifyReportBug();
