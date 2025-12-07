const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function verifyExportBug() {
    try {
        console.log('--- VERIFYING EXPORT BUG ---');

        // Login
        const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@roc4tech.com',
            password: 'admin123'
        });
        const token = adminLogin.data.token;

        // Test PDF Export
        console.log('\n[Test 2] Exporting PDF (format=pdf)...');
        try {
            const res2 = await axios.get(`${BASE_URL}/reports/attendance`, {
                params: { startDate: '2025-12-01', endDate: '2025-12-31', format: 'pdf' },
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'arraybuffer',
                timeout: 5000 // 5s timeout
            });
            console.log('✅ PASS: PDF Export success. Size:', res2.data.length);
        } catch (e) {
            console.log('❌ FAIL: PDF Export failed:', e.message);
        }

    } catch (error) {
        console.error('FATAL:', error.message);
    }
}

verifyExportBug();
