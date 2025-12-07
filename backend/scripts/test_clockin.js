const axios = require('axios');

async function testClockIn() {
    try {
        // 1. Login
        console.log('Logging in as Admin...');
        const loginRes = await axios.post('http://localhost:8080/api/auth/login', {
            email: 'admin@roc4tech.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');

        // 2. Clock In
        console.log('Attempting Clock In...');
        const clockInRes = await axios.post('http://localhost:8080/api/attendance/clock-in', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Clock In Success:', clockInRes.data);

    } catch (error) {
        if (error.response) {
            console.log('Clock In Failed Status:', error.response.status);
            console.log('Clock In Failed Data:', error.response.data);
        } else {
            console.error('Network/Client Error:', error.message);
        }
    }
}

testClockIn();
