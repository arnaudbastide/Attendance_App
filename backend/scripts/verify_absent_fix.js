const axios = require('axios');

async function verifyAbsentFix() {
    const BASE_URL = 'http://localhost:8080/api';

    try {
        // 1. Login
        console.log('Logging in...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@roc4tech.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // 2. Fetch Absent Employees
        console.log('Fetching Absent Employees...');
        const res = await axios.get(`${BASE_URL}/attendance/team?status=absent`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const absentEmployees = res.data.attendances.map(a => a.user.name);
        console.log('Absent Employees Found:', absentEmployees);

        // Expected: Should include 'Charlie Analyst', 'Dave Wilson', 'Eve Intern'.
        // Should NOT include 'Admin', 'Alice', 'John', 'Test Admin' (On Leave), 'Bob Designer'.

    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) console.log(error.response.data);
    }
}

verifyAbsentFix();
