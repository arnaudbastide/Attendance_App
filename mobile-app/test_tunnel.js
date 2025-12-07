const axios = require('axios');

// const API_URL = 'http://localhost:5000/api';
const API_URL = 'https://busy-crabs-clap.loca.lt/api';

async function test() {
    try {
        console.log(`Testing URL: ${API_URL}`);

        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'alice@roc4tech.com',
            password: 'employee123'
        });

        if (!loginRes.data.success) {
            throw new Error('Login failed');
        }

        const token = loginRes.data.token;
        console.log('-> Login success. Token acquired.');

        // 2. Clock In
        console.log('2. Attempting Clock In with POST...');
        const clockInRes = await axios.post(
            `${API_URL}/attendance/clock-in`,
            {
                location: {
                    latitude: 48.8566,
                    longitude: 2.3522
                }
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('-> Clock In Result:', clockInRes.data);

    } catch (error) {
        console.error('-> FAILED:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

test();
