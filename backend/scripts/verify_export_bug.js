const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080/api';

async function verifyExportBug() {
    try {
        console.log('--- VERIFYING EXPORT BUG ---');

        console.log('Logging in Admin...');
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@roc4tech.com',
            password: 'admin123'
        });
        const token = adminLogin.data.token;

        // Test CSV Export
        console.log('\n[Test 1] Exporting CSV (format=csv, YYYY-MM-DD)...');
        try {
            const res1 = await axios.get(`${BASE_URL}/reports/attendance`, {
                params: { startDate: '2025-12-01', endDate: '2025-12-31', format: 'csv' },
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'arraybuffer' // Expect binary/text
            });
            console.log('✅ PASS: CSV Export success. Size:', res1.data.length);
            // fs.writeFileSync('test_report.csv', res1.data);
        } catch (e) {
            console.log('❌ FAIL: CSV Export failed:', e.message);
            if (e.response && e.response.data) {
                console.log('Error Data:', e.response.data.toString());
            }
        }

        // Test PDF Export
        console.log('\n[Test 2] Exporting PDF (format=pdf, YYYY-MM-DD)...');
        try {
            const res2 = await axios.get(`${BASE_URL}/reports/attendance`, {
                params: { startDate: '2025-12-01', endDate: '2025-12-31', format: 'pdf' },
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'arraybuffer'
            });
            console.log('✅ PASS: PDF Export success. Size:', res2.data.length);
        } catch (e) {
            console.log('❌ FAIL: PDF Export failed:', e.message);
            if (e.response && e.response.data) {
                console.log('Error Data:', e.response.data.toString());
            }
        }

    } catch (error) {
        console.error('FATAL SYSTEM ERROR:', error.message);
    }
}

verifyExportBug();
