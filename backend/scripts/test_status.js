const axios = require('axios');

async function testStatus() {
    const BASE_URL = 'http://localhost:8080/api';

    try {
        // 1. Login
        console.log('Logging in as Alice...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'alice@roc4tech.com',
            password: 'employee123'
        });
        const token = loginRes.data.token;
        console.log('Login successful. Token obtained.');

        // 2. Get Status
        console.log('Fetching Status...');
        const statusRes = await axios.get(`${BASE_URL}/attendance/status`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Status Response:', statusRes.data);

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.log(error.response.data);
    }
}

testStatus();
