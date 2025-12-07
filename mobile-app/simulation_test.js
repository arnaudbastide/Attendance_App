const axios = require('axios');

// Using localhost because I am running ON the server machine.
// The real app uses 192.168.1.10, but the logic is the exact same.
const API_URL = 'http://localhost:5000/api';

async function simulateMobileApp() {
    console.log('📱 [Mobile Sim] Starting App...');

    try {
        // 1. Login
        console.log('📱 [Mobile Sim] Attempting Login as employee1@roc4tech.com...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'employee1@roc4tech.com',
            password: 'employee123'
        });

        if (loginRes.data.success) {
            console.log('✅ [Mobile Sim] Login Successful!');
            const token = loginRes.data.token;
            const user = loginRes.data.user;
            console.log(`   User: ${user.name} (${user.role})`);

            // 2. Dashboard Stats (Home Screen)
            console.log('📱 [Mobile Sim] Fetching Home Screen Data...');
            const dashboardRes = await axios.get(`${API_URL}/reports/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ [Mobile Sim] Home Screen Data Loaded.');
            console.log(`   Current Status: ${dashboardRes.data.stats.activity}`);

            // 3. Clock In (Action)
            console.log('📱 [Mobile Sim] User pressed "CLOCK IN"...');
            // Check if already clocked in/out to toggle
            const type = dashboardRes.data.stats.activity === 'checked_in' ? 'clock-out' : 'clock-in';

            const clockRes = await axios.post(`${API_URL}/attendance/${type}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (clockRes.data.success) {
                console.log(`✅ [Mobile Sim] ${type.toUpperCase()} Success!`);
                console.log(`   Message: ${clockRes.data.message}`);
                console.log('🚀 [Mobile Sim] Real-time event should have been sent to Dashboard!');
            } else {
                console.error('❌ [Mobile Sim] Clock Action Failed:', clockRes.data.message);
            }

        } else {
            console.error('❌ [Mobile Sim] Login Failed');
        }

    } catch (error) {
        console.error('❌ [Mobile Sim] Error:', error.message);
        if (error.response) {
            console.error('   Server Response:', error.response.data);
        }
    }
}

simulateMobileApp();
