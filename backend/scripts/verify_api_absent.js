const http = require('http');

function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => resolve(JSON.parse(body)));
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function verify() {
    try {
        // 1. Login
        const loginData = { email: 'admin@roc4tech.com', password: 'admin123' };
        const loginRes = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, loginData);

        if (!loginRes.success) throw new Error('Login failed');
        const token = loginRes.token;

        // 2. Get Absent Data
        const absentRes = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/attendance/team?status=absent',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('--- API RESPONSE ---');
        if (absentRes.success) {
            console.log('Count:', absentRes.attendances.length);
            console.log('Names:', absentRes.attendances.map(a => a.user.name));
        } else {
            console.log('Failed:', absentRes.message);
        }
    } catch (e) {
        console.error(e);
    }
}

verify();
