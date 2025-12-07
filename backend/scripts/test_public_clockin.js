const axios = require('axios');

async function testPublicClockIn() {
    const BASE_URL = 'http://localhost:8080/api';

    try {
        // 1. Login
        console.log('Logging in as Alice...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'alice@roc4tech.com',
            password: 'employee123'
        });
        const token = loginRes.data.token;
        console.log('Login successful.');

        // 2. Clock In
        console.log('Attempting Clock In...');
        const clockInRes = await axios.post(`${BASE_URL}/attendance/clock-in`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Clock In Success:', clockInRes.data);

    } catch (error) {
        if (error.response) {
            console.log('Request Failed Status:', error.response.status);
            console.log('Request Failed Data:', error.response.data);
        } else {
            console.error('Network/Client Error:', error.message);
        }
    }
}

testPublicClockIn();
